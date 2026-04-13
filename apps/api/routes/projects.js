const express = require('express');
const { prisma } = require('../../../packages/database/dist');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

function getPathKey(parentId, name) {
    return `${parentId || 'root'}::${name}`;
}

function normalizeIncomingProjectFile(rawFile) {
    if (!rawFile || typeof rawFile.name !== 'string' || rawFile.name.trim().length === 0) {
        return null;
    }

    return {
        incomingId: typeof rawFile.id === 'string' && rawFile.id.trim().length > 0 ? rawFile.id : null,
        name: rawFile.name.trim(),
        type: typeof rawFile.type === 'string' && rawFile.type.trim().length > 0 ? rawFile.type.trim() : 'text',
        content: typeof rawFile.content === 'string' ? rawFile.content : '',
        parentId: typeof rawFile.parentId === 'string' && rawFile.parentId.trim().length > 0 ? rawFile.parentId : null,
    };
}

function getIncomingDepth(file, incomingById, memo, trail = new Set()) {
    const currentId = file.incomingId;
    if (!currentId) return 0;
    if (memo.has(currentId)) return memo.get(currentId);

    if (!file.parentId || !incomingById.has(file.parentId) || trail.has(currentId)) {
        memo.set(currentId, 0);
        return 0;
    }

    trail.add(currentId);
    const parent = incomingById.get(file.parentId);
    const depth = 1 + getIncomingDepth(parent, incomingById, memo, trail);
    trail.delete(currentId);
    memo.set(currentId, depth);
    return depth;
}

function removeFromPathIndex(index, file) {
    const pathKey = getPathKey(file.parentId, file.name);
    const bucket = index.get(pathKey);
    if (!bucket) return;

    const nextBucket = bucket.filter((entry) => entry.id !== file.id);
    if (nextBucket.length > 0) {
        index.set(pathKey, nextBucket);
    } else {
        index.delete(pathKey);
    }
}

function addToPathIndex(index, file) {
    const pathKey = getPathKey(file.parentId, file.name);
    const bucket = index.get(pathKey) || [];
    if (!bucket.some((entry) => entry.id === file.id)) {
        bucket.push(file);
        index.set(pathKey, bucket);
    }
}

// Protect all project routes
router.use(authMiddleware);

// Get all projects for a user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await prisma.project.findMany({
            where: { userId: userId },
            include: { files: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get a specific project with all its files
router.get('/:id', async (req, res) => {
    try {
        const project = await prisma.project.findFirst({
            where: { id: req.params.id, userId: req.user.id },
            include: { files: true }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Create a new project (Instantiates main.blockly and main.cpp defaults)
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;

        // 1. Create the Project and Root Folder first
        const project = await prisma.project.create({
            data: {
                name: name || 'Untitled Project',
                description: description || '',
                userId: userId
            }
        });

        const srcFolder = await prisma.file.create({
            data: {
                projectId: project.id,
                name: 'src',
                content: '',
                type: 'folder'
            }
        });

        // Scaffold inner files linking to the `src` folder
        await Promise.all([
            prisma.file.create({ data: { projectId: project.id, parentId: srcFolder.id, name: 'main.blockly', content: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>', type: 'blockly' } }),
            prisma.file.create({ data: { projectId: project.id, parentId: srcFolder.id, name: 'main.cpp', content: '', type: 'cpp' } }),
            prisma.file.create({ data: { projectId: project.id, parentId: srcFolder.id, name: 'main.py', content: '', type: 'python' } })
        ]);

        const finalProject = await prisma.project.findUnique({
            where: { id: project.id },
            include: { files: true }
        });

        res.status(201).json(finalProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Bulk Save / Update Project Files
router.put('/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const { name, description, files } = req.body;
        const userId = req.user.id;

        // Verify ownership
        const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
        if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });

        // Update Project Metadata
        await prisma.project.update({
            where: { id: projectId },
            data: {
                name: name !== undefined ? name : undefined,
                description: description !== undefined ? description : undefined
            }
        });

        // Bulk upsert files and remove stale entries so reloads stay in sync.
        if (Array.isArray(files)) {
            const incomingFiles = files
                .map(normalizeIncomingProjectFile)
                .filter(Boolean);
            const incomingById = new Map(incomingFiles.filter((file) => file.incomingId).map((file) => [file.incomingId, file]));
            const incomingDepthMemo = new Map();
            const sortedIncomingFiles = [...incomingFiles].sort((left, right) => {
                const depthDiff = getIncomingDepth(left, incomingById, incomingDepthMemo) - getIncomingDepth(right, incomingById, incomingDepthMemo);
                if (depthDiff !== 0) return depthDiff;
                if (left.type === 'folder' && right.type !== 'folder') return -1;
                if (left.type !== 'folder' && right.type === 'folder') return 1;
                return left.name.localeCompare(right.name);
            });

            const existingFiles = await prisma.file.findMany({ where: { projectId } });
            const existingById = new Map(existingFiles.map((file) => [file.id, file]));
            const existingByPath = new Map();
            const incomingToPersistedId = new Map();
            const persistedIdsToKeep = new Set();

            for (const file of existingFiles) {
                addToPathIndex(existingByPath, file);
            }

            for (const incomingFile of sortedIncomingFiles) {
                const resolvedParentId = incomingFile.parentId
                    ? incomingToPersistedId.get(incomingFile.parentId) || (existingById.has(incomingFile.parentId) ? incomingFile.parentId : null)
                    : null;
                let targetFile = null;

                if (incomingFile.incomingId) {
                    const remappedId = incomingToPersistedId.get(incomingFile.incomingId);
                    if (remappedId && existingById.has(remappedId)) {
                        targetFile = existingById.get(remappedId);
                    } else if (existingById.has(incomingFile.incomingId)) {
                        targetFile = existingById.get(incomingFile.incomingId);
                    }
                }

                if (!targetFile) {
                    const pathMatches = existingByPath.get(getPathKey(resolvedParentId, incomingFile.name)) || [];
                    if (pathMatches.length === 1) {
                        targetFile = pathMatches[0];
                    }
                }

                if (targetFile) {
                    removeFromPathIndex(existingByPath, targetFile);
                    const updated = await prisma.file.update({
                        where: { id: targetFile.id },
                        data: {
                            name: incomingFile.name,
                            type: incomingFile.type,
                            content: incomingFile.content,
                            parentId: resolvedParentId
                        }
                    });

                    existingById.set(updated.id, updated);
                    addToPathIndex(existingByPath, updated);
                    persistedIdsToKeep.add(updated.id);
                    if (incomingFile.incomingId) {
                        incomingToPersistedId.set(incomingFile.incomingId, updated.id);
                    }
                    continue;
                }

                const created = await prisma.file.create({
                    data: {
                        projectId,
                        name: incomingFile.name,
                        type: incomingFile.type,
                        content: incomingFile.content,
                        parentId: resolvedParentId
                    }
                });

                existingById.set(created.id, created);
                addToPathIndex(existingByPath, created);
                persistedIdsToKeep.add(created.id);
                if (incomingFile.incomingId) {
                    incomingToPersistedId.set(incomingFile.incomingId, created.id);
                }
            }

            await prisma.file.deleteMany({
                where: {
                    projectId,
                    id: { notIn: Array.from(persistedIdsToKeep) }
                }
            });
        }

        res.status(200).json({ message: 'Project saved successfully', projectId });
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(500).json({ error: 'Failed to save project' });
    }
});

// Delete a project
router.delete('/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;

        // Verify ownership before deleting
        const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
        if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });

        await prisma.project.delete({
            where: { id: projectId }
        });

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

module.exports = router;

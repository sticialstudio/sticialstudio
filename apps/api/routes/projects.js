const express = require('express');
const { prisma } = require('../../../packages/database/dist');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

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

        // Bulk upsert files if provided
        if (Array.isArray(files)) {
            const existingFiles = await prisma.file.findMany({ where: { projectId } });
            const existingById = new Map(existingFiles.map((file) => [file.id, file]));
            const existingByPath = new Map();

            for (const file of existingFiles) {
                const pathKey = `${file.parentId || 'root'}::${file.name}`;
                const bucket = existingByPath.get(pathKey) || [];
                bucket.push(file);
                existingByPath.set(pathKey, bucket);
            }

            for (const rawFile of files) {
                if (!rawFile || typeof rawFile.name !== 'string' || rawFile.name.trim().length === 0) {
                    continue;
                }

                const normalizedName = rawFile.name.trim();
                const normalizedType = typeof rawFile.type === 'string' && rawFile.type.trim().length > 0
                    ? rawFile.type.trim()
                    : 'text';
                const normalizedContent = typeof rawFile.content === 'string' ? rawFile.content : '';
                const normalizedParentId = typeof rawFile.parentId === 'string' && rawFile.parentId.trim().length > 0
                    ? rawFile.parentId
                    : null;
                const incomingId = typeof rawFile.id === 'string' ? rawFile.id : null;

                let targetFile = null;

                if (incomingId && existingById.has(incomingId)) {
                    targetFile = existingById.get(incomingId);
                }

                // Fallback for temporary client IDs: match by logical path only when unique.
                if (!targetFile) {
                    const pathKey = `${normalizedParentId || 'root'}::${normalizedName}`;
                    const pathMatches = existingByPath.get(pathKey) || [];
                    if (pathMatches.length === 1) {
                        targetFile = pathMatches[0];
                    }
                }

                if (targetFile) {
                    const updated = await prisma.file.update({
                        where: { id: targetFile.id },
                        data: {
                            name: normalizedName,
                            type: normalizedType,
                            content: normalizedContent,
                            parentId: normalizedParentId
                        }
                    });

                    existingById.set(updated.id, updated);
                    const pathKey = `${updated.parentId || 'root'}::${updated.name}`;
                    const bucket = existingByPath.get(pathKey) || [];
                    if (!bucket.some((file) => file.id === updated.id)) {
                        bucket.push(updated);
                        existingByPath.set(pathKey, bucket);
                    }
                } else {
                    const created = await prisma.file.create({
                        data: {
                            projectId,
                            name: normalizedName,
                            type: normalizedType,
                            content: normalizedContent,
                            parentId: normalizedParentId
                        }
                    });

                    existingById.set(created.id, created);
                    const pathKey = `${created.parentId || 'root'}::${created.name}`;
                    const bucket = existingByPath.get(pathKey) || [];
                    bucket.push(created);
                    existingByPath.set(pathKey, bucket);
                }
            }
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


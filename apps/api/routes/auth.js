const { prisma } = require('../../../packages/database/dist');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const { JWT_SECRET } = require('../config/authConfig');

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name }
        });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (e) {
        console.error('Registration Error:', e);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (e) {
        console.error('Login Error:', e);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// GET CURRENT USER PROFILE
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, createdAt: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (e) {
        console.error('Profile Error:', e);
        return res.status(500).json({ error: 'Failed to load profile' });
    }
});

module.exports = router;



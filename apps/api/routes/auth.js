const { prisma } = require('../../../packages/database/dist');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const { JWT_SECRET } = require('../config/authConfig');

function signAppToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function serializeUser(user) {
    return { id: user.id, email: user.email, name: user.name };
}

function getSupabaseConfig() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    return {
        supabaseUrl: supabaseUrl.replace(/\/+$/, ''),
        supabaseAnonKey,
    };
}

async function fetchSupabaseUser(accessToken) {
    const config = getSupabaseConfig();
    if (!config) {
        throw new Error('Supabase auth is not configured on the API.');
    }

    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
        headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        return null;
    }

    return response.json();
}

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

        const token = signAppToken(user);

        res.status(201).json({
            token,
            user: serializeUser(user)
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

        const token = signAppToken(user);

        res.status(200).json({
            token,
            user: serializeUser(user)
        });
    } catch (e) {
        console.error('Login Error:', e);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

router.post('/supabase/google', async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Supabase access token is required.' });
        }

        const supabaseUser = await fetchSupabaseUser(accessToken);
        const email = supabaseUser?.email?.trim().toLowerCase();

        if (!email) {
            return res.status(401).json({ error: 'Google sign-in did not return a valid email address.' });
        }

        const resolvedName =
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            null;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            const generatedPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: resolvedName,
                },
            });
        } else if (!user.name && resolvedName) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { name: resolvedName },
            });
        }

        const token = signAppToken(user);

        return res.status(200).json({
            token,
            user: serializeUser(user),
        });
    } catch (e) {
        console.error('Supabase Google Login Error:', e);
        return res.status(500).json({ error: 'Could not complete Google sign-in.' });
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

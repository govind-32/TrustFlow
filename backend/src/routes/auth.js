const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'trustflow-secret-key';

// In-memory user storage (demo)
const users = new Map();

/**
 * POST /auth/register
 * Register new user (seller/investor)
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, role, email } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role required' });
        }

        if (!['seller', 'investor'].includes(role)) {
            return res.status(400).json({ error: 'Role must be seller or investor' });
        }

        if (users.has(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        const user = {
            id: userId,
            username,
            password: hashedPassword,
            role,
            email: email || null,
            walletAddress: null,
            trustScore: role === 'seller' ? 50 : null,
            createdAt: new Date().toISOString()
        };

        users.set(username, user);

        const token = jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: userId, username, role, trustScore: user.trustScore }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /auth/login
 * Login with username/password
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = users.get(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                walletAddress: user.walletAddress,
                trustScore: user.trustScore
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /auth/link-wallet
 * Link wallet address to account
 */
router.post('/link-wallet', authenticateToken, async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const user = users.get(req.user.username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.walletAddress = walletAddress;

        res.json({
            message: 'Wallet linked successfully',
            walletAddress
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, (req, res) => {
    const user = users.get(req.user.username);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        walletAddress: user.walletAddress,
        trustScore: user.trustScore,
        createdAt: user.createdAt
    });
});

/**
 * Middleware: Authenticate JWT token
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Export middleware for use in other routes
router.authenticateToken = authenticateToken;
router.users = users;

module.exports = router;

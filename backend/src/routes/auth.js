const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { Users, SellerProfiles, InvestorProfiles, AuditLogs } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'trustflow-secret-key';

/**
 * POST /auth/register
 * Register new user (seller/investor)
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, role, email, phone } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role required' });
        }

        if (!['seller', 'investor'].includes(role.toLowerCase())) {
            return res.status(400).json({ error: 'Role must be seller or investor' });
        }

        // Check if username exists
        const existingUser = await Users.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await Users.create({
            role: role.toUpperCase(),
            username,
            email: email || null,
            phone: phone || null,
            passwordHash,
            walletAddress: null
        });

        // Create profile based on role
        if (role.toLowerCase() === 'seller') {
            await SellerProfiles.create({
                userId: user.id,
                businessName: null,
                gstNumber: null,
                industry: null
            });
        } else {
            await InvestorProfiles.create({
                userId: user.id,
                riskPreference: 'MEDIUM'
            });
        }

        // Audit log
        await AuditLogs.create({
            entityType: 'USER',
            entityId: user.id,
            action: 'USER_REGISTERED',
            performedBy: 'system',
            metadata: { role: user.role }
        });

        const token = jwt.sign(
            { userId: user.id, username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: user.id, username, role: user.role }
        });
    } catch (error) {
        console.error('Register error:', error);
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

        const user = await Users.findByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get profile data
        let profile = null;
        if (user.role === 'SELLER') {
            profile = await SellerProfiles.findByUserId(user.id);
        } else if (user.role === 'INVESTOR') {
            profile = await InvestorProfiles.findByUserId(user.id);
        }

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                walletAddress: user.wallet_address,
                trustScore: profile?.trust_score || null
            }
        });
    } catch (error) {
        console.error('Login error:', error);
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

        const user = await Users.linkWallet(req.user.userId, walletAddress);

        // Audit log
        await AuditLogs.create({
            entityType: 'USER',
            entityId: user.id,
            action: 'WALLET_LINKED',
            performedBy: user.id,
            metadata: { walletAddress }
        });

        res.json({
            message: 'Wallet linked successfully',
            walletAddress: user.wallet_address
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await Users.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let profile = null;
        if (user.role === 'SELLER') {
            profile = await SellerProfiles.findByUserId(user.id);
        } else if (user.role === 'INVESTOR') {
            profile = await InvestorProfiles.findByUserId(user.id);
        }

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            walletAddress: user.wallet_address,
            isWalletLinked: user.is_wallet_linked,
            trustScore: profile?.trust_score || null,
            createdAt: user.created_at
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

module.exports = router;

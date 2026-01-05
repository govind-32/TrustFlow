const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const authRoutes = require('./auth');

// In-memory MSME storage (demo)
const msmes = new Map();

/**
 * POST /msme/register
 * Create MSME profile
 */
router.post('/register', authRoutes.authenticateToken, (req, res) => {
    try {
        const { businessName, walletAddress } = req.body;
        const user = authRoutes.users.get(req.user.username);

        if (!user || user.role !== 'seller') {
            return res.status(403).json({ error: 'Only sellers can register as MSME' });
        }

        if (msmes.has(user.id)) {
            return res.status(400).json({ error: 'MSME profile already exists' });
        }

        const msme = {
            id: user.id,
            businessName: businessName || 'Demo Business',
            walletAddress: walletAddress || user.walletAddress,
            trustScore: 50,
            invoiceHistory: [],
            totalLiquidity: 0,
            successfulInvoices: 0,
            defaultedInvoices: 0,
            createdAt: new Date().toISOString()
        };

        msmes.set(user.id, msme);

        res.status(201).json({
            message: 'MSME profile created',
            msme
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /msme/:id
 * Get MSME profile by ID or wallet address
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;

    // Try to find by ID first
    let msme = msmes.get(id);

    // If not found, search by wallet address
    if (!msme) {
        for (const [, m] of msmes) {
            if (m.walletAddress && m.walletAddress.toLowerCase() === id.toLowerCase()) {
                msme = m;
                break;
            }
        }
    }

    if (!msme) {
        return res.status(404).json({ error: 'MSME not found' });
    }

    res.json(msme);
});

/**
 * GET /msme/:id/stats
 * Get MSME statistics
 */
router.get('/:id/stats', (req, res) => {
    const { id } = req.params;
    const msme = msmes.get(id);

    if (!msme) {
        return res.status(404).json({ error: 'MSME not found' });
    }

    res.json({
        trustScore: msme.trustScore,
        totalInvoices: msme.invoiceHistory.length,
        successfulInvoices: msme.successfulInvoices,
        defaultedInvoices: msme.defaultedInvoices,
        totalLiquidity: msme.totalLiquidity
    });
});

// Export for use in other routes
router.msmes = msmes;

module.exports = router;

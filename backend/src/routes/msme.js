const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const { SellerProfiles, AuditLogs } = require('../models');

/**
 * POST /msme/register
 * Create MSME/Seller profile
 */
router.post('/register', authRoutes.authenticateToken, async (req, res) => {
    try {
        const { businessName, gstNumber, industry, walletAddress } = req.body;

        // Check if profile already exists
        const existingProfile = await SellerProfiles.findByUserId(req.user.userId);
        if (existingProfile) {
            return res.status(400).json({ error: 'MSME profile already exists' });
        }

        // Update seller profile with business details
        const db = require('../config/database');
        const result = await db.query(
            `UPDATE seller_profiles 
             SET business_name = $1, gst_number = $2, industry = $3, updated_at = now()
             WHERE user_id = $4
             RETURNING *`,
            [businessName, gstNumber, industry, req.user.userId]
        );

        let profile = result.rows[0];

        // If profile doesn't exist, create it
        if (!profile) {
            profile = await SellerProfiles.create({
                userId: req.user.userId,
                businessName,
                gstNumber,
                industry
            });
        }

        // Link wallet if provided
        if (walletAddress) {
            const { Users } = require('../models');
            await Users.linkWallet(req.user.userId, walletAddress);
        }

        // Audit log
        await AuditLogs.create({
            entityType: 'USER',
            entityId: req.user.userId,
            action: 'MSME_PROFILE_UPDATED',
            performedBy: req.user.userId,
            metadata: { businessName, industry }
        });

        res.status(201).json({
            message: 'MSME profile created',
            msme: {
                id: profile.id,
                userId: profile.user_id,
                businessName: profile.business_name,
                gstNumber: profile.gst_number,
                industry: profile.industry,
                trustScore: profile.trust_score,
                totalInvoices: profile.total_invoices,
                successfulInvoices: profile.successful_invoices,
                defaultedInvoices: profile.defaulted_invoices,
                totalRaised: profile.total_raised
            }
        });
    } catch (error) {
        console.error('MSME register error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /msme/:id
 * Get MSME profile by user ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Try to find by user ID
        let profile = await SellerProfiles.findByUserId(id);

        if (!profile) {
            return res.status(404).json({ error: 'MSME not found' });
        }

        res.json({
            id: profile.id,
            userId: profile.user_id,
            businessName: profile.business_name,
            gstNumber: profile.gst_number,
            industry: profile.industry,
            trustScore: profile.trust_score,
            totalInvoices: profile.total_invoices,
            successfulInvoices: profile.successful_invoices,
            defaultedInvoices: profile.defaulted_invoices,
            totalRaised: profile.total_raised,
            createdAt: profile.created_at
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /msme/:id/stats
 * Get MSME statistics
 */
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await SellerProfiles.findByUserId(id);

        if (!profile) {
            return res.status(404).json({ error: 'MSME not found' });
        }

        res.json({
            trustScore: profile.trust_score,
            totalInvoices: profile.total_invoices,
            successfulInvoices: profile.successful_invoices,
            defaultedInvoices: profile.defaulted_invoices,
            totalRaised: parseFloat(profile.total_raised) || 0,
            successRate: profile.total_invoices > 0
                ? ((profile.successful_invoices / profile.total_invoices) * 100).toFixed(1)
                : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /msme/me
 * Get current user's MSME profile
 */
router.get('/profile/me', authRoutes.authenticateToken, async (req, res) => {
    try {
        const profile = await SellerProfiles.findByUserId(req.user.userId);

        if (!profile) {
            return res.status(404).json({ error: 'MSME profile not found' });
        }

        res.json({
            id: profile.id,
            userId: profile.user_id,
            businessName: profile.business_name,
            gstNumber: profile.gst_number,
            industry: profile.industry,
            trustScore: profile.trust_score,
            totalInvoices: profile.total_invoices,
            successfulInvoices: profile.successful_invoices,
            defaultedInvoices: profile.defaulted_invoices,
            totalRaised: profile.total_raised
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

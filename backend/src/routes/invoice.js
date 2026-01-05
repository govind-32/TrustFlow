const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const authRoutes = require('./auth');
const { Invoices, SellerProfiles, BuyerProfiles, BuyerConfirmations, TrustScores, Investments, AuditLogs } = require('../models');
const trustScoreService = require('../services/trustScore');

/**
 * POST /invoice/create
 * Create new invoice
 */
router.post('/create', authRoutes.authenticateToken, async (req, res) => {
    try {
        const { amount, dueDate, buyerEmail, buyerWallet, description, currency } = req.body;

        // Get seller profile
        const sellerProfile = await SellerProfiles.findByUserId(req.user.userId);
        if (!sellerProfile) {
            return res.status(403).json({ error: 'Seller profile not found. Please register as MSME first.' });
        }

        if (!amount || !dueDate) {
            return res.status(400).json({ error: 'Amount and due date required' });
        }

        if (!buyerEmail && !buyerWallet) {
            return res.status(400).json({ error: 'Buyer email or wallet required' });
        }

        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

        // Create invoice in database
        const invoice = await Invoices.create({
            invoiceNumber,
            sellerId: sellerProfile.id,
            buyerEmail: buyerEmail || null,
            buyerWallet: buyerWallet || null,
            amount: parseFloat(amount),
            currency: currency || 'ETH',
            dueDate,
            description: description || null,
            ipfsHash: null
        });

        // Ensure buyer profile exists
        if (buyerEmail) {
            await BuyerProfiles.findOrCreate(buyerEmail);
        }

        // Audit log
        await AuditLogs.create({
            entityType: 'INVOICE',
            entityId: invoice.id,
            action: 'INVOICE_CREATED',
            performedBy: req.user.userId,
            metadata: { amount, buyerEmail, buyerWallet }
        });

        // Generate verification link
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${invoice.id}`;

        res.status(201).json({
            message: 'Invoice created',
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoice_number,
                amount: invoice.amount,
                dueDate: invoice.due_date,
                status: invoice.status,
                verificationLink
            }
        });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /invoice/:id
 * Get invoice by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoices.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /verify/:id
 * Get invoice for buyer verification
 */
router.get('/verify/:id', async (req, res) => {
    try {
        const invoice = await Invoices.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invalid verification link' });
        }

        // Get seller info
        const seller = await SellerProfiles.findByUserId(invoice.seller_id);

        res.json({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount,
            dueDate: invoice.due_date,
            sellerName: seller?.business_name || 'Unknown',
            description: invoice.description,
            status: invoice.status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /invoice/:id/verify-web
 * Off-chain web confirmation (no wallet needed)
 */
router.post('/:id/verify-web', async (req, res) => {
    try {
        const { buyerEmail } = req.body;
        const invoice = await Invoices.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status !== 'CREATED') {
            return res.status(400).json({ error: 'Invoice already verified or processed' });
        }

        // Generate confirmation hash
        const platformSecret = process.env.PLATFORM_SECRET || 'trustflow-platform-secret';
        const confirmationData = `${invoice.id}|${buyerEmail}|${Date.now()}|${platformSecret}`;
        const confirmationHash = crypto.createHash('sha256').update(confirmationData).digest('hex');

        // Calculate trust score
        const trustScore = trustScoreService.calculateScore(invoice.seller_id, invoice.amount);
        const trustHash = crypto.createHash('sha256')
            .update(`${invoice.id}|${trustScore}`)
            .digest('hex');

        // Update invoice status
        await Invoices.updateStatus(invoice.id, 'BUYER_VERIFIED');
        await Invoices.setTrustScore(invoice.id, trustScore, trustHash);

        // Create buyer confirmation record
        await BuyerConfirmations.create({
            invoiceId: invoice.id,
            method: 'EMAIL',
            confirmationHash,
            buyerSignature: null
        });

        // Save trust score history
        const seller = await SellerProfiles.findByUserId(invoice.seller_id);
        await TrustScores.create({
            invoiceId: invoice.id,
            sellerId: seller?.id,
            buyerEmail,
            score: trustScore,
            breakdown: {
                sellerHistory: 40,
                buyerReputation: 25,
                invoiceSize: 20,
                penalties: 15
            }
        });

        // Audit log
        await AuditLogs.create({
            entityType: 'INVOICE',
            entityId: invoice.id,
            action: 'INVOICE_VERIFIED_WEB',
            performedBy: buyerEmail,
            metadata: { confirmationHash, trustScore }
        });

        res.json({
            message: 'Invoice verified via web confirmation',
            invoiceId: invoice.id,
            verificationHash: confirmationHash,
            trustScore
        });
    } catch (error) {
        console.error('Verify web error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /invoice/:id/verify-wallet
 * Wallet signature verification
 */
router.post('/:id/verify-wallet', async (req, res) => {
    try {
        const { signature, buyerAddress } = req.body;
        const invoice = await Invoices.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status !== 'CREATED') {
            return res.status(400).json({ error: 'Invoice already verified or processed' });
        }

        // In production, verify signature using ethers.js
        const signatureHash = crypto.createHash('sha256').update(signature).digest('hex');

        // Calculate trust score
        const trustScore = trustScoreService.calculateScore(invoice.seller_id, invoice.amount);
        const trustHash = crypto.createHash('sha256')
            .update(`${invoice.id}|${trustScore}`)
            .digest('hex');

        // Update invoice
        await Invoices.updateStatus(invoice.id, 'BUYER_VERIFIED');
        await Invoices.setTrustScore(invoice.id, trustScore, trustHash);

        // Create buyer confirmation record
        await BuyerConfirmations.create({
            invoiceId: invoice.id,
            method: 'WALLET',
            confirmationHash: signatureHash,
            buyerSignature: signature
        });

        // Audit log
        await AuditLogs.create({
            entityType: 'INVOICE',
            entityId: invoice.id,
            action: 'INVOICE_VERIFIED_WALLET',
            performedBy: buyerAddress,
            metadata: { signatureHash, trustScore }
        });

        res.json({
            message: 'Invoice verified via wallet signature',
            invoiceId: invoice.id,
            verificationHash: signatureHash,
            trustScore
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /invoice/:id/reject
 * Buyer rejects invoice
 */
router.post('/:id/reject', async (req, res) => {
    try {
        const invoice = await Invoices.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status !== 'CREATED') {
            return res.status(400).json({ error: 'Invoice cannot be rejected' });
        }

        await Invoices.updateStatus(invoice.id, 'REJECTED');

        // Audit log
        await AuditLogs.create({
            entityType: 'INVOICE',
            entityId: invoice.id,
            action: 'INVOICE_REJECTED',
            performedBy: 'buyer',
            metadata: {}
        });

        res.json({
            message: 'Invoice rejected',
            invoiceId: invoice.id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /invoice/:id/list
 * List invoice for funding (after verification)
 */
router.post('/:id/list', authRoutes.authenticateToken, async (req, res) => {
    try {
        const invoice = await Invoices.findById(req.params.id);
        const sellerProfile = await SellerProfiles.findByUserId(req.user.userId);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.seller_id !== sellerProfile?.id) {
            return res.status(403).json({ error: 'Only seller can list invoice' });
        }

        if (invoice.status !== 'BUYER_VERIFIED') {
            return res.status(400).json({ error: 'Invoice must be verified before listing' });
        }

        await Invoices.updateStatus(invoice.id, 'LISTED');

        // Audit log
        await AuditLogs.create({
            entityType: 'INVOICE',
            entityId: invoice.id,
            action: 'INVOICE_LISTED',
            performedBy: req.user.userId,
            metadata: {}
        });

        const updatedInvoice = await Invoices.findById(invoice.id);

        res.json({
            message: 'Invoice listed for funding',
            invoice: updatedInvoice
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /invoices/marketplace
 * Get all listed invoices for investors
 */
router.get('/list/marketplace', async (req, res) => {
    try {
        const listedInvoices = await Invoices.findListed();
        res.json(listedInvoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /invoices/seller
 * Get seller's invoices
 */
router.get('/list/seller', authRoutes.authenticateToken, async (req, res) => {
    try {
        const sellerProfile = await SellerProfiles.findByUserId(req.user.userId);
        if (!sellerProfile) {
            return res.json([]);
        }

        const sellerInvoices = await Invoices.findBySeller(sellerProfile.id);
        res.json(sellerInvoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /invoices/investor
 * Get investor's funded invoices
 */
router.get('/list/investor', authRoutes.authenticateToken, async (req, res) => {
    try {
        const investorProfile = await require('../models').InvestorProfiles.findByUserId(req.user.userId);
        if (!investorProfile) {
            return res.json([]);
        }

        const investments = await Investments.findByInvestor(investorProfile.id);
        res.json(investments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const authRoutes = require('./auth');
const msmeRoutes = require('./msme');
const trustScoreService = require('../services/trustScore');

// In-memory invoice storage (demo)
const invoices = new Map();
const verificationTokens = new Map();

/**
 * POST /invoice/create
 * Create new invoice
 */
router.post('/create', authRoutes.authenticateToken, (req, res) => {
    try {
        const { amount, dueDate, buyerEmail, buyerWallet, description } = req.body;
        const user = authRoutes.users.get(req.user.username);

        if (!user || user.role !== 'seller') {
            return res.status(403).json({ error: 'Only sellers can create invoices' });
        }

        if (!amount || !dueDate) {
            return res.status(400).json({ error: 'Amount and due date required' });
        }

        if (!buyerEmail && !buyerWallet) {
            return res.status(400).json({ error: 'Buyer email or wallet required' });
        }

        const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
        const verificationToken = uuidv4();

        const invoice = {
            id: invoiceId,
            sellerId: user.id,
            sellerUsername: user.username,
            sellerWallet: user.walletAddress,
            amount: parseFloat(amount),
            dueDate,
            buyerEmail: buyerEmail || null,
            buyerWallet: buyerWallet || null,
            description: description || '',
            ipfsHash: null,
            status: 'CREATED',
            trustScore: null,
            trustHash: null,
            verificationHash: null,
            verificationType: null,
            verificationToken,
            tokenId: null,
            investor: null,
            fundedAmount: null,
            fundedAt: null,
            settledAt: null,
            createdAt: new Date().toISOString()
        };

        invoices.set(invoiceId, invoice);
        verificationTokens.set(verificationToken, invoiceId);

        // Generate verification link for buyer
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${verificationToken}`;

        res.status(201).json({
            message: 'Invoice created',
            invoice: {
                ...invoice,
                verificationLink
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /invoice/:id
 * Get invoice by ID
 */
router.get('/:id', (req, res) => {
    const invoice = invoices.get(req.params.id);

    if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
});

/**
 * GET /verify/:token
 * Get invoice by verification token (for buyer web confirmation)
 */
router.get('/verify/:token', (req, res) => {
    const invoiceId = verificationTokens.get(req.params.token);

    if (!invoiceId) {
        return res.status(404).json({ error: 'Invalid verification link' });
    }

    const invoice = invoices.get(invoiceId);

    res.json({
        invoiceId: invoice.id,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        sellerName: invoice.sellerUsername,
        description: invoice.description,
        status: invoice.status
    });
});

/**
 * POST /invoice/:id/verify-web
 * Off-chain web confirmation (no wallet needed)
 */
router.post('/:id/verify-web', (req, res) => {
    try {
        const { token, buyerEmail } = req.body;
        const invoice = invoices.get(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status !== 'CREATED') {
            return res.status(400).json({ error: 'Invoice already verified or processed' });
        }

        // Verify token matches
        const expectedInvoiceId = verificationTokens.get(token);
        if (expectedInvoiceId !== invoice.id) {
            return res.status(403).json({ error: 'Invalid verification token' });
        }

        // Generate confirmation hash
        const platformSecret = process.env.PLATFORM_SECRET || 'trustflow-platform-secret';
        const confirmationData = `${invoice.id}|${buyerEmail}|${Date.now()}|${platformSecret}`;
        const confirmationHash = crypto.createHash('sha256').update(confirmationData).digest('hex');

        // Calculate trust score
        const trustScore = trustScoreService.calculateScore(invoice.sellerId, invoice.amount);
        const trustHash = crypto.createHash('sha256')
            .update(`${invoice.id}|${trustScore}`)
            .digest('hex');

        // Update invoice
        invoice.status = 'BUYER_VERIFIED';
        invoice.verificationHash = confirmationHash;
        invoice.verificationType = 'WEB_CONFIRMATION';
        invoice.trustScore = trustScore;
        invoice.trustHash = trustHash;
        invoice.buyerEmail = buyerEmail;

        res.json({
            message: 'Invoice verified via web confirmation',
            invoiceId: invoice.id,
            verificationHash: confirmationHash,
            trustScore
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /invoice/:id/verify-wallet
 * Wallet signature verification
 */
router.post('/:id/verify-wallet', (req, res) => {
    try {
        const { signature, buyerAddress } = req.body;
        const invoice = invoices.get(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status !== 'CREATED') {
            return res.status(400).json({ error: 'Invoice already verified or processed' });
        }

        // In production, verify signature using ethers.js
        // For demo, we'll accept the signature as-is
        const signatureHash = crypto.createHash('sha256').update(signature).digest('hex');

        // Calculate trust score
        const trustScore = trustScoreService.calculateScore(invoice.sellerId, invoice.amount);
        const trustHash = crypto.createHash('sha256')
            .update(`${invoice.id}|${trustScore}`)
            .digest('hex');

        // Update invoice
        invoice.status = 'BUYER_VERIFIED';
        invoice.verificationHash = signatureHash;
        invoice.verificationType = 'WALLET_SIGNATURE';
        invoice.buyerWallet = buyerAddress;
        invoice.trustScore = trustScore;
        invoice.trustHash = trustHash;

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
router.post('/:id/reject', (req, res) => {
    const invoice = invoices.get(req.params.id);

    if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'CREATED') {
        return res.status(400).json({ error: 'Invoice cannot be rejected' });
    }

    invoice.status = 'REJECTED';

    res.json({
        message: 'Invoice rejected',
        invoiceId: invoice.id
    });
});

/**
 * POST /invoice/:id/list
 * List invoice for funding (after verification)
 */
router.post('/:id/list', authRoutes.authenticateToken, (req, res) => {
    const invoice = invoices.get(req.params.id);
    const user = authRoutes.users.get(req.user.username);

    if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.sellerId !== user.id) {
        return res.status(403).json({ error: 'Only seller can list invoice' });
    }

    if (invoice.status !== 'BUYER_VERIFIED') {
        return res.status(400).json({ error: 'Invoice must be verified before listing' });
    }

    invoice.status = 'LISTED';

    res.json({
        message: 'Invoice listed for funding',
        invoice
    });
});

/**
 * GET /invoices/marketplace
 * Get all listed invoices for investors
 */
router.get('/list/marketplace', (req, res) => {
    const listedInvoices = [];

    for (const [, invoice] of invoices) {
        if (invoice.status === 'LISTED') {
            listedInvoices.push({
                id: invoice.id,
                amount: invoice.amount,
                dueDate: invoice.dueDate,
                sellerName: invoice.sellerUsername,
                trustScore: invoice.trustScore,
                createdAt: invoice.createdAt
            });
        }
    }

    res.json(listedInvoices);
});

/**
 * GET /invoices/seller
 * Get seller's invoices
 */
router.get('/list/seller', authRoutes.authenticateToken, (req, res) => {
    const user = authRoutes.users.get(req.user.username);
    const sellerInvoices = [];

    for (const [, invoice] of invoices) {
        if (invoice.sellerId === user.id) {
            sellerInvoices.push(invoice);
        }
    }

    res.json(sellerInvoices);
});

/**
 * GET /invoices/investor
 * Get investor's funded invoices
 */
router.get('/list/investor', authRoutes.authenticateToken, (req, res) => {
    const user = authRoutes.users.get(req.user.username);
    const investorInvoices = [];

    for (const [, invoice] of invoices) {
        if (invoice.investor === user.id) {
            investorInvoices.push(invoice);
        }
    }

    res.json(investorInvoices);
});

// Export for use in other routes
router.invoices = invoices;

module.exports = router;

/**
 * TrustFlow PostgreSQL Query Helpers
 * 
 * This module provides model-like functions for database operations.
 * Uses the PostgreSQL pool from config/database.js
 */

const db = require('../config/database');

// =============================================================================
// USERS
// =============================================================================
const Users = {
    async create({ role, username, email, phone, passwordHash, walletAddress }) {
        const result = await db.query(
            `INSERT INTO users (role, username, email, phone, password_hash, wallet_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [role, username, email, phone, passwordHash, walletAddress]
        );
        return result.rows[0];
    },

    async findByUsername(username) {
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0];
    },

    async findById(id) {
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    async findByWallet(walletAddress) {
        const result = await db.query(
            'SELECT * FROM users WHERE wallet_address = $1',
            [walletAddress.toLowerCase()]
        );
        return result.rows[0];
    },

    async linkWallet(userId, walletAddress) {
        const result = await db.query(
            `UPDATE users SET wallet_address = $1, is_wallet_linked = true, updated_at = now()
       WHERE id = $2 RETURNING *`,
            [walletAddress.toLowerCase(), userId]
        );
        return result.rows[0];
    }
};

// =============================================================================
// SELLER PROFILES
// =============================================================================
const SellerProfiles = {
    async create({ userId, businessName, gstNumber, industry }) {
        const result = await db.query(
            `INSERT INTO seller_profiles (user_id, business_name, gst_number, industry)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [userId, businessName, gstNumber, industry]
        );
        return result.rows[0];
    },

    async findByUserId(userId) {
        const result = await db.query(
            'SELECT * FROM seller_profiles WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    },

    async updateTrustScore(id, score) {
        const result = await db.query(
            `UPDATE seller_profiles SET trust_score = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
            [score, id]
        );
        return result.rows[0];
    },

    async incrementInvoiceCount(id, field) {
        const result = await db.query(
            `UPDATE seller_profiles SET ${field} = ${field} + 1, updated_at = now()
       WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }
};

// =============================================================================
// BUYER PROFILES
// =============================================================================
const BuyerProfiles = {
    async findOrCreate(email, companyName = null) {
        let result = await db.query(
            'SELECT * FROM buyer_profiles WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            result = await db.query(
                `INSERT INTO buyer_profiles (email, company_name)
         VALUES ($1, $2)
         RETURNING *`,
                [email.toLowerCase(), companyName]
            );
        }
        return result.rows[0];
    },

    async findByEmail(email) {
        const result = await db.query(
            'SELECT * FROM buyer_profiles WHERE email = $1',
            [email.toLowerCase()]
        );
        return result.rows[0];
    },

    async updateReputation(email, score) {
        const result = await db.query(
            `UPDATE buyer_profiles SET reputation_score = $1, updated_at = now()
       WHERE email = $2 RETURNING *`,
            [score, email.toLowerCase()]
        );
        return result.rows[0];
    }
};

// =============================================================================
// INVESTOR PROFILES
// =============================================================================
const InvestorProfiles = {
    async create({ userId, riskPreference = 'MEDIUM' }) {
        const result = await db.query(
            `INSERT INTO investor_profiles (user_id, risk_preference)
       VALUES ($1, $2)
       RETURNING *`,
            [userId, riskPreference]
        );
        return result.rows[0];
    },

    async findByUserId(userId) {
        const result = await db.query(
            'SELECT * FROM investor_profiles WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    }
};

// =============================================================================
// INVOICES
// =============================================================================
const Invoices = {
    async create({ invoiceNumber, sellerId, buyerEmail, buyerWallet, amount, currency, dueDate, description, ipfsHash }) {
        const result = await db.query(
            `INSERT INTO invoices (invoice_number, seller_id, buyer_email, buyer_wallet, amount, currency, due_date, description, ipfs_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [invoiceNumber, sellerId, buyerEmail, buyerWallet, amount, currency || 'ETH', dueDate, description, ipfsHash]
        );
        return result.rows[0];
    },

    async findById(id) {
        const result = await db.query(
            'SELECT * FROM invoices WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    async findByNumber(invoiceNumber) {
        const result = await db.query(
            'SELECT * FROM invoices WHERE invoice_number = $1',
            [invoiceNumber]
        );
        return result.rows[0];
    },

    async findBySeller(sellerId) {
        const result = await db.query(
            'SELECT * FROM invoices WHERE seller_id = $1 ORDER BY created_at DESC',
            [sellerId]
        );
        return result.rows;
    },

    async findByStatus(status) {
        const result = await db.query(
            'SELECT * FROM invoices WHERE status = $1 ORDER BY created_at DESC',
            [status]
        );
        return result.rows;
    },

    async findListed() {
        const result = await db.query(
            `SELECT i.*, sp.business_name as seller_name, sp.trust_score as seller_trust
       FROM invoices i
       JOIN seller_profiles sp ON i.seller_id = sp.id
       WHERE i.status = 'LISTED'
       ORDER BY i.trust_score DESC`
        );
        return result.rows;
    },

    async updateStatus(id, status) {
        const result = await db.query(
            `UPDATE invoices SET status = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0];
    },

    async setTrustScore(id, score, trustHash) {
        const result = await db.query(
            `UPDATE invoices SET trust_score = $1, trust_hash = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
            [score, trustHash, id]
        );
        return result.rows[0];
    },

    async setNftDetails(id, tokenId, escrowContract) {
        const result = await db.query(
            `UPDATE invoices SET nft_token_id = $1, escrow_contract = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
            [tokenId, escrowContract, id]
        );
        return result.rows[0];
    }
};

// =============================================================================
// BUYER CONFIRMATIONS
// =============================================================================
const BuyerConfirmations = {
    async create({ invoiceId, method, confirmationHash, buyerSignature }) {
        const result = await db.query(
            `INSERT INTO buyer_confirmations (invoice_id, method, confirmation_hash, buyer_signature)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [invoiceId, method, confirmationHash, buyerSignature]
        );
        return result.rows[0];
    },

    async findByInvoice(invoiceId) {
        const result = await db.query(
            'SELECT * FROM buyer_confirmations WHERE invoice_id = $1',
            [invoiceId]
        );
        return result.rows[0];
    }
};

// =============================================================================
// TRUST SCORES
// =============================================================================
const TrustScores = {
    async create({ invoiceId, sellerId, buyerEmail, score, breakdown }) {
        const result = await db.query(
            `INSERT INTO trust_scores (invoice_id, seller_id, buyer_email, score, seller_history, buyer_reputation, invoice_size, penalties)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [invoiceId, sellerId, buyerEmail, score, breakdown.sellerHistory, breakdown.buyerReputation, breakdown.invoiceSize, breakdown.penalties]
        );
        return result.rows[0];
    },

    async findByInvoice(invoiceId) {
        const result = await db.query(
            'SELECT * FROM trust_scores WHERE invoice_id = $1',
            [invoiceId]
        );
        return result.rows[0];
    }
};

// =============================================================================
// INVESTMENTS
// =============================================================================
const Investments = {
    async create({ invoiceId, investorId, investedAmount, expectedReturn, escrowTxHash }) {
        const result = await db.query(
            `INSERT INTO investments (invoice_id, investor_id, invested_amount, expected_return, escrow_tx_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [invoiceId, investorId, investedAmount, expectedReturn, escrowTxHash]
        );
        return result.rows[0];
    },

    async findByInvestor(investorId) {
        const result = await db.query(
            `SELECT inv.*, i.invoice_number, i.amount, i.due_date, i.status as invoice_status
       FROM investments inv
       JOIN invoices i ON inv.invoice_id = i.id
       WHERE inv.investor_id = $1
       ORDER BY inv.invested_at DESC`,
            [investorId]
        );
        return result.rows;
    },

    async updateStatus(id, status, settledAt = null) {
        const result = await db.query(
            `UPDATE investments SET status = $1, settled_at = $2
       WHERE id = $3 RETURNING *`,
            [status, settledAt, id]
        );
        return result.rows[0];
    }
};

// =============================================================================
// PAYMENTS
// =============================================================================
const Payments = {
    async create({ invoiceId, payer, amount, txHash, isLate, penaltyApplied }) {
        const result = await db.query(
            `INSERT INTO payments (invoice_id, payer, amount, tx_hash, is_late, penalty_applied)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [invoiceId, payer || 'BUYER', amount, txHash, isLate || false, penaltyApplied || 0]
        );
        return result.rows[0];
    },

    async findByInvoice(invoiceId) {
        const result = await db.query(
            'SELECT * FROM payments WHERE invoice_id = $1',
            [invoiceId]
        );
        return result.rows;
    }
};

// =============================================================================
// AUDIT LOGS
// =============================================================================
const AuditLogs = {
    async create({ entityType, entityId, action, performedBy, metadata }) {
        const result = await db.query(
            `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [entityType, entityId, action, performedBy, JSON.stringify(metadata)]
        );
        return result.rows[0];
    },

    async findByEntity(entityType, entityId) {
        const result = await db.query(
            'SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY timestamp DESC',
            [entityType, entityId]
        );
        return result.rows;
    }
};

// =============================================================================
// EXPORT ALL MODELS
// =============================================================================
module.exports = {
    Users,
    SellerProfiles,
    BuyerProfiles,
    InvestorProfiles,
    Invoices,
    BuyerConfirmations,
    TrustScores,
    Investments,
    Payments,
    AuditLogs
};

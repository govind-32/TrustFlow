/**
 * Trust Score Calculation Service
 * 
 * Formula:
 * - 40% MSME past success rate
 * - 25% Buyer reputation
 * - 20% Invoice size consistency
 * - 15% Late/default penalties
 * 
 * Uses PostgreSQL for history data
 */

const db = require('../config/database');

/**
 * Calculate trust score for an invoice
 * @param {string} sellerId - Seller profile ID
 * @param {number} invoiceAmount - Invoice amount
 * @returns {number} Trust score (0-100)
 */
async function calculateScore(sellerId, invoiceAmount) {
    let score = 50; // Base score
    let breakdown = {
        sellerHistory: 0,
        buyerReputation: 0,
        invoiceSize: 0,
        penalties: 0
    };

    try {
        // Factor 1: MSME past success (40%)
        const sellerResult = await db.query(
            `SELECT trust_score, total_invoices, successful_invoices, defaulted_invoices, total_raised
             FROM seller_profiles WHERE id = $1`,
            [sellerId]
        );

        if (sellerResult.rows.length > 0) {
            const seller = sellerResult.rows[0];

            if (seller.total_invoices > 0) {
                const successRate = seller.successful_invoices / seller.total_invoices;
                breakdown.sellerHistory = Math.round(successRate * 40);
                score += breakdown.sellerHistory;
            } else {
                // New seller, neutral score
                breakdown.sellerHistory = 20;
                score += 20;
            }

            // Factor 3: Invoice size consistency (20%)
            if (seller.total_invoices > 0 && seller.total_raised > 0) {
                const avgAmount = parseFloat(seller.total_raised) / seller.total_invoices;
                const deviation = Math.abs(invoiceAmount - avgAmount) / avgAmount;

                if (deviation < 0.2) {
                    breakdown.invoiceSize = 20;
                } else if (deviation < 0.5) {
                    breakdown.invoiceSize = 15;
                } else if (deviation < 1) {
                    breakdown.invoiceSize = 10;
                } else {
                    breakdown.invoiceSize = 5;
                }
                score += breakdown.invoiceSize;
            } else {
                breakdown.invoiceSize = 10;
                score += 10;
            }
        } else {
            // No seller found, use defaults
            breakdown.sellerHistory = 20;
            breakdown.invoiceSize = 10;
            score += 30;
        }

        // Factor 2: Buyer reputation (25%)
        // For now, use neutral value - in production, look up buyer_profiles
        breakdown.buyerReputation = 12;
        score += 12.5;

        // Factor 4: Penalties (15%)
        // Check for any late payments or defaults
        const penaltyResult = await db.query(
            `SELECT COUNT(*) as late_count FROM payments 
             WHERE invoice_id IN (SELECT id FROM invoices WHERE seller_id = $1) 
             AND is_late = true`,
            [sellerId]
        );

        const lateCount = parseInt(penaltyResult.rows[0]?.late_count || 0);
        if (lateCount === 0) {
            breakdown.penalties = 15;
            score += 15;
        } else if (lateCount < 3) {
            breakdown.penalties = 10;
            score += 10;
        } else {
            breakdown.penalties = 5;
            score += 5;
        }

    } catch (error) {
        console.error('Trust score calculation error:', error);
        // Return base score on error
        return 50;
    }

    // Clamp between 0 and 100
    return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Update seller profile after invoice settled
 */
async function updateSellerOnSettlement(sellerId, amount, success) {
    try {
        if (success) {
            await db.query(
                `UPDATE seller_profiles 
                 SET successful_invoices = successful_invoices + 1,
                     total_invoices = total_invoices + 1,
                     total_raised = total_raised + $1,
                     updated_at = now()
                 WHERE id = $2`,
                [amount, sellerId]
            );
        } else {
            await db.query(
                `UPDATE seller_profiles 
                 SET defaulted_invoices = defaulted_invoices + 1,
                     total_invoices = total_invoices + 1,
                     updated_at = now()
                 WHERE id = $1`,
                [sellerId]
            );
        }

        // Recalculate trust score
        const newScore = await calculateScore(sellerId, amount);
        await db.query(
            `UPDATE seller_profiles SET trust_score = $1 WHERE id = $2`,
            [newScore, sellerId]
        );

        return newScore;
    } catch (error) {
        console.error('Update seller error:', error);
        throw error;
    }
}

/**
 * Update buyer reputation after payment
 */
async function updateBuyerOnPayment(buyerEmail, onTime) {
    try {
        if (onTime) {
            await db.query(
                `UPDATE buyer_profiles 
                 SET invoices_paid = invoices_paid + 1,
                     updated_at = now()
                 WHERE email = $1`,
                [buyerEmail.toLowerCase()]
            );
        } else {
            await db.query(
                `UPDATE buyer_profiles 
                 SET invoices_paid = invoices_paid + 1,
                     late_payments = late_payments + 1,
                     reputation_score = GREATEST(0, reputation_score - 5),
                     updated_at = now()
                 WHERE email = $1`,
                [buyerEmail.toLowerCase()]
            );
        }
    } catch (error) {
        console.error('Update buyer error:', error);
        throw error;
    }
}

/**
 * Get seller statistics from database
 */
async function getSellerStats(sellerId) {
    try {
        const result = await db.query(
            `SELECT trust_score, total_invoices, successful_invoices, defaulted_invoices, total_raised
             FROM seller_profiles WHERE id = $1`,
            [sellerId]
        );

        if (result.rows.length === 0) {
            return { totalInvoices: 0, successfulInvoices: 0, defaultedInvoices: 0, totalRaised: 0 };
        }

        const row = result.rows[0];
        return {
            trustScore: row.trust_score,
            totalInvoices: row.total_invoices,
            successfulInvoices: row.successful_invoices,
            defaultedInvoices: row.defaulted_invoices,
            totalRaised: parseFloat(row.total_raised) || 0
        };
    } catch (error) {
        console.error('Get seller stats error:', error);
        return { totalInvoices: 0, successfulInvoices: 0, defaultedInvoices: 0, totalRaised: 0 };
    }
}

/**
 * Get buyer statistics from database
 */
async function getBuyerStats(buyerEmail) {
    try {
        const result = await db.query(
            `SELECT reputation_score, invoices_confirmed, invoices_paid, late_payments
             FROM buyer_profiles WHERE email = $1`,
            [buyerEmail.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return { reputationScore: 50, invoicesPaid: 0, latePayments: 0 };
        }

        const row = result.rows[0];
        return {
            reputationScore: row.reputation_score,
            invoicesConfirmed: row.invoices_confirmed,
            invoicesPaid: row.invoices_paid,
            latePayments: row.late_payments
        };
    } catch (error) {
        console.error('Get buyer stats error:', error);
        return { reputationScore: 50, invoicesPaid: 0, latePayments: 0 };
    }
}

module.exports = {
    calculateScore,
    updateSellerOnSettlement,
    updateBuyerOnPayment,
    getSellerStats,
    getBuyerStats
};

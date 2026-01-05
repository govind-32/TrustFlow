/**
 * Trust Score Calculation Service
 * 
 * Formula:
 * - 40% MSME past success rate
 * - 25% Buyer reputation
 * - 20% Invoice size consistency
 * - 15% Late/default penalties
 */

// In-memory history (demo)
const sellerHistory = new Map();
const buyerHistory = new Map();

/**
 * Calculate trust score for an invoice
 */
function calculateScore(sellerId, invoiceAmount) {
    let score = 50; // Base score

    // Factor 1: MSME past success (40%)
    const sellerStats = sellerHistory.get(sellerId) || {
        totalInvoices: 0,
        successfulInvoices: 0,
        totalAmount: 0
    };

    if (sellerStats.totalInvoices > 0) {
        const successRate = sellerStats.successfulInvoices / sellerStats.totalInvoices;
        score += (successRate * 40);
    } else {
        // New seller, neutral score
        score += 20;
    }

    // Factor 2: Buyer reputation (25%)
    // For demo, we'll add a fixed value since buyer history is empty
    score += 12.5;

    // Factor 3: Invoice size consistency (20%)
    if (sellerStats.totalInvoices > 0) {
        const avgAmount = sellerStats.totalAmount / sellerStats.totalInvoices;
        const deviation = Math.abs(invoiceAmount - avgAmount) / avgAmount;

        if (deviation < 0.2) {
            score += 20; // Very consistent
        } else if (deviation < 0.5) {
            score += 15; // Moderately consistent
        } else if (deviation < 1) {
            score += 10; // Somewhat inconsistent
        } else {
            score += 5; // Very inconsistent
        }
    } else {
        score += 10; // New seller, neutral
    }

    // Factor 4: Penalties (15%)
    // For demo, no penalties applied
    score += 7.5;

    // Clamp between 0 and 100
    return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Update seller history after invoice settled
 */
function updateSellerHistory(sellerId, amount, success) {
    const stats = sellerHistory.get(sellerId) || {
        totalInvoices: 0,
        successfulInvoices: 0,
        totalAmount: 0
    };

    stats.totalInvoices++;
    stats.totalAmount += amount;

    if (success) {
        stats.successfulInvoices++;
    }

    sellerHistory.set(sellerId, stats);
}

/**
 * Update buyer history after payment
 */
function updateBuyerHistory(buyerId, onTime) {
    const stats = buyerHistory.get(buyerId) || {
        totalPayments: 0,
        onTimePayments: 0,
        latePayments: 0
    };

    stats.totalPayments++;

    if (onTime) {
        stats.onTimePayments++;
    } else {
        stats.latePayments++;
    }

    buyerHistory.set(buyerId, stats);
}

/**
 * Get seller statistics
 */
function getSellerStats(sellerId) {
    return sellerHistory.get(sellerId) || {
        totalInvoices: 0,
        successfulInvoices: 0,
        totalAmount: 0
    };
}

/**
 * Get buyer statistics
 */
function getBuyerStats(buyerId) {
    return buyerHistory.get(buyerId) || {
        totalPayments: 0,
        onTimePayments: 0,
        latePayments: 0
    };
}

module.exports = {
    calculateScore,
    updateSellerHistory,
    updateBuyerHistory,
    getSellerStats,
    getBuyerStats
};

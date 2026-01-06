/**
 * TrustFlow Database Models
 * Uses Supabase when configured, falls back to in-memory storage for demo
 */

const { supabaseAdmin, isConfigured } = require('../config/database');

// In-memory storage for demo mode
const demoData = {
    users: new Map(),
    sellerProfiles: new Map(),
    buyerProfiles: new Map(),
    investorProfiles: new Map(),
    invoices: new Map(),
    buyerConfirmations: new Map(),
    trustScores: new Map(),
    investments: new Map(),
    auditLogs: []
};

let idCounter = 1;
const generateId = () => `demo-${idCounter++}`;

// Helper to check if using Supabase
const useSupabase = () => isConfigured() && supabaseAdmin;

// Users Model
const Users = {
    async create({ role, username, email, phone, passwordHash, walletAddress }) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('users')
                .insert({
                    role,
                    username,
                    email,
                    phone,
                    password_hash: passwordHash,
                    wallet_address: walletAddress?.toLowerCase()
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        // Demo mode
        const user = {
            id: generateId(),
            role,
            username,
            email,
            phone,
            password_hash: passwordHash,
            wallet_address: walletAddress?.toLowerCase(),
            is_wallet_linked: false,
            created_at: new Date().toISOString()
        };
        demoData.users.set(user.id, user);
        demoData.users.set(username, user); // Index by username
        return user;
    },

    async findByUsername(username) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('username', username)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        return demoData.users.get(username);
    },

    async findById(id) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        return demoData.users.get(id);
    },

    async findByWallet(walletAddress) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('wallet_address', walletAddress.toLowerCase())
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        for (const user of demoData.users.values()) {
            if (user.wallet_address === walletAddress.toLowerCase()) return user;
        }
        return null;
    },

    async linkWallet(userId, walletAddress) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('users')
                .update({
                    wallet_address: walletAddress.toLowerCase(),
                    is_wallet_linked: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        const user = demoData.users.get(userId);
        if (user) {
            user.wallet_address = walletAddress.toLowerCase();
            user.is_wallet_linked = true;
        }
        return user;
    }
};

// Seller Profiles Model
const SellerProfiles = {
    async create({ userId, businessName, gstNumber, industry }) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('seller_profiles')
                .insert({
                    user_id: userId,
                    business_name: businessName,
                    gst_number: gstNumber,
                    industry
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const profile = {
            id: generateId(),
            user_id: userId,
            business_name: businessName,
            gst_number: gstNumber,
            industry,
            trust_score: 50,
            total_invoices: 0,
            successful_invoices: 0,
            defaulted_invoices: 0,
            total_raised: 0,
            created_at: new Date().toISOString()
        };
        demoData.sellerProfiles.set(profile.id, profile);
        demoData.sellerProfiles.set(userId, profile); // Index by userId
        return profile;
    },

    async findByUserId(userId) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('seller_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        return demoData.sellerProfiles.get(userId);
    },

    async update(userId, updates) {
        if (useSupabase()) {
            const updateData = {};
            if (updates.businessName) updateData.business_name = updates.businessName;
            if (updates.gstNumber) updateData.gst_number = updates.gstNumber;
            if (updates.industry) updateData.industry = updates.industry;
            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabaseAdmin
                .from('seller_profiles')
                .update(updateData)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const profile = demoData.sellerProfiles.get(userId);
        if (profile) {
            Object.assign(profile, updates);
        }
        return profile;
    },

    async updateTrustScore(id, score) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('seller_profiles')
                .update({ trust_score: score, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        const profile = demoData.sellerProfiles.get(id);
        if (profile) profile.trust_score = score;
        return profile;
    }
};

// Buyer Profiles Model
const BuyerProfiles = {
    async findOrCreate(email, companyName = null) {
        const normalizedEmail = email.toLowerCase();

        if (useSupabase()) {
            let { data } = await supabaseAdmin
                .from('buyer_profiles')
                .select('*')
                .eq('email', normalizedEmail)
                .single();

            if (!data) {
                const { data: newData, error } = await supabaseAdmin
                    .from('buyer_profiles')
                    .insert({ email: normalizedEmail, company_name: companyName })
                    .select()
                    .single();
                if (error) throw error;
                data = newData;
            }
            return data;
        }

        let profile = demoData.buyerProfiles.get(normalizedEmail);
        if (!profile) {
            profile = {
                id: generateId(),
                email: normalizedEmail,
                company_name: companyName,
                reputation_score: 50,
                created_at: new Date().toISOString()
            };
            demoData.buyerProfiles.set(normalizedEmail, profile);
        }
        return profile;
    },

    async findByEmail(email) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('buyer_profiles')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        return demoData.buyerProfiles.get(email.toLowerCase());
    }
};

// Investor Profiles Model
const InvestorProfiles = {
    async create({ userId, riskPreference = 'MEDIUM' }) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('investor_profiles')
                .insert({ user_id: userId, risk_preference: riskPreference })
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const profile = {
            id: generateId(),
            user_id: userId,
            risk_preference: riskPreference,
            total_invested: 0,
            created_at: new Date().toISOString()
        };
        demoData.investorProfiles.set(userId, profile);
        return profile;
    },

    async findByUserId(userId) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('investor_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        return demoData.investorProfiles.get(userId);
    }
};

// Invoices Model
const Invoices = {
    async create({ invoiceNumber, sellerId, buyerEmail, buyerWallet, amount, currency, dueDate, description, ipfsHash }) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .insert({
                    invoice_number: invoiceNumber,
                    seller_id: sellerId,
                    buyer_email: buyerEmail,
                    buyer_wallet: buyerWallet,
                    amount,
                    currency: currency || 'ETH',
                    due_date: dueDate,
                    description,
                    ipfs_hash: ipfsHash,
                    status: 'CREATED'
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const invoice = {
            id: invoiceNumber,
            invoice_number: invoiceNumber,
            seller_id: sellerId,
            buyer_email: buyerEmail,
            buyer_wallet: buyerWallet,
            amount: parseFloat(amount),
            currency: currency || 'ETH',
            due_date: dueDate,
            description,
            ipfs_hash: ipfsHash,
            status: 'CREATED',
            trust_score: null,
            created_at: new Date().toISOString()
        };
        demoData.invoices.set(invoiceNumber, invoice);
        return invoice;
    },

    async findById(id) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        return demoData.invoices.get(id);
    },

    async findByNumber(invoiceNumber) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .select('*')
                .eq('invoice_number', invoiceNumber)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        return demoData.invoices.get(invoiceNumber);
    },

    async findBySeller(sellerId) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .select('*')
                .eq('seller_id', sellerId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
        return Array.from(demoData.invoices.values())
            .filter(inv => inv.seller_id === sellerId);
    },

    async findByStatus(status) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
        return Array.from(demoData.invoices.values())
            .filter(inv => inv.status === status);
    },

    async findListed() {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .select('*, seller_profiles(business_name, trust_score)')
                .eq('status', 'LISTED')
                .order('trust_score', { ascending: false });
            if (error) throw error;
            return (data || []).map(inv => ({
                ...inv,
                sellerName: inv.seller_profiles?.business_name,
                sellerTrust: inv.seller_profiles?.trust_score
            }));
        }
        return Array.from(demoData.invoices.values())
            .filter(inv => inv.status === 'LISTED');
    },

    async updateStatus(id, status) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        const invoice = demoData.invoices.get(id);
        if (invoice) invoice.status = status;
        return invoice;
    },

    async setTrustScore(id, score, trustHash) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .update({ trust_score: score, trust_hash: trustHash, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        const invoice = demoData.invoices.get(id);
        if (invoice) {
            invoice.trust_score = score;
            invoice.trust_hash = trustHash;
        }
        return invoice;
    }
};

// Buyer Confirmations Model
const BuyerConfirmations = {
    async create({ invoiceId, method, confirmationHash, buyerSignature }) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('buyer_confirmations')
                .insert({
                    invoice_id: invoiceId,
                    method,
                    confirmation_hash: confirmationHash,
                    buyer_signature: buyerSignature
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const confirmation = {
            id: generateId(),
            invoice_id: invoiceId,
            method,
            confirmation_hash: confirmationHash,
            buyer_signature: buyerSignature,
            confirmed_at: new Date().toISOString()
        };
        demoData.buyerConfirmations.set(invoiceId, confirmation);
        return confirmation;
    },

    async findByInvoice(invoiceId) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('buyer_confirmations')
                .select('*')
                .eq('invoice_id', invoiceId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        return demoData.buyerConfirmations.get(invoiceId);
    }
};

// Trust Scores Model
const TrustScores = {
    async create({ invoiceId, sellerId, buyerEmail, score, breakdown }) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('trust_scores')
                .insert({ invoice_id: invoiceId, seller_id: sellerId, buyer_email: buyerEmail, score, breakdown })
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const trustScore = { id: generateId(), invoice_id: invoiceId, seller_id: sellerId, buyer_email: buyerEmail, score, breakdown };
        demoData.trustScores.set(invoiceId, trustScore);
        return trustScore;
    }
};

// Investments Model
const Investments = {
    async create({ investorId, invoiceId, amount, status }) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('investments')
                .insert({ investor_id: investorId, invoice_id: invoiceId, amount, status })
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const investment = { id: generateId(), investor_id: investorId, invoice_id: invoiceId, amount, status };
        demoData.investments.set(investment.id, investment);
        return investment;
    },

    async findByInvestor(investorId) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('investments')
                .select('*, invoices(*)')
                .eq('investor_id', investorId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
        return Array.from(demoData.investments.values())
            .filter(inv => inv.investor_id === investorId);
    }
};

// Audit Logs Model
const AuditLogs = {
    async create({ userId, action, entityType, entityId, details, ipAddress }) {
        if (useSupabase()) {
            const { data, error } = await supabaseAdmin
                .from('audit_logs')
                .insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, details, ip_address: ipAddress })
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const log = { id: generateId(), user_id: userId, action, entity_type: entityType, entity_id: entityId, details, ip_address: ipAddress, created_at: new Date().toISOString() };
        demoData.auditLogs.push(log);
        return log;
    }
};

module.exports = {
    Users,
    SellerProfiles,
    BuyerProfiles,
    InvestorProfiles,
    Invoices,
    BuyerConfirmations,
    TrustScores,
    Investments,
    AuditLogs
};

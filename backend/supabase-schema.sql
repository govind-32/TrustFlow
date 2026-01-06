-- TrustFlow Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('seller', 'investor', 'admin')),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    password_hash TEXT,
    wallet_address TEXT,
    is_wallet_linked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller Profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    gst_number TEXT,
    industry TEXT,
    trust_score INTEGER DEFAULT 50,
    total_invoices INTEGER DEFAULT 0,
    successful_invoices INTEGER DEFAULT 0,
    defaulted_invoices INTEGER DEFAULT 0,
    total_raised DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Buyer Profiles table
CREATE TABLE IF NOT EXISTS buyer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    company_name TEXT,
    wallet_address TEXT,
    reputation_score INTEGER DEFAULT 50,
    verified_invoices INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investor Profiles table
CREATE TABLE IF NOT EXISTS investor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    risk_preference TEXT DEFAULT 'MEDIUM' CHECK (risk_preference IN ('LOW', 'MEDIUM', 'HIGH')),
    total_invested DECIMAL(20, 8) DEFAULT 0,
    total_returns DECIMAL(20, 8) DEFAULT 0,
    active_investments INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
    buyer_email TEXT,
    buyer_wallet TEXT,
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT DEFAULT 'ETH',
    due_date DATE NOT NULL,
    description TEXT,
    ipfs_hash TEXT,
    trust_score INTEGER,
    trust_hash TEXT,
    nft_token_id TEXT,
    escrow_contract TEXT,
    status TEXT DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'BUYER_VERIFIED', 'LISTED', 'FUNDED', 'SETTLED', 'REJECTED', 'DEFAULTED')),
    funded_amount DECIMAL(20, 8),
    funded_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer Confirmations table
CREATE TABLE IF NOT EXISTS buyer_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('email', 'wallet', 'platform')),
    confirmation_hash TEXT,
    buyer_signature TEXT,
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(invoice_id)
);

-- Trust Scores table
CREATE TABLE IF NOT EXISTS trust_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES seller_profiles(id),
    buyer_email TEXT,
    score INTEGER NOT NULL,
    breakdown JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES investor_profiles(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    expected_return DECIMAL(20, 8),
    actual_return DECIMAL(20, 8),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FUNDED', 'SETTLED', 'DEFAULTED')),
    funded_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_invoices_seller ON invoices(seller_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for backend operations)
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (true);
CREATE POLICY "Service role has full access to seller_profiles" ON seller_profiles FOR ALL USING (true);
CREATE POLICY "Service role has full access to buyer_profiles" ON buyer_profiles FOR ALL USING (true);
CREATE POLICY "Service role has full access to investor_profiles" ON investor_profiles FOR ALL USING (true);
CREATE POLICY "Service role has full access to invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Service role has full access to buyer_confirmations" ON buyer_confirmations FOR ALL USING (true);
CREATE POLICY "Service role has full access to trust_scores" ON trust_scores FOR ALL USING (true);
CREATE POLICY "Service role has full access to investments" ON investments FOR ALL USING (true);
CREATE POLICY "Service role has full access to audit_logs" ON audit_logs FOR ALL USING (true);

-- Success message
SELECT 'TrustFlow database schema created successfully!' as message;

-- ============================================================================
-- TrustFlow PostgreSQL Schema
-- Enterprise-grade schema for invoice financing platform
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================
CREATE TYPE user_role AS ENUM ('SELLER', 'BUYER', 'INVESTOR');

CREATE TYPE invoice_status AS ENUM (
  'CREATED',
  'BUYER_VERIFIED',
  'LISTED',
  'FUNDED',
  'SETTLED',
  'DEFAULTED',
  'REJECTED'
);

CREATE TYPE confirmation_method AS ENUM ('EMAIL', 'WALLET');

CREATE TYPE investment_status AS ENUM ('ACTIVE', 'SETTLED', 'DEFAULTED');

-- ============================================================================
-- 2. USERS & AUTH
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  role user_role NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),

  password_hash TEXT NOT NULL,
  wallet_address VARCHAR(42),

  is_wallet_linked BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ============================================================================
-- 3. SELLER PROFILES
-- ============================================================================
CREATE TABLE seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  business_name VARCHAR(255),
  gst_number VARCHAR(50),
  industry VARCHAR(100),

  trust_score INT DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),

  total_invoices INT DEFAULT 0,
  successful_invoices INT DEFAULT 0,
  defaulted_invoices INT DEFAULT 0,

  total_raised NUMERIC(20, 8) DEFAULT 0,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_seller_trust ON seller_profiles(trust_score DESC);

-- ============================================================================
-- 4. BUYER PROFILES (NO LOGIN REQUIRED)
-- ============================================================================
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),

  reputation_score INT DEFAULT 50 CHECK (reputation_score BETWEEN 0 AND 100),

  invoices_confirmed INT DEFAULT 0,
  invoices_paid INT DEFAULT 0,
  late_payments INT DEFAULT 0,

  wallet_address VARCHAR(42),

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_buyer_email ON buyer_profiles(email);

-- ============================================================================
-- 5. INVESTOR PROFILES
-- ============================================================================
CREATE TABLE investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  total_invested NUMERIC(20, 8) DEFAULT 0,
  active_investments INT DEFAULT 0,
  completed_investments INT DEFAULT 0,
  total_returns NUMERIC(20, 8) DEFAULT 0,

  risk_preference VARCHAR(10) DEFAULT 'MEDIUM',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 6. INVOICES (CORE TABLE)
-- ============================================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  invoice_number VARCHAR(100) UNIQUE NOT NULL,

  seller_id UUID REFERENCES seller_profiles(id),
  buyer_email VARCHAR(255) NOT NULL,
  buyer_wallet VARCHAR(42),

  amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) DEFAULT 'ETH',

  due_date DATE NOT NULL,
  description TEXT,

  ipfs_hash TEXT,

  trust_score INT CHECK (trust_score BETWEEN 0 AND 100),
  trust_hash TEXT,

  status invoice_status DEFAULT 'CREATED',

  nft_token_id BIGINT,
  escrow_contract VARCHAR(42),

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_invoice_status ON invoices(status);
CREATE INDEX idx_invoice_seller ON invoices(seller_id);
CREATE INDEX idx_invoice_buyer ON invoices(buyer_email);
CREATE INDEX idx_invoice_due ON invoices(due_date);
CREATE INDEX idx_invoice_trust ON invoices(trust_score DESC);

-- ============================================================================
-- 7. BUYER CONFIRMATIONS
-- ============================================================================
CREATE TABLE buyer_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  invoice_id UUID UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,

  method confirmation_method NOT NULL,
  confirmation_hash TEXT NOT NULL,
  buyer_signature TEXT,

  confirmed_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 8. TRUST SCORE HISTORY (AUDITABLE)
-- ============================================================================
CREATE TABLE trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  invoice_id UUID REFERENCES invoices(id),
  seller_id UUID REFERENCES seller_profiles(id),
  buyer_email VARCHAR(255),

  score INT CHECK (score BETWEEN 0 AND 100),

  -- Breakdown (40% + 25% + 20% + 15% = 100%)
  seller_history INT,      -- 40%
  buyer_reputation INT,    -- 25%
  invoice_size INT,        -- 20%
  penalties INT,           -- 15%

  calculated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_trust_invoice ON trust_scores(invoice_id);
CREATE INDEX idx_trust_seller ON trust_scores(seller_id);

-- ============================================================================
-- 9. INVESTMENTS
-- ============================================================================
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  invoice_id UUID REFERENCES invoices(id),
  investor_id UUID REFERENCES investor_profiles(id),

  invested_amount NUMERIC(20, 8) NOT NULL,
  expected_return NUMERIC(20, 8),

  escrow_tx_hash TEXT,

  status investment_status DEFAULT 'ACTIVE',

  invested_at TIMESTAMP DEFAULT now(),
  settled_at TIMESTAMP
);

CREATE INDEX idx_investments_invoice ON investments(invoice_id);
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_investments_status ON investments(status);

-- ============================================================================
-- 10. PAYMENTS
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  invoice_id UUID REFERENCES invoices(id),

  payer VARCHAR(20) DEFAULT 'BUYER',
  amount NUMERIC(20, 8) NOT NULL,

  tx_hash TEXT,
  paid_at TIMESTAMP DEFAULT now(),

  is_late BOOLEAN DEFAULT FALSE,
  penalty_applied NUMERIC(20, 8) DEFAULT 0
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_tx ON payments(tx_hash);

-- ============================================================================
-- 11. AUDIT LOGS (COMPLIANCE)
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(100),

  metadata JSONB,

  timestamp TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_time ON audit_logs(timestamp DESC);

-- ============================================================================
-- 12. UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER seller_profiles_updated_at BEFORE UPDATE ON seller_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER investor_profiles_updated_at BEFORE UPDATE ON investor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

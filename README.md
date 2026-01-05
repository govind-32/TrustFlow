# TrustFlow 🚀

**Blockchain-based Invoice Financing Platform for MSMEs**

TrustFlow enables small businesses to tokenize their verified invoices as NFTs, receive instant funding from investors, and eliminate the 60+ day payment delay.

---

## 🎯 Problem Statement

MSMEs face severe cash flow issues due to delayed invoice payments (60-90 days). Traditional invoice financing requires collateral and involves lengthy approval processes.

## 💡 Solution

TrustFlow uses blockchain technology to:
- **Tokenize invoices** as ERC-721 NFTs
- **Verify buyers** via wallet signature or web confirmation (no wallet needed)
- **Calculate trust scores** using rule-based algorithms
- **Enable instant funding** from investors via smart contract escrow
- **Automate settlement** when buyers pay on due date

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Seller    │     │    Buyer    │     │  Investor   │
│   (MSME)    │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│         (Landing, Dashboards, Marketplace)          │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Node.js Backend                    │
│        (Auth, Invoice API, Trust Score Engine)      │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│               Smart Contracts (Solidity)             │
│         InvoiceNFT │ Escrow │ TrustRegistry         │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Polygon Amoy Testnet |
| Smart Contracts | Solidity + Hardhat |
| Backend | Node.js + Express |
| Frontend | React.js + Vite |
| Wallet | MetaMask |
| Storage | IPFS (Pinata) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/govind-32/TrustFlow.git
cd TrustFlow

# Install dependencies
npm install

# Start backend (Terminal 1)
npm run backend:dev

# Start frontend (Terminal 2)
npm run frontend:dev

# Open http://localhost:5173
```

### Compile Smart Contracts

```bash
cd contracts
npx hardhat compile
```

---

## 📁 Project Structure

```
TrustFlow/
├── contracts/              # Solidity smart contracts
│   ├── contracts/
│   │   ├── InvoiceNFT.sol      # ERC-721 invoice tokens
│   │   ├── Escrow.sol          # Fund management
│   │   └── TrustRegistry.sol   # Verification storage
│   └── hardhat.config.js
│
├── backend/                # Node.js API
│   └── src/
│       ├── routes/
│       │   ├── auth.js         # Login, register, wallet
│       │   ├── invoice.js      # CRUD, verification
│       │   └── msme.js         # Profile management
│       ├── services/
│       │   └── trustScore.js   # Score calculation
│       └── server.js
│
├── frontend/               # React application
│   └── src/
│       ├── pages/
│       │   ├── seller/         # Dashboard, Create, List
│       │   ├── investor/       # Marketplace, Portfolio
│       │   └── buyer/          # Access, Verify
│       ├── components/
│       └── index.css           # Design system
│
└── package.json            # Monorepo config
```

---

## 🔐 Key Features

### Dual-Mode Buyer Verification
| Mode | Description |
|------|-------------|
| **Wallet Signature** | Buyer signs with MetaMask |
| **Web Confirmation** | Click secure link (no wallet needed) |

Both produce an **immutable on-chain verification hash**.

### Trust Score Formula
```
Trust Score (0-100) =
  40% × MSME past success rate
+ 25% × Buyer reputation
+ 20% × Invoice size consistency
+ 15% × Late/default penalty adjustment
```

### Invoice Status Flow
```
CREATED → BUYER_VERIFIED → LISTED → FUNDED → SETTLED
                                         ↓
                                    DEFAULTED
```

---

## 👥 User Flows

### Seller (MSME)
1. Register/Login → Dashboard
2. Create Invoice (amount, due date, buyer email/wallet)
3. Share verification link with buyer
4. After verification, list for funding
5. Receive instant liquidity when funded

### Buyer
1. Receive verification link via email
2. Review invoice details
3. Confirm via web (no wallet) or sign with wallet
4. Pay on due date to escrow

### Investor
1. Browse marketplace (filter by trust score)
2. Review invoice details and expected yield
3. Fund invoice → funds go to escrow → released to seller
4. Receive principal + yield when buyer pays

---

## 🎨 UI Design

- **Style**: Professional banking/SaaS (not crypto/NFT aesthetic)
- **Primary Color**: `#2563EB` (calm blue)
- **Font**: Inter
- **No**: Gradients, dark mode, neon colors

---

## 📜 Smart Contracts

| Contract | Purpose |
|----------|---------|
| `InvoiceNFT.sol` | ERC-721 tokens representing invoices |
| `Escrow.sol` | Holds investor funds, handles settlement |
| `TrustRegistry.sol` | Stores verification hashes on-chain |

---

## 🧪 Testing

```bash
# Smart contract tests
cd contracts && npx hardhat test

# Backend (manual testing)
curl http://localhost:3001/api/health
```

---

## 🛣️ Roadmap

- [ ] Deploy to Polygon Amoy testnet
- [ ] Add IPFS invoice PDF storage
- [ ] Implement risk pool for defaults
- [ ] Mobile responsive UI
- [ ] Email notifications

---

## 👨‍💻 Author

**Govind Suthar**
- GitHub: [@govind-32](https://github.com/govind-32)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

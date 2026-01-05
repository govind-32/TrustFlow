# TrustFlow

Blockchain-based invoice financing platform for MSMEs.

## Project Structure

```
TrustFlow/
├── contracts/     # Solidity smart contracts (Hardhat)
├── backend/       # Node.js Express API
├── frontend/      # React.js (Vite) application
└── package.json   # Monorepo root
```

## Quick Start

```bash
# Install dependencies
npm install

# Run backend + frontend
npm run dev

# Compile smart contracts
npm run contracts:compile

# Run contract tests
npm run contracts:test
```

## Roles

- **Seller (MSME)**: Upload invoices, get instant liquidity
- **Buyer**: Verify invoices (wallet or web-based)
- **Investor**: Fund verified invoices, earn yields

## Tech Stack

- **Blockchain**: Polygon Amoy Testnet
- **Smart Contracts**: Solidity + Hardhat
- **Backend**: Node.js + Express
- **Frontend**: React.js + Vite
- **Storage**: IPFS (Pinata)

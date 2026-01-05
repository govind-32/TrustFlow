import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

function InvestorDashboard({ user, wallet }) {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        minScore: 0,
        maxAmount: ''
    })

    useEffect(() => {
        fetchMarketplace()
    }, [])

    const fetchMarketplace = async () => {
        try {
            const response = await fetch('/api/invoice/list/marketplace')
            if (response.ok) {
                const data = await response.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error('Failed to fetch marketplace:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!user || user.role !== 'investor') {
        return <Navigate to="/login?role=investor" />
    }

    const getTrustScoreClass = (score) => {
        if (score >= 70) return 'trust-score-high'
        if (score >= 40) return 'trust-score-medium'
        return 'trust-score-low'
    }

    const calculateExpectedReturn = (amount, dueDate) => {
        const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
        const rate = 0.05 // 5% base rate
        return (amount * rate * days / 30).toFixed(4)
    }

    const filteredInvoices = invoices.filter(invoice => {
        if (filters.minScore && invoice.trustScore < filters.minScore) return false
        if (filters.maxAmount && invoice.amount > parseFloat(filters.maxAmount)) return false
        return true
    })

    const handleFund = async (invoiceId) => {
        if (!wallet) {
            alert('Please connect your wallet to fund invoices')
            return
        }
        // Mock funding - in production, this would call the smart contract
        alert(`Funding invoice ${invoiceId} - Connect to testnet for real transaction`)
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Invoice Marketplace</h1>
                    <p>Browse and fund verified invoices</p>
                </div>

                {!wallet && (
                    <div className="alert alert-info mb-md">
                        Connect your wallet to fund invoices
                    </div>
                )}

                {/* Filters */}
                <div className="card mb-md">
                    <div className="flex gap-md" style={{ alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Min Trust Score</label>
                            <select
                                className="form-input"
                                style={{ width: '150px' }}
                                value={filters.minScore}
                                onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                            >
                                <option value="0">All</option>
                                <option value="50">50+</option>
                                <option value="70">70+</option>
                                <option value="85">85+</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Max Amount (ETH)</label>
                            <input
                                type="number"
                                className="form-input"
                                style={{ width: '150px' }}
                                placeholder="Any"
                                value={filters.maxAmount}
                                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Invoice Grid */}
                {loading ? (
                    <p>Loading marketplace...</p>
                ) : filteredInvoices.length === 0 ? (
                    <div className="card text-center" style={{ padding: '60px' }}>
                        <p>No invoices available for funding right now.</p>
                    </div>
                ) : (
                    <div className="grid grid-3">
                        {filteredInvoices.map(invoice => (
                            <div key={invoice.id} className="card">
                                <div className="flex-between mb-md">
                                    <strong>{invoice.id}</strong>
                                    <span className={`trust-score ${getTrustScoreClass(invoice.trustScore)}`}>
                                        Score: {invoice.trustScore}
                                    </span>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                                        <strong>{invoice.amount} ETH</strong>
                                    </div>
                                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Due Date</span>
                                        <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Seller</span>
                                        <span>{invoice.sellerName}</span>
                                    </div>
                                    <div className="flex-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Expected Return</span>
                                        <span style={{ color: 'var(--color-success)' }}>
                                            +{calculateExpectedReturn(invoice.amount, invoice.dueDate)} ETH
                                        </span>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary btn-full"
                                    onClick={() => handleFund(invoice.id)}
                                    disabled={!wallet}
                                >
                                    Fund Invoice
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default InvestorDashboard

import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'

function SellerDashboard({ user, wallet }) {
    const [stats, setStats] = useState({
        trustScore: 50,
        activeInvoices: 0,
        fundedInvoices: 0,
        totalLiquidity: 0
    })
    const [recentInvoices, setRecentInvoices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('trustflow_token')

            // Fetch seller invoices
            const response = await fetch('/api/invoice/list/seller', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const invoices = await response.json()

                const active = invoices.filter(i => ['CREATED', 'BUYER_VERIFIED', 'LISTED'].includes(i.status))
                const funded = invoices.filter(i => ['FUNDED', 'SETTLED'].includes(i.status))
                const totalFunded = funded.reduce((sum, i) => sum + (i.fundedAmount || i.amount), 0)

                setStats({
                    trustScore: user?.trustScore || 50,
                    activeInvoices: active.length,
                    fundedInvoices: funded.length,
                    totalLiquidity: totalFunded
                })

                setRecentInvoices(invoices.slice(0, 5))
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!user || user.role !== 'seller') {
        return <Navigate to="/login?role=seller" />
    }

    const getTrustScoreClass = (score) => {
        if (score >= 70) return 'trust-score-high'
        if (score >= 40) return 'trust-score-medium'
        return 'trust-score-low'
    }

    const getStatusBadge = (status) => {
        const statusClasses = {
            'CREATED': 'badge-created',
            'BUYER_VERIFIED': 'badge-verified',
            'LISTED': 'badge-listed',
            'FUNDED': 'badge-funded',
            'SETTLED': 'badge-settled',
            'REJECTED': 'badge-rejected',
            'DEFAULTED': 'badge-defaulted'
        }
        return <span className={`badge ${statusClasses[status] || 'badge-created'}`}>{status}</span>
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div>
                        <h1>Seller Dashboard</h1>
                        <p>Welcome back, {user.username}</p>
                    </div>
                    <Link to="/seller/create" className="btn btn-primary">
                        + Create Invoice
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-4 mb-md">
                    <div className="card stat-card">
                        <div className={`stat-value ${getTrustScoreClass(stats.trustScore)}`}>
                            {stats.trustScore}
                        </div>
                        <div className="stat-label">Trust Score</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{stats.activeInvoices}</div>
                        <div className="stat-label">Active Invoices</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{stats.fundedInvoices}</div>
                        <div className="stat-label">Funded Invoices</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{stats.totalLiquidity.toFixed(2)} ETH</div>
                        <div className="stat-label">Total Liquidity</div>
                    </div>
                </div>

                {/* Wallet Status */}
                {!wallet && (
                    <div className="alert alert-info mb-md">
                        Connect your wallet to submit invoices on-chain
                    </div>
                )}

                {/* Recent Invoices */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Invoices</h3>
                        <Link to="/seller/invoices" className="btn btn-outline">View All</Link>
                    </div>

                    {loading ? (
                        <p>Loading...</p>
                    ) : recentInvoices.length === 0 ? (
                        <div className="text-center" style={{ padding: '40px' }}>
                            <p>No invoices yet. Create your first invoice to get started.</p>
                            <Link to="/seller/create" className="btn btn-primary mt-md">Create Invoice</Link>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInvoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td>{invoice.id}</td>
                                        <td>{invoice.amount} ETH</td>
                                        <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                        <td>{getStatusBadge(invoice.status)}</td>
                                        <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SellerDashboard

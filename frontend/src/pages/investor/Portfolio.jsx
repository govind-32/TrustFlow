import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

function InvestorPortfolio({ user }) {
    const [investments, setInvestments] = useState([])
    const [stats, setStats] = useState({
        totalInvested: 0,
        activeInvestments: 0,
        completedInvestments: 0,
        totalReturns: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPortfolio()
    }, [])

    const fetchPortfolio = async () => {
        try {
            const token = localStorage.getItem('trustflow_token')
            const response = await fetch('/api/invoice/list/investor', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setInvestments(data)

                // Calculate stats
                const active = data.filter(i => i.status === 'FUNDED')
                const completed = data.filter(i => i.status === 'SETTLED')
                const totalInvested = data.reduce((sum, i) => sum + (i.fundedAmount || 0), 0)

                setStats({
                    totalInvested,
                    activeInvestments: active.length,
                    completedInvestments: completed.length,
                    totalReturns: completed.length * 0.05 * totalInvested / data.length || 0
                })
            }
        } catch (error) {
            console.error('Failed to fetch portfolio:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!user || user.role !== 'investor') {
        return <Navigate to="/login?role=investor" />
    }

    const getStatusBadge = (status) => {
        const statusClasses = {
            'FUNDED': 'badge-funded',
            'SETTLED': 'badge-settled',
            'DEFAULTED': 'badge-defaulted'
        }
        return <span className={`badge ${statusClasses[status] || 'badge-created'}`}>{status}</span>
    }

    const getDaysRemaining = (dueDate) => {
        const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
        return days > 0 ? `${days} days` : 'Due'
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>My Portfolio</h1>
                    <p>Track your investments and returns</p>
                </div>

                {/* Stats */}
                <div className="grid grid-4 mb-md">
                    <div className="card stat-card">
                        <div className="stat-value">{stats.totalInvested.toFixed(2)} ETH</div>
                        <div className="stat-label">Total Invested</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{stats.activeInvestments}</div>
                        <div className="stat-label">Active Investments</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{stats.completedInvestments}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                            +{stats.totalReturns.toFixed(4)} ETH
                        </div>
                        <div className="stat-label">Total Returns</div>
                    </div>
                </div>

                {/* Investments Table */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Investments</h3>
                    </div>

                    {loading ? (
                        <p style={{ padding: '20px' }}>Loading...</p>
                    ) : investments.length === 0 ? (
                        <p style={{ padding: '40px', textAlign: 'center' }}>
                            No investments yet. Browse the marketplace to start investing.
                        </p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Amount</th>
                                    <th>Seller</th>
                                    <th>Due Date</th>
                                    <th>Time Left</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investments.map(inv => (
                                    <tr key={inv.id}>
                                        <td>{inv.id}</td>
                                        <td>{inv.fundedAmount || inv.amount} ETH</td>
                                        <td>{inv.sellerUsername}</td>
                                        <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                        <td>{getDaysRemaining(inv.dueDate)}</td>
                                        <td>{getStatusBadge(inv.status)}</td>
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

export default InvestorPortfolio

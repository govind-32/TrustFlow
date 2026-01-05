import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

function SellerInvoices({ user }) {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInvoices()
    }, [])

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('trustflow_token')
            const response = await fetch('/api/invoice/list/seller', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleList = async (invoiceId) => {
        try {
            const token = localStorage.getItem('trustflow_token')
            const response = await fetch(`/api/invoice/${invoiceId}/list`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                fetchInvoices()
            }
        } catch (error) {
            console.error('Failed to list invoice:', error)
        }
    }

    if (!user || user.role !== 'seller') {
        return <Navigate to="/login?role=seller" />
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
                <div className="page-header">
                    <h1>My Invoices</h1>
                    <p>Track all your invoices and their status</p>
                </div>

                <div className="card">
                    {loading ? (
                        <p style={{ padding: '20px' }}>Loading...</p>
                    ) : invoices.length === 0 ? (
                        <p style={{ padding: '40px', textAlign: 'center' }}>No invoices yet</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Amount</th>
                                    <th>Buyer</th>
                                    <th>Due Date</th>
                                    <th>Trust Score</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td>{invoice.id}</td>
                                        <td>{invoice.amount} ETH</td>
                                        <td>{invoice.buyerEmail || invoice.buyerWallet?.slice(0, 10) + '...' || 'N/A'}</td>
                                        <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                        <td>{invoice.trustScore || '-'}</td>
                                        <td>{getStatusBadge(invoice.status)}</td>
                                        <td>
                                            {invoice.status === 'BUYER_VERIFIED' && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                                    onClick={() => handleList(invoice.id)}
                                                >
                                                    List for Funding
                                                </button>
                                            )}
                                            {invoice.status === 'CREATED' && (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                                    Waiting for buyer
                                                </span>
                                            )}
                                        </td>
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

export default SellerInvoices

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

function CreateInvoice({ user }) {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        amount: '',
        dueDate: '',
        buyerEmail: '',
        buyerWallet: '',
        description: ''
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)

    if (!user || user.role !== 'seller') {
        return <Navigate to="/login?role=seller" />
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess(null)
        setLoading(true)

        if (!formData.buyerEmail && !formData.buyerWallet) {
            setError('Please provide buyer email or wallet address')
            setLoading(false)
            return
        }

        try {
            const token = localStorage.getItem('trustflow_token')

            const response = await fetch('/api/invoice/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create invoice')
            }

            setSuccess({
                invoiceId: data.invoice.id,
                verificationLink: data.invoice.verificationLink
            })

            // Reset form
            setFormData({
                amount: '',
                dueDate: '',
                buyerEmail: '',
                buyerWallet: '',
                description: ''
            })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Get minimum date (tomorrow)
    const getMinDate = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '600px' }}>
                <div className="page-header">
                    <h1>Create Invoice</h1>
                    <p>Submit a new invoice for buyer verification</p>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    {success && (
                        <div className="alert alert-success">
                            <p><strong>Invoice {success.invoiceId} created!</strong></p>
                            <p style={{ marginTop: '8px', fontSize: '13px' }}>
                                Share this link with your buyer for verification:
                            </p>
                            <input
                                type="text"
                                className="form-input mt-sm"
                                value={success.verificationLink}
                                readOnly
                                onClick={(e) => e.target.select()}
                            />
                            <p style={{ marginTop: '12px' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/seller/invoices')}
                                >
                                    View All Invoices
                                </button>
                            </p>
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Invoice Amount (ETH) *</label>
                                <input
                                    type="number"
                                    name="amount"
                                    step="0.001"
                                    min="0.001"
                                    className="form-input"
                                    placeholder="e.g., 1.5"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Due Date *</label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    className="form-input"
                                    min={getMinDate()}
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Buyer Email</label>
                                <input
                                    type="email"
                                    name="buyerEmail"
                                    className="form-input"
                                    placeholder="buyer@company.com"
                                    value={formData.buyerEmail}
                                    onChange={handleChange}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                    Buyer will receive a verification link via email
                                </small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Buyer Wallet Address (Optional)</label>
                                <input
                                    type="text"
                                    name="buyerWallet"
                                    className="form-input"
                                    placeholder="0x..."
                                    value={formData.buyerWallet}
                                    onChange={handleChange}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                    If buyer has a wallet, they can sign to verify
                                </small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-input"
                                    placeholder="Brief description of goods/services"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? 'Creating...' : 'Submit for Buyer Verification'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CreateInvoice

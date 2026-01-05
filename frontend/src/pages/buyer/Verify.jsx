import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function BuyerVerify() {
    const { token } = useParams()
    const navigate = useNavigate()

    const [invoice, setInvoice] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [email, setEmail] = useState('')
    const [confirming, setConfirming] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        fetchInvoice()
    }, [token])

    const fetchInvoice = async () => {
        try {
            const response = await fetch(`/api/invoice/verify/${token}`)

            if (!response.ok) {
                throw new Error('Invalid or expired verification link')
            }

            const data = await response.json()
            setInvoice(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!email) {
            setError('Please enter your email for confirmation')
            return
        }

        setConfirming(true)
        setError('')

        try {
            const response = await fetch(`/api/invoice/${invoice.invoiceId}/verify-web`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, buyerEmail: email })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed')
            }

            setSuccess(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setConfirming(false)
        }
    }

    const handleReject = async () => {
        if (!window.confirm('Are you sure you want to reject this invoice?')) {
            return
        }

        try {
            await fetch(`/api/invoice/${invoice.invoiceId}/reject`, {
                method: 'POST'
            })
            setError('Invoice rejected. The seller has been notified.')
        } catch (err) {
            setError('Failed to reject invoice')
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container text-center" style={{ paddingTop: '100px' }}>
                    <p>Loading invoice details...</p>
                </div>
            </div>
        )
    }

    if (error && !invoice) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: '500px' }}>
                    <div className="card text-center" style={{ padding: '40px' }}>
                        <h2 style={{ color: 'var(--color-error)' }}>Verification Error</h2>
                        <p>{error}</p>
                        <button
                            className="btn btn-outline mt-lg"
                            onClick={() => navigate('/buyer')}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: '500px' }}>
                    <div className="card text-center" style={{ padding: '40px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                        <h2 style={{ color: 'var(--color-success)' }}>Invoice Verified!</h2>
                        <p>
                            Thank you for confirming this invoice. The seller can now list
                            it for funding. You will need to pay the amount on the due date.
                        </p>
                        <div className="alert alert-info mt-lg">
                            <strong>Payment Due:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
                            <br />
                            <strong>Amount:</strong> {invoice.amount} ETH
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '600px' }}>
                <div className="page-header text-center">
                    <h1>Verify Invoice</h1>
                    <p>Review and confirm this invoice from your seller</p>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    {invoice.status !== 'CREATED' && (
                        <div className="alert alert-info">
                            This invoice has already been {invoice.status.toLowerCase()}.
                        </div>
                    )}

                    {/* Invoice Details */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Invoice Details</h3>

                        <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Invoice ID</span>
                            <strong>{invoice.invoiceId}</strong>
                        </div>
                        <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Seller</span>
                            <strong>{invoice.sellerName}</strong>
                        </div>
                        <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                            <strong style={{ fontSize: '18px', color: 'var(--color-primary)' }}>{invoice.amount} ETH</strong>
                        </div>
                        <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Due Date</span>
                            <strong>{new Date(invoice.dueDate).toLocaleDateString()}</strong>
                        </div>
                        {invoice.description && (
                            <div style={{ padding: '12px 0' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Description</span>
                                <p style={{ marginTop: '8px' }}>{invoice.description}</p>
                            </div>
                        )}
                    </div>

                    {invoice.status === 'CREATED' && (
                        <>
                            {/* Email Confirmation */}
                            <div className="form-group">
                                <label className="form-label">Your Email (for confirmation record)</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                                    Your confirmation will be recorded on-chain
                                </small>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-md mt-lg">
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={handleConfirm}
                                    disabled={confirming}
                                >
                                    {confirming ? 'Confirming...' : '✓ I Confirm This Invoice'}
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ color: 'var(--color-error)' }}
                                    onClick={handleReject}
                                >
                                    Reject
                                </button>
                            </div>

                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
                                By confirming, you agree to pay the amount shown above by the due date.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BuyerVerify

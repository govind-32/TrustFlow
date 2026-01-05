import { useState } from 'react'

function BuyerAccess() {
    const [invoiceId, setInvoiceId] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (invoiceId.trim()) {
            // For demo, redirect to verification link format
            window.location.href = `/verify/${invoiceId}`
        }
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '500px' }}>
                <div className="page-header text-center">
                    <h1>Buyer Access</h1>
                    <p>Verify pending invoices from your sellers</p>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    <p style={{ marginBottom: '24px' }}>
                        If you received a verification link, click it directly.
                        Otherwise, enter your verification token below:
                    </p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Verification Token</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter token from email/link"
                                value={invoiceId}
                                onChange={(e) => setInvoiceId(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full">
                            View Invoice
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <button
                        className="btn btn-outline btn-full"
                        onClick={async () => {
                            if (typeof window.ethereum !== 'undefined') {
                                try {
                                    await window.ethereum.request({ method: 'eth_requestAccounts' })
                                    alert('Wallet connected! You can now sign invoices sent to your wallet address.')
                                } catch (err) {
                                    setError('Failed to connect wallet')
                                }
                            } else {
                                setError('Please install MetaMask')
                            }
                        }}
                    >
                        Connect Wallet for Signature Verification
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BuyerAccess

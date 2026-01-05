import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

function SellerProfile({ user }) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        businessName: '',
        gstNumber: '',
        industry: ''
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('trustflow_token')
            const response = await fetch('/api/msme/profile/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setProfile(data)
                setFormData({
                    businessName: data.businessName || '',
                    gstNumber: data.gstNumber || '',
                    industry: data.industry || ''
                })
            } else if (response.status === 404) {
                // Profile doesn't exist yet, user needs to create one
                setProfile(null)
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setSaving(true)

        try {
            const token = localStorage.getItem('trustflow_token')
            const response = await fetch('/api/msme/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save profile')
            }

            setProfile(data.msme)
            setSuccess('Profile saved successfully!')
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (!user || user.role.toLowerCase() !== 'seller') {
        return <Navigate to="/login?role=seller" />
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <p>Loading profile...</p>
                </div>
            </div>
        )
    }

    const getTrustScoreClass = (score) => {
        if (score >= 70) return 'trust-score-high'
        if (score >= 40) return 'trust-score-medium'
        return 'trust-score-low'
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Seller Profile</h1>
                    <p>Manage your business profile and view performance metrics</p>
                </div>

                <div className="grid grid-2" style={{ gap: '24px' }}>
                    {/* Left: Profile Form */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Business Information</h3>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Business Name *</label>
                                <input
                                    type="text"
                                    name="businessName"
                                    className="form-input"
                                    placeholder="Your business name"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">GST Number (Optional)</label>
                                <input
                                    type="text"
                                    name="gstNumber"
                                    className="form-input"
                                    placeholder="e.g., 22AAAAA0000A1Z5"
                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Industry</label>
                                <select
                                    name="industry"
                                    className="form-input"
                                    value={formData.industry}
                                    onChange={handleChange}
                                >
                                    <option value="">Select industry</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="IT Services">IT Services</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Construction">Construction</option>
                                    <option value="Logistics">Logistics</option>
                                    <option value="Agriculture">Agriculture</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                                {saving ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
                            </button>
                        </form>

                        {/* Wallet Section */}
                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                            <h4 style={{ marginBottom: '12px' }}>Wallet Address</h4>
                            {user.walletAddress ? (
                                <div className="flex-between" style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                    <code style={{ fontSize: '13px' }}>{user.walletAddress}</code>
                                    <span className="badge badge-verified">Connected</span>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)' }}>
                                    Connect your wallet from the navbar to enable on-chain transactions.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Stats */}
                    <div>
                        {/* Trust Score Card */}
                        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '16px' }}>Trust Score</h3>
                            <div style={{ textAlign: 'center' }}>
                                <div
                                    className={getTrustScoreClass(profile?.trustScore || 50)}
                                    style={{ fontSize: '48px', fontWeight: '600' }}
                                >
                                    {profile?.trustScore || 50}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    out of 100
                                </p>
                            </div>
                            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Your trust score is calculated based on:
                                </p>
                                <ul style={{ fontSize: '13px', marginTop: '8px', paddingLeft: '16px' }}>
                                    <li>40% - Invoice success rate</li>
                                    <li>25% - Buyer reputation</li>
                                    <li>20% - Invoice consistency</li>
                                    <li>15% - Payment history</li>
                                </ul>
                            </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="card" style={{ padding: '24px' }}>
                            <h3 style={{ marginBottom: '16px' }}>Performance</h3>

                            <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Invoices</span>
                                <strong>{profile?.totalInvoices || 0}</strong>
                            </div>

                            <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Successful</span>
                                <strong style={{ color: 'var(--color-success)' }}>{profile?.successfulInvoices || 0}</strong>
                            </div>

                            <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Defaulted</span>
                                <strong style={{ color: 'var(--color-error)' }}>{profile?.defaultedInvoices || 0}</strong>
                            </div>

                            <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Success Rate</span>
                                <strong>
                                    {profile?.totalInvoices > 0
                                        ? ((profile.successfulInvoices / profile.totalInvoices) * 100).toFixed(1)
                                        : 0}%
                                </strong>
                            </div>

                            <div className="flex-between" style={{ padding: '12px 0' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Raised</span>
                                <strong style={{ color: 'var(--color-primary)' }}>
                                    {parseFloat(profile?.totalRaised || 0).toFixed(4)} ETH
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SellerProfile

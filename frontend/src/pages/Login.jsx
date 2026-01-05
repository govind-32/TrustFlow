import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

function Login({ onLogin }) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: searchParams.get('role') || 'seller'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            onLogin(data.user, data.token)
            navigate(data.user.role === 'seller' ? '/seller' : '/investor')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleWalletLogin = async () => {
        if (typeof window.ethereum === 'undefined') {
            setError('Please install MetaMask to continue with wallet')
            return
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            if (accounts.length > 0) {
                // For demo, create a temporary user from wallet
                const tempUser = {
                    id: accounts[0],
                    username: accounts[0].slice(0, 8),
                    role: formData.role,
                    walletAddress: accounts[0]
                }
                onLogin(tempUser, 'wallet-auth')
                navigate(formData.role === 'seller' ? '/seller' : '/investor')
            }
        } catch (err) {
            setError('Failed to connect wallet')
        }
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '400px' }}>
                <div className="card" style={{ padding: '32px' }}>
                    <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Login</h1>
                    <p style={{ textAlign: 'center', marginBottom: '24px' }}>Welcome back to TrustFlow</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Login As</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="seller"
                                        checked={formData.role === 'seller'}
                                        onChange={handleChange}
                                    />
                                    Seller
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="investor"
                                        checked={formData.role === 'investor'}
                                        onChange={handleChange}
                                    />
                                    Investor
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                name="username"
                                className="form-input"
                                placeholder="Enter username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <button onClick={handleWalletLogin} className="btn btn-outline btn-full">
                        Continue with Wallet
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '24px' }}>
                        New user? <Link to={`/register?role=${formData.role}`}>Create Account</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login

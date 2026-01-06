import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

function Login({ onLogin, user }) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: searchParams.get('role') || 'seller'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const role = user.role?.toLowerCase()
            navigate(role === 'seller' ? '/seller' : '/investor', { replace: true })
        }
    }, [user, navigate])

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

            // Call onLogin first, then navigate
            onLogin(data.user, data.token)

            const role = data.user.role?.toLowerCase()
            const destination = role === 'seller' ? '/seller' : '/investor'

            // Use window.location for guaranteed navigation
            window.location.href = destination
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

                const destination = formData.role === 'seller' ? '/seller' : '/investor'
                window.location.href = destination
            }
        } catch (err) {
            setError('Failed to connect wallet')
        }
    }

    // Don't render if already logged in
    if (user) {
        return <div className="page"><div className="container">Redirecting...</div></div>
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

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './Login.css'
import logo from '../assets/logo.png'

function Login({ onLogin }) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
        role: searchParams.get('role') || 'seller'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setFormData({ ...formData, [e.target.name]: value })
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
                    username: formData.email,
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

    const handleSocialLogin = async (provider) => {
        setError('')
        // Implement social login logic here
        console.log(`Login with ${provider}`)
        setError(`${provider} login coming soon!`)
    }

    const handleWalletLogin = async () => {
        if (typeof window.ethereum === 'undefined') {
            setError('Please install MetaMask to continue with wallet')
            return
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            if (accounts.length > 0) {
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
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    {/* Logo/Icon */}
                    <div className="login-icon">
                        <img src={logo} alt="TrustFlow Logo" style={{ height: '48px', width: 'auto' }} />
                    </div>

                    {/* Heading */}
                    <h1 className="login-title">Sign in to your account</h1>

                    {/* Error Message */}
                    {error && <div className="login-error">{error}</div>}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        {/* Role Selection */}
                        <div className="role-selection">
                            <label className="field-label">Login As</label>
                            <div className="role-buttons">
                                <button
                                    type="button"
                                    className={`role-button ${formData.role === 'seller' ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, role: 'seller' })}
                                >
                                    Seller
                                </button>
                                <button
                                    type="button"
                                    className={`role-button ${formData.role === 'investor' ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, role: 'investor' })}
                                >
                                    Investor
                                </button>
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="field-label">Email address</label>
                            <input
                                type="email"
                                name="email"
                                className="field-input"
                                placeholder=""
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-field">
                            <label className="field-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="field-input"
                                placeholder=""
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="checkbox-input"
                                />
                                <span>Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="signin-button" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="login-divider">
                        <span>Or continue with</span>
                    </div>

                    {/* Wallet Button */}
                    <button 
                        type="button" 
                        className="social-button wallet-button-full"
                        onClick={handleWalletLogin}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 5C2 3.34315 3.34315 2 5 2H15C16.6569 2 18 3.34315 18 5V15C18 16.6569 16.6569 18 15 18H5C3.34315 18 2 16.6569 2 15V5Z" />
                            <path d="M14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10Z" fill="#1e293b"/>
                            <rect x="4" y="4" width="12" height="3" rx="1" />
                        </svg>
                        Connect to Wallet
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Login

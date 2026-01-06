import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './Register.css'
import logo from '../assets/logo.png'

function Register({ onLogin }) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: searchParams.get('role') || 'seller'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const value = e.target.type === 'radio' ? e.target.value : e.target.value
        setFormData({ ...formData, [e.target.name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            onLogin(data.user, data.token)
            navigate(data.user.role === 'seller' ? '/seller' : '/investor')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-card">
                    {/* Logo/Icon */}
                    <div className="login-icon">
                                            <img src={logo} alt="TrustFlow Logo" style={{ height: '48px', width: 'auto' }} />
                                        </div>

                    {/* Heading */}
                    <h1 className="register-title">Create your account</h1>
                    <p className="register-subtitle">Join TrustFlow today</p>

                    {/* Error Message */}
                    {error && <div className="register-error">{error}</div>}

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="register-form">
                        {/* Role Selection */}
                        <div className="role-selection">
                            <label className="field-label">Register As</label>
                            <div className="role-buttons">
                                <button
                                    type="button"
                                    className={`role-button ${formData.role === 'seller' ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, role: 'seller' })}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                    </svg>
                                    Seller
                                </button>
                                <button
                                    type="button"
                                    className={`role-button ${formData.role === 'investor' ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, role: 'investor' })}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                    Investor
                                </button>
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="field-label">Username</label>
                            <input
                                type="text"
                                name="username"
                                className="field-input"
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-field">
                            <label className="field-label">Email (Optional)</label>
                            <input
                                type="email"
                                name="email"
                                className="field-input"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-field">
                            <label className="field-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="field-input"
                                placeholder="Create password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="form-field">
                            <label className="field-label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="field-input"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <button type="submit" className="create-button" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="register-footer">
                        <span>Already have an account? </span>
                        <Link to={`/login?role=${formData.role}`} className="login-link">
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register

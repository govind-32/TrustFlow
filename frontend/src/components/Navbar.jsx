import { Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'

function Navbar({ user, wallet, onLogout, onWalletConnect }) {
    const navigate = useNavigate()
    const location = useLocation()
    const isLanding = location.pathname === '/'

    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask to connect your wallet')
            return
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            if (accounts.length > 0) {
                onWalletConnect(accounts[0])

                // Link wallet to backend if logged in
                const token = localStorage.getItem('trustflow_token')
                if (token) {
                    await fetch('/api/auth/link-wallet', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ walletAddress: accounts[0] })
                    })
                }
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error)
        }
    }

    const handleLogout = () => {
        onLogout()
        navigate('/')
    }

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const isLoginPage = location.pathname === '/login'
    const isRegisterPage = location.pathname === '/register'

    return (
        <nav className={`navbar ${isLanding ? 'navbar-landing' : ''} ${isLoginPage ? 'navbar-login' : ''} ${isRegisterPage ? 'navbar-register' : ''}`}>
            <div className="container navbar-content">
                <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logo} alt="TrustFlow Logo" style={{ height: '28px', width: 'auto' }} />
                    TrustFlow
                </Link>

                <div className="navbar-nav">
                    {!user ? (
                        <>
                            <Link to="/login" className="navbar-link">Login</Link>
                            <Link to="/register" className="btn btn-primary">Get Started</Link>
                        </>
                    ) : (
                        <>
                            {(user.role === 'seller' || user.role === 'SELLER') && (
                                <>
                                    <Link to="/seller" className="navbar-link">Dashboard</Link>
                                    <Link to="/seller/create" className="navbar-link">Create Invoice</Link>
                                    <Link to="/seller/invoices" className="navbar-link">My Invoices</Link>
                                    <Link to="/seller/profile" className="navbar-link">Profile</Link>
                                </>
                            )}
                            {(user.role === 'investor' || user.role === 'INVESTOR') && (
                                <>
                                    <Link to="/investor" className="navbar-link">Marketplace</Link>
                                    <Link to="/investor/portfolio" className="navbar-link">Portfolio</Link>
                                </>
                            )}

                            {wallet ? (
                                <span className="badge badge-verified">{formatAddress(wallet)}</span>
                            ) : (
                                <button onClick={connectWallet} className="btn btn-outline">
                                    Connect Wallet
                                </button>
                            )}

                            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar

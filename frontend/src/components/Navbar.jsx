import { Link, useNavigate } from 'react-router-dom'

function Navbar({ user, wallet, onLogout, onWalletConnect }) {
    const navigate = useNavigate()

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

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="navbar-logo">TrustFlow</Link>

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
                            {user.role === 'investor' && (
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

import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import SellerDashboard from './pages/seller/Dashboard'
import CreateInvoice from './pages/seller/CreateInvoice'
import SellerInvoices from './pages/seller/Invoices'
import SellerProfile from './pages/seller/Profile'
import InvestorDashboard from './pages/investor/Dashboard'
import InvestorPortfolio from './pages/investor/Portfolio'
import BuyerAccess from './pages/buyer/Access'
import BuyerVerify from './pages/buyer/Verify'

function App() {
    const [user, setUser] = useState(null)
    const [wallet, setWallet] = useState(null)

    useEffect(() => {
        // Check for saved user session
        const savedUser = localStorage.getItem('trustflow_user')
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
    }, [])

    const handleLogin = (userData, token) => {
        setUser(userData)
        localStorage.setItem('trustflow_user', JSON.stringify(userData))
        localStorage.setItem('trustflow_token', token)
    }

    const handleLogout = () => {
        setUser(null)
        setWallet(null)
        localStorage.removeItem('trustflow_user')
        localStorage.removeItem('trustflow_token')
    }

    const handleWalletConnect = (address) => {
        setWallet(address)
    }

    return (
        <div className="app">
            <Navbar user={user} wallet={wallet} onLogout={handleLogout} onWalletConnect={handleWalletConnect} />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login onLogin={handleLogin} user={user} />} />
                <Route path="/register" element={<Register onLogin={handleLogin} />} />

                {/* Seller Routes */}
                <Route path="/seller" element={<SellerDashboard user={user} wallet={wallet} />} />
                <Route path="/seller/create" element={<CreateInvoice user={user} />} />
                <Route path="/seller/invoices" element={<SellerInvoices user={user} />} />
                <Route path="/seller/profile" element={<SellerProfile user={user} />} />

                {/* Investor Routes */}
                <Route path="/investor" element={<InvestorDashboard user={user} wallet={wallet} />} />
                <Route path="/investor/portfolio" element={<InvestorPortfolio user={user} />} />

                {/* Buyer Routes */}
                <Route path="/buyer" element={<BuyerAccess />} />
                <Route path="/verify/:token" element={<BuyerVerify />} />
            </Routes>
        </div>
    )
}

export default App


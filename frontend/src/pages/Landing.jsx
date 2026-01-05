import { Link } from 'react-router-dom'

function Landing() {
    return (
        <div className="page">
            {/* Hero Section */}
            <section className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
               <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>
               Get Paid Early on Your Invoices 🚀
               </h1>

                <p style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px' }}>
                    Turn your verified invoices into instant liquidity. No collateral required.
                    Blockchain-secured, transparent, and fast.
                </p>
                <div className="flex gap-md" style={{ justifyContent: 'center' }}>
                    <Link to="/login?role=seller" className="btn btn-primary" style={{ padding: '14px 28px' }}>
                        Login as Seller
                    </Link>
                    <Link to="/login?role=investor" className="btn btn-secondary" style={{ padding: '14px 28px' }}>
                        Login as Investor
                    </Link>
                </div>
            </section>

            {/* How It Works */}
            <section className="container" style={{ padding: '60px 16px' }}>
                <h2 style={{ fontSize: '24px', textAlign: 'center', marginBottom: '40px' }}>
                    How It Works
                </h2>
                <div className="grid grid-4">
                    <div className="card text-center">
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                        <h3>1. Upload</h3>
                        <p>Seller uploads invoice with buyer details</p>
                    </div>
                    <div className="card text-center">
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
                        <h3>2. Verify</h3>
                        <p>Buyer confirms via wallet or secure link</p>
                    </div>
                    <div className="card text-center">
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
                        <h3>3. Fund</h3>
                        <p>Investor funds verified invoices</p>
                    </div>
                    <div className="card text-center">
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                        <h3>4. Settle</h3>
                        <p>Buyer pays, investor gets returns</p>
                    </div>
                </div>
            </section>

            {/* For Sellers */}
            <section className="container" style={{ padding: '40px 16px' }}>
                <div className="grid grid-2" style={{ gap: '40px', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '24px' }}>For Sellers (MSMEs)</h2>
                        <ul style={{ listStyle: 'none', marginTop: '20px' }}>
                            <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                ✓ Get instant liquidity on pending invoices
                            </li>
                            <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                ✓ No collateral required
                            </li>
                            <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                ✓ Build trust score for better rates
                            </li>
                            <li style={{ padding: '10px 0' }}>
                                ✓ Don't wait 60+ days for payment
                            </li>
                        </ul>
                        <Link to="/register?role=seller" className="btn btn-primary mt-lg">
                            Start as Seller
                        </Link>
                    </div>
                    <div className="card" style={{ padding: '32px' }}>
                        <div className="stat-card">
                            <div className="stat-value">60+ Days</div>
                            <div className="stat-label">Average payment delay eliminated</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Investors */}
            <section className="container" style={{ padding: '40px 16px 60px' }}>
                <div className="grid grid-2" style={{ gap: '40px', alignItems: 'center' }}>
                    <div className="card" style={{ padding: '32px' }}>
                        <div className="stat-card">
                            <div className="stat-value">Verified</div>
                            <div className="stat-label">All invoices buyer-confirmed</div>
                        </div>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '24px' }}>For Investors</h2>
                        <ul style={{ listStyle: 'none', marginTop: '20px' }}>
                            <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                ✓ Browse verified, buyer-confirmed invoices
                            </li>
                            <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                ✓ Trust scores for risk assessment
                            </li>
                            <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                ✓ Transparent yield calculations
                            </li>
                            <li style={{ padding: '10px 0' }}>
                                ✓ Automated settlement via smart contracts
                            </li>
                        </ul>
                        <Link to="/register?role=investor" className="btn btn-secondary mt-lg">
                            Start as Investor
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Landing

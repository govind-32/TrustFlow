import React, { useState } from 'react';

const Roles = () => {
  const [activeTab, setActiveTab] = useState('seller');

  const benefits = {
    seller: [
      { title: "Instant Liquidity", desc: "Convert unpaid invoices into cash in hours, not months." },
      { title: "Competitive Rates", desc: "Access lower rates through our decentralized marketplace." },
      { title: "No Collateral", desc: "Your invoice is the collateral. No personal guarantees required." }
    ],
    investor: [
      { title: "High Yields", desc: "Earn superior risk-adjusted returns compared to traditional savings." },
      { title: "Short Duration", desc: "30-90 day investment cycles for better liquidity management." },
      { title: "Transparency", desc: "Full visibility into invoice details and borrower trust scores." }
    ],
    buyer: [
      { title: "Extended Terms", desc: "Support your suppliers without impacting your own working capital." },
      { title: "Supply Chain Health", desc: "Ensure your vendors have the cash flow to keep delivering." },
      { title: "Digital Process", desc: "Streamline invoice verification and payments on one platform." }
    ]
  };

  return (
    <section className="landing-section section-roles">
      <div className="landing-container">
        <div className="section-header">
          <h2>Built for the Entire Ecosystem</h2>
        </div>

        <div className="role-tabs">
          <button 
            className={`role-tab ${activeTab === 'seller' ? 'active' : ''}`}
            onClick={() => setActiveTab('seller')}
          >
            Sellers
          </button>
          <button 
            className={`role-tab ${activeTab === 'investor' ? 'active' : ''}`}
            onClick={() => setActiveTab('investor')}
          >
            Investors
          </button>
          <button 
            className={`role-tab ${activeTab === 'buyer' ? 'active' : ''}`}
            onClick={() => setActiveTab('buyer')}
          >
            Buyers
          </button>
        </div>

        <div className="benefits-grid">
          {benefits[activeTab].map((item, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon"></div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roles;

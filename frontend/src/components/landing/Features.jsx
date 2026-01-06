import React from 'react';
import { Link } from 'react-router-dom';
import phoneImg from '../../assets/logo3.png'; 

const Features = () => {
  return (
    <>
      {/* Strategies Design Section */}
      <section className="rh-section-gradient">
        <div className="landing-container">
          <div className="rh-strategies-grid">
            
            <div className="rh-strategies-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', fontWeight: '600' }}>
                 <span>TrustFlow Strategies</span>
              </div>
              <h2 className="rh-heading-strategies">
                Your portfolio, handled<br/>
                by smart contracts
              </h2>
              <p className="rh-text-strategies">
                Get timely market yields with an expert-managed portfolio that proactively adjusts your investments. 
                TrustFlow members get zero management fees on every dollar over $100K.
              </p>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '32px' }}>
                Terms apply. Yields variable based on market demand.
              </p>
              <Link to="/register?role=investor" className="btn-rh-neon">
                Start investing
              </Link>
            </div>

            <div className="rh-strategies-visual">
              <img src={phoneImg} alt="TrustFlow App Interface" />
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default Features;

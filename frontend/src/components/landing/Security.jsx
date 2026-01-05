import React from 'react';
import securityLogo from '../../assets/logo2.png';

const Security = () => {
  return (
    <section className="rh-section-white">
      <div className="landing-container">
        <div className="rh-security-grid">
          <div className="rh-security-content">
            <h2 className="rh-heading-large-black">Your capital’s safe<br/>space</h2>
            <p className="rh-text-black">
              With TrustFlow Secure, you’re entering a new era of invoice financing security — where our proactive, blockchain-backed defenses help protect every transaction, 24/7.
            </p>
            <button className="btn-rh-black">Learn more</button>
          </div>
          
          <div className="rh-security-visual">
            <img src={securityLogo} alt="TrustFlow Secure Shield" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;

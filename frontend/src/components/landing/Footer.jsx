import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="rh-footer">
      <div className="landing-container">
        <div className="rh-footer-grid">
          <div className="rh-footer-col">
            <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>TrustFlow</h4>
            <p className="rh-text" style={{ maxWidth: '300px' }}>
              Join a new generation of businesses and investors building a more efficient financial future.
            </p>
          </div>
          <div className="rh-footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link to="#">About Us</Link></li>
              <li><Link to="#">Careers</Link></li>
              <li><Link to="#">Press</Link></li>
            </ul>
          </div>
          <div className="rh-footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link to="#">Help Center</Link></li>
              <li><Link to="#">Contact</Link></li>
              <li><Link to="#">Status</Link></li>
            </ul>
          </div>
          <div className="rh-footer-col">
            <h4>Legal</h4>
            <ul>
              <li><Link to="#">Privacy</Link></li>
              <li><Link to="#">Terms</Link></li>
              <li><Link to="#">Disclosures</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="rh-disclaimer">
          <p>
            TrustFlow is a financial technology company, not a bank. Banking services provided by our partners.
            Investing involves risk, including loss of principal. Past performance does not guarantee future results.
            <br /><br />
            &copy; {new Date().getFullYear()} TrustFlow Technologies, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

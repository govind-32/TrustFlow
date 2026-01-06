import React from 'react';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="landing-section section-cta">
      <div className="landing-container">
        <div className="cta-content">
          <h2>Ready to optimize your cash flow?</h2>
          <p>Join thousands of businesses and investors on TrustFlow today.</p>
          <Link to="/register" className="btn-landing btn-primary btn-large">
            Get Started Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;

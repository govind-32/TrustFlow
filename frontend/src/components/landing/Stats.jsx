import React from 'react';

const Stats = () => {
  return (
    <section className="landing-section section-stats">
      <div className="landing-container">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Buyer Verified</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">&lt; 24h</div>
            <div className="stat-label">Funding Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">$0</div>
            <div className="stat-label">Hidden Fees</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Market Access</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;

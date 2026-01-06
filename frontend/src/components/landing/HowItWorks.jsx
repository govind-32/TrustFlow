import React from 'react';

const HowItWorks = () => {
  return (
    <section className="landing-section section-how-it-works">
      <div className="landing-container">
        <div className="section-header">
          <h2>How TrustFlow Works</h2>
          <p>Simple, secure, and efficient for everyone involved.</p>
        </div>

        <div className="flow-container">
          <div className="flow-column">
            <h3>For Sellers</h3>
            <div className="steps">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Upload Invoice</h4>
                  <p>Submit your verified invoices to the platform.</p>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Verification</h4>
                  <p>Buyers verify the invoice details on-chain.</p>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Get Funded</h4>
                  <p>Receive funds instantly from global investors.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flow-divider"></div>

          <div className="flow-column">
            <h3>For Investors</h3>
            <div className="steps">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Browse Opportunities</h4>
                  <p>Filter invoices by risk score and yield.</p>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Fund Invoices</h4>
                  <p>Invest stablecoins in fractionalized invoices.</p>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Earn Returns</h4>
                  <p>Get paid when the invoice is settled.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

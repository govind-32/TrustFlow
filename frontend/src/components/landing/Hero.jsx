import React from 'react';
import { Link } from 'react-router-dom';
import heroVideo from '../../assets/hero.mp4'; 

const Hero = () => {
  return (
    <section className="rh-hero">
      <div className="landing-container">
        <div className="rh-hero-grid">
          
          {/* Left Side: Content */}
          <div className="rh-hero-content">
            <h1 className="rh-heading">
              Unlock growth<br />
              with every<br />
              <span style={{ color: 'var(--rh-neon-green)' }}>payment.</span>
            </h1>
            <p className="rh-text">
              Run payments, extend net terms and automate collections compliance.
              TrustFlow connects MSMEs with investors for instant invoice financing.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-rh-primary">
                Get Started
              </Link>
              <Link to="/contact" className="btn-rh-outline">
                Talk to a human
              </Link>
            </div>
          </div>

          {/* Right Side: Video */}
          <div className="rh-hero-video-container">
            <div className="rh-video-wrapper">
              <video 
                className="rh-hero-video"
                autoPlay 
                loop 
                muted 
                playsInline
                src={heroVideo}
              >
                Your browser does not support the video tag.
              </video>
              
              {/* If you want to use the local video, place it in:
                  c:\TrustFlow\frontend\src\assets\hero.mp4
                  And uncomment the import above and the src prop.
              */}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;


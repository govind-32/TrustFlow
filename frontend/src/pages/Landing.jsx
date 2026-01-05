import React from 'react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Security from '../components/landing/Security';
import Education from '../components/landing/Education';
import Footer from '../components/landing/Footer';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      <main>
        <Hero />
        <Security />
        <Features />
        <Education />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;


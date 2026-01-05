import React from 'react';
import { Link } from 'react-router-dom';

const Education = () => {
  return (
    <section className="landing-container">
      <div className="rh-education">
        <div>
          <h2>Master Invoice Financing.</h2>
          <p>
            Learn how to optimize your working capital and understand the mechanics of decentralized finance.
          </p>
          <Link to="/register" className="btn-rh-black">
            Start Learning
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
           {/* Simple visual for education list */}
           <div style={{ 
             background: 'white', 
             padding: '20px', 
             borderRadius: '16px', 
             width: '100%', 
             maxWidth: '300px',
             boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
           }}>
             <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
               <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Why Invest?</div>
               <div style={{ fontSize: '12px', color: '#666' }}>Read 3 min</div>
             </div>
             <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
               <div style={{ fontWeight: 'bold', fontSize: '14px' }}>What is Factoring?</div>
               <div style={{ fontSize: '12px', color: '#666' }}>Read 5 min</div>
             </div>
             <div>
               <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Risk Management</div>
               <div style={{ fontSize: '12px', color: '#666' }}>Read 7 min</div>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default Education;

import React from 'react';

const Compliance = () => (
  <section className="problem-section">
    <div className="section-container">
      <div className="section-header">
        <span className="section-tag">Legal</span>
        <h2>Compliance & Verification</h2>
        <p>Summary of regulatory requirements and our agency verification process.</p>
      </div>

      <div className="problem-grid">
        <div className="problem-card">
          <h3>KYC Requirements</h3>
          <p>Buyers and agencies may need to complete KYC depending on auction rules.</p>
        </div>
        <div className="problem-card">
          <h3>Tax Documentation</h3>
          <p>PAN/GST requirements are noted on listings when applicable; Setu helps surface required docs.</p>
        </div>
        <div className="problem-card">
          <h3>Agency Audits</h3>
          <p>We periodically audit partner agencies and suspend listings that fail compliance checks.</p>
        </div>
      </div>
    </div>
  </section>
);

export default Compliance;

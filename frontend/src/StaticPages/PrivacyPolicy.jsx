import React from 'react';

const PrivacyPolicy = () => (
  <section className="features-section">
    <div className="section-container">
      <div className="section-header">
        <span className="section-tag">Legal</span>
        <h2>Privacy Policy</h2>
        <p>We respect your privacy. This page summarizes how we collect and handle data.</p>
      </div>

      <div className="section-content">
        <h3>Data We Collect</h3>
        <ul>
          <li>Account information (name, email, contact details)</li>
          <li>KYC documents where required by agencies</li>
          <li>Usage data and preferences to improve services</li>
        </ul>

        <h3>How We Use Data</h3>
        <ul>
          <li>To verify accounts and agency listings</li>
          <li>To process transactions and delivery</li>
          <li>To send notifications and product updates</li>
        </ul>
      </div>
    </div>
  </section>
);

export default PrivacyPolicy;

import React from 'react';

const FAQ = () => (
  <section className="features-section">
    <div className="section-container">
      <div className="section-header">
        <span className="section-tag">Support</span>
        <h2>Frequently Asked Questions</h2>
        <p>Answers to common questions about auctions, payments and delivery.</p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <h3>How do I participate in an auction?</h3>
          <p>Create an account, complete required KYC and follow the bidding instructions on the listing.</p>
        </div>
        <div className="feature-card">
          <h3>What payment methods are supported?</h3>
          <p>We support major payment gateways; some auctions may require bank transfers or EMDs.</p>
        </div>
        <div className="feature-card">
          <h3>Can I inspect items before bidding?</h3>
          <p>Many listings include condition reports and images; some auctions provide inspection windows per agency rules.</p>
        </div>
        <div className="feature-card">
          <h3>What if I win an auction?</h3>
          <p>Complete payment within the specified timeframe and choose pickup or delivery. Contact support if issues arise.</p>
        </div>
      </div>
    </div>
  </section>
);

export default FAQ;

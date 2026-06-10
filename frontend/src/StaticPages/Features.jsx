import React from 'react';

const Features = () => (
  <section className="features-section">
    <div className="section-container">
      <div className="section-header">
        <span className="section-tag">Product</span>
        <h2>Platform Features</h2>
        <p>Reliable, secure, and transparent access to government auctions and seized goods.</p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon" />
          <h3>Digital Marketplace</h3>
          <p>Centralized listings from verified agencies, searchable by category and location.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" />
          <h3>Verified Agencies</h3>
          <p>Strict onboarding and verification to ensure reliability and legality of listings.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" />
          <h3>Tender & Bid Management</h3>
          <p>Real-time tender tracking, automatic bid updates and notifications.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" />
          <h3>Inventory Controls</h3>
          <p>Live stock levels, product condition notes and high-quality images on each listing.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" />
          <h3>Secure Payments</h3>
          <p>Integrated payment partners and escrow-like flows for trust and compliance.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" />
          <h3>Logistics & Delivery</h3>
          <p>Options for pickup, partnered couriers and insured deliveries for buyers.</p>
        </div>
      </div>
    </div>
  </section>
);

export default Features;

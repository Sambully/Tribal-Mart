import React from 'react';

const HowItWorks = () => (
  <section className="how-it-works">
    <div className="section-container">
      <div className="section-header">
        <span className="section-tag">Process</span>
        <h2>How Setu Works</h2>
        <p>Simple, transparent steps to discover and purchase auctioned goods.</p>
      </div>

      <div className="steps-container">
        <div className="step">
          <div className="step-number">01</div>
          <h3>Agency Lists Goods</h3>
          <p>Government agencies upload items with documentation and images.</p>
        </div>
        <div className="step-arrow">→</div>
        <div className="step">
          <div className="step-number">02</div>
          <h3>Verification & Publishing</h3>
          <p>Setu verifies agency credentials and publishes the authenticated listing.</p>
        </div>
        <div className="step-arrow">→</div>
        <div className="step">
          <div className="step-number">03</div>
          <h3>Browse & Bid</h3>
          <p>Buyers browse categories, inspect condition and place secure bids.</p>
        </div>
        <div className="step-arrow">→</div>
        <div className="step">
          <div className="step-number">04</div>
          <h3>Complete & Deliver</h3>
          <p>Winners complete payment and choose delivery or pickup options.</p>
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;

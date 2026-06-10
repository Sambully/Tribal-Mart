import React from 'react';

const About = () => (
  <section className="problem-section">
    <div className="section-container">
      <div className="section-header">
        <span className="section-tag">About</span>
        <h2>About Setu</h2>
        <p>We bridge the gap between government auctions and everyday buyers, driving transparency and circularity.</p>
      </div>

      <div className="problem-grid">
        <div className="problem-card">
          <h3>Our Mission</h3>
          <p>Make government-held goods accessible, affordable, and traceable to reduce waste and increase public benefit.</p>
        </div>
        <div className="problem-card">
          <h3>Our Vision</h3>
          <p>To be the trusted marketplace connecting verified agencies and responsible buyers at scale.</p>
        </div>
        <div className="problem-card">
          <h3>Core Values</h3>
          <p>Transparency, Compliance, Trust, and Sustainability guide every product decision.</p>
        </div>
      </div>
    </div>
  </section>
);

export default About;

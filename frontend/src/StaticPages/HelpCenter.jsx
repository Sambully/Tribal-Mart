import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './StaticPage.css';

const topics = [
  { icon: '🛒', title: 'Browsing & Buying',
    bullets: ['How to search by community, region, or craft', 'Reading authenticity labels', 'Saving items to your watchlist'] },
  { icon: '💳', title: 'Payments & Refunds',
    bullets: ['Accepted methods (UPI, cards, net banking)', 'Razorpay test checkout', 'How refunds reach the artisan'] },
  { icon: '📦', title: 'Delivery & Pickup',
    bullets: ['Tracking your order', 'Insured shipping for fragile pieces', 'Pickup options for regional buyers'] },
  { icon: '🏢', title: 'For Agencies',
    bullets: ['Uploading verification documents', 'Listing your first product', 'Getting an agent to help manage listings'] },
  { icon: '🤝', title: 'For Agents',
    bullets: ['Accepting an agency help request', 'Listing on behalf of a managed agency', 'How approvals flow to admin'] },
  { icon: '🛡️', title: 'Authenticity & Provenance',
    bullets: ['How we verify tribal lineage', 'Reading the certificate of origin', 'Reporting a concern'] },
];

const quickFaqs = [
  { q: 'How do I know my purchase reaches the artisan?',
    a: 'Each transaction is split through our settlement engine: 80% goes directly to the maker, 12% to community fund, 8% covers logistics. You receive a settlement receipt with every order.' },
  { q: 'Can I commission a bespoke piece?',
    a: 'Yes — message the agency or agent on any product page. Lead times vary by craft; Dhokra commissions typically take 4-6 weeks, embroidery work 2-3 weeks.' },
  { q: 'What if an item arrives damaged?',
    a: 'Open a return within 7 days from your Orders page. Our team coordinates the replacement directly with the artisan community.' },
  { q: 'I am an artisan — how do I join?',
    a: 'Sign up as an Agency from the portal page, upload your craft documents, and our verification team will reach out within 3 business days.' },
];

const HelpCenter = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="tm-static-page">
      <div className="tm-static-bg" aria-hidden />

      <header className="tm-static-nav">
        <button className="tm-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <button className="tm-back-btn" onClick={() => navigate('/')}>Home</button>
      </header>

      <section className="tm-static-hero">
        <div className="tm-static-hero-inner">
          <motion.span
            className="tm-static-tag"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Help Center
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            How can we <em>help</em>?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
          >
            Guides, troubleshooting tips, and answers for everyone in the Tribal Mart community —
            buyers, agencies, and agents alike.
          </motion.p>

          <motion.div
            className="tm-search-bar"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
          >
            <span className="tm-search-icon">🔍</span>
            <input type="text" placeholder="Search guides, payments, deliveries…" />
            <button className="tm-search-go">Search</button>
          </motion.div>
        </div>
      </section>

      {/* Topic grid */}
      <section className="tm-static-section">
        <div className="tm-static-inner">
          <div className="tm-static-heading">
            <div className="tm-section-tag">Browse by topic</div>
            <h2>Find what you need, fast</h2>
          </div>
          <div className="tm-topic-grid">
            {topics.map((t, i) => (
              <motion.div
                key={i}
                className="tm-topic-card"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px 0px' }}
                transition={{ duration: 0.55, delay: i * 0.07 }}
                whileHover={{ y: -6 }}
              >
                <div className="tm-topic-icon">{t.icon}</div>
                <h3>{t.title}</h3>
                <ul>
                  {t.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
                <button className="tm-topic-link">Read guide →</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick FAQ */}
      <section className="tm-static-section tm-section-alt">
        <div className="tm-static-inner">
          <div className="tm-static-heading">
            <div className="tm-section-tag">Quick answers</div>
            <h2>Most asked, briefly answered</h2>
          </div>
          <div className="tm-faq-list">
            {quickFaqs.map((f, i) => (
              <div key={i} className={`tm-faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="tm-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{f.q}</span>
                  <span className="tm-faq-toggle">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="tm-faq-a"
                  >
                    <p>{f.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="tm-static-cta">
        <div className="tm-static-cta-inner">
          <h2>Still stuck? <em>Talk to us.</em></h2>
          <p>Our team responds in under 24 hours — usually much sooner.</p>
          <div className="tm-cta-actions">
            <button className="tm-btn-primary" onClick={() => navigate('/contact')}>Contact Us</button>
            <button className="tm-btn-ghost-dark" onClick={() => navigate('/')}>Back to Home</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;

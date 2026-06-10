import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomerSidebar from '../components/CustomerSidebar';
import AgencySidebar from '../components/AgencySidebar';
import AgentSidebar from '../components/AgentSidebar';
import AdminSidebar from '../components/AdminSidebar';
import '../Dashboard/Dashboard.css';
import './StaticPage.css';

const channels = [
  { icon: '✉️', tag: 'EMAIL',     title: 'General inquiries',
    detail: 'hello@tribalmart.in',      sub: 'Reply within 24 hours' },
  { icon: '🏢', tag: 'AGENCIES',  title: 'For tribal cooperatives',
    detail: 'agencies@tribalmart.in',   sub: 'Onboarding & partnerships' },
  { icon: '🤝', tag: 'AGENTS',    title: 'For helping agents',
    detail: 'agents@tribalmart.in',     sub: 'Become a community agent' },
  { icon: '📰', tag: 'PRESS',     title: 'Media & press',
    detail: 'press@tribalmart.in',      sub: 'Stories, interviews, features' },
];

const offices = [
  { city: 'Bhopal',  region: 'Madhya Pradesh',
    address: 'Trust Building, MP Nagar Zone 1, Bhopal 462011', phone: '+91 755 4XXX XXX' },
  { city: 'Ranchi',  region: 'Jharkhand',
    address: 'Tribal Heritage Bhawan, Morabadi, Ranchi 834008',  phone: '+91 651 2XXX XXX' },
  { city: 'Coimbatore', region: 'Tamil Nadu',
    address: 'Crafts Hub, Race Course Road, Coimbatore 641018',  phone: '+91 422 4XXX XXX' },
];

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: 'General', message: '' });
  const [sent, setSent] = useState(false);

  // Detect logged-in user — if so, render inside the dashboard chrome with the
  // appropriate role sidebar
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();
  const role = storedUser?.role;
  const isLoggedIn = !!role;
  const SidebarForRole = role === 'agency' ? AgencySidebar
    : role === 'agent'   ? AgentSidebar
    : role === 'admin'   ? AdminSidebar
    : CustomerSidebar;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: '', email: '', subject: 'General', message: '' });
  };

  // ── Logged-in view: dashboard chrome + role-appropriate sidebar ──
  if (isLoggedIn) {
    return (
      <div className="dashboard-container">
        <SidebarForRole />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="header-content">
              <h1>Contact Us</h1>
              <p>Get in touch — our team replies within a working day.</p>
            </div>
            <div className="header-actions">
              <div className="user-profile">
                <div className="profile-avatar">{(storedUser.name || 'C').charAt(0).toUpperCase()}</div>
                <div className="profile-info">
                  <div className="profile-name">{storedUser.name}</div>
                  <div className="profile-role">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Channel cards */}
          <section className="dashboard-section">
            <div className="section-header"><h2>Reach the right team</h2></div>
            <div className="tm-channel-grid">
              {channels.map((c, i) => (
                <motion.div
                  key={i}
                  className="tm-channel-card"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                >
                  <span className="tm-channel-tag">{c.tag}</span>
                  <div className="tm-channel-icon">{c.icon}</div>
                  <h3>{c.title}</h3>
                  <a href={`mailto:${c.detail}`} className="tm-channel-detail">{c.detail}</a>
                  <span className="tm-channel-sub">{c.sub}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Form + offices */}
          <section className="dashboard-section">
            <div className="tm-contact-grid">
              <form className="tm-contact-form" onSubmit={onSubmit}>
                <h3>Send a message</h3>
                <p>We'll get back within a working day.</p>
                <div className="tm-field-row">
                  <label className="tm-field">
                    <span>Name</span>
                    <input name="name" value={form.name || storedUser.name || ''} onChange={onChange} placeholder="Your name" required />
                  </label>
                  <label className="tm-field">
                    <span>Email</span>
                    <input type="email" name="email" value={form.email || storedUser.email || ''} onChange={onChange} placeholder="you@email.com" required />
                  </label>
                </div>
                <label className="tm-field">
                  <span>I'm reaching out about</span>
                  <select name="subject" value={form.subject} onChange={onChange}>
                    <option>General question</option>
                    <option>Order or delivery</option>
                    <option>Refund or return</option>
                    <option>Account help</option>
                    <option>Feedback</option>
                  </select>
                </label>
                <label className="tm-field">
                  <span>Message</span>
                  <textarea name="message" value={form.message} onChange={onChange} rows="5" placeholder="Tell us what's on your mind…" required />
                </label>
                <button type="submit" className="tm-btn-primary tm-btn-block">
                  {sent ? '✓ Thanks — message received' : 'Send message'}
                </button>
              </form>

              <div className="tm-contact-side">
                <h3>Our offices</h3>
                <p>Walk-ins welcome by appointment. We work directly with artisans across India.</p>
                <div className="tm-office-list">
                  {offices.map((o, i) => (
                    <div key={i} className="tm-office-card">
                      <div className="tm-office-head">
                        <h4>{o.city}</h4>
                        <span>{o.region}</span>
                      </div>
                      <p className="tm-office-addr">📍 {o.address}</p>
                      <p className="tm-office-phone">☎ {o.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ── Anonymous / non-customer view: original landing-style page ──
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
            Contact Us
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Let's <em>talk craft.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
          >
            Questions about an order, an artisan, a partnership, or our verification process?
            We read everything and reply personally.
          </motion.p>
        </div>
      </section>

      {/* Channels grid */}
      <section className="tm-static-section">
        <div className="tm-static-inner">
          <div className="tm-static-heading">
            <div className="tm-section-tag">Reach the right team</div>
            <h2>Pick a channel that fits</h2>
          </div>
          <div className="tm-channel-grid">
            {channels.map((c, i) => (
              <motion.div
                key={i}
                className="tm-channel-card"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px 0px' }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <span className="tm-channel-tag">{c.tag}</span>
                <div className="tm-channel-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <a href={`mailto:${c.detail}`} className="tm-channel-detail">{c.detail}</a>
                <span className="tm-channel-sub">{c.sub}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-column: form + offices */}
      <section className="tm-static-section tm-section-alt">
        <div className="tm-static-inner">
          <div className="tm-contact-grid">
            {/* Form */}
            <motion.form
              className="tm-contact-form"
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px 0px' }}
              transition={{ duration: 0.6 }}
            >
              <h3>Send a message</h3>
              <p>We'll get back within a working day.</p>

              <div className="tm-field-row">
                <label className="tm-field">
                  <span>Name</span>
                  <input name="name" value={form.name} onChange={onChange} placeholder="Your name" required />
                </label>
                <label className="tm-field">
                  <span>Email</span>
                  <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@email.com" required />
                </label>
              </div>

              <label className="tm-field">
                <span>I'm reaching out about</span>
                <select name="subject" value={form.subject} onChange={onChange}>
                  <option>General question</option>
                  <option>Order or delivery</option>
                  <option>Becoming an agency</option>
                  <option>Becoming an agent</option>
                  <option>Partnership / press</option>
                </select>
              </label>

              <label className="tm-field">
                <span>Message</span>
                <textarea name="message" value={form.message} onChange={onChange} rows="5" placeholder="Tell us what's on your mind…" required />
              </label>

              <button type="submit" className="tm-btn-primary tm-btn-block">
                {sent ? '✓ Thanks — message received' : 'Send message'}
              </button>
            </motion.form>

            {/* Offices */}
            <div className="tm-contact-side">
              <h3>Our offices</h3>
              <p>Walk-ins welcome by appointment. We work directly with artisans across India.</p>
              <div className="tm-office-list">
                {offices.map((o, i) => (
                  <motion.div
                    key={i}
                    className="tm-office-card"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px 0px' }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <div className="tm-office-head">
                      <h4>{o.city}</h4>
                      <span>{o.region}</span>
                    </div>
                    <p className="tm-office-addr">📍 {o.address}</p>
                    <p className="tm-office-phone">☎ {o.phone}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="tm-static-cta">
        <div className="tm-static-cta-inner">
          <h2>Or skim our <em>Help Center</em> first</h2>
          <p>Most questions are already answered there — payments, deliveries, returns, agency onboarding.</p>
          <div className="tm-cta-actions">
            <button className="tm-btn-primary" onClick={() => navigate('/help')}>Visit Help Center</button>
            <button className="tm-btn-ghost-dark" onClick={() => navigate('/')}>Back to Home</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;

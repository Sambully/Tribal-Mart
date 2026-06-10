import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ContactUs.css';

const ContactUs = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData(prev => ({
      ...prev,
      name: parsedUser.name,
      email: parsedUser.email
    }));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    // Simulate form submission
    setTimeout(() => {
      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your message! We will get back to you within 24-48 hours.'
      });
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: '📍',
      title: 'Visit Us',
      details: ['Ministry of Finance Building', 'North Block, New Delhi - 110001', 'India']
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: ['+91 11 2309 2309', 'Mon-Fri, 9:00 AM - 6:00 PM IST']
    },
    {
      icon: '📧',
      title: 'Email Us',
      details: ['support@setu.gov.in', 'helpdesk@setu.gov.in']
    },
    {
      icon: '🌐',
      title: 'Online',
      details: ['www.setu.gov.in', 'Live chat available']
    }
  ];

  const isAgency = user?.role === 'agency';

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <aside className={`dashboard-sidebar ${isAgency ? 'agency-sidebar' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🔓</span>
            <span className="logo-text">Tribal Mart</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate(isAgency ? '/dashboard/agency' : '/dashboard/customer'); }}>
            <span className="nav-icon">🏠</span>
            <span>Dashboard</span>
          </a>
          {isAgency ? (
            <>
              <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/my-products'); }}>
                <span className="nav-icon">📦</span>
                <span>My Products</span>
              </a>
              <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/add-product'); }}>
                <span className="nav-icon">➕</span>
                <span>Add Product</span>
              </a>
              <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}>
                <span className="nav-icon">📊</span>
                <span>Analytics</span>
              </a>
            </>
          ) : (
            <>
              <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/browse-products'); }}>
                <span className="nav-icon">🛍️</span>
                <span>Browse Products</span>
              </a>
              <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/orders'); }}>
                <span className="nav-icon">📋</span>
                <span>My Orders</span>
              </a>
              <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/watchlist'); }}>
                <span className="nav-icon">❤️</span>
                <span>Watchlist</span>
              </a>
            </>
          )}
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/messages'); }}>
            <span className="nav-icon">💬</span>
            <span>Messages</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/support'); }}>
            <span className="nav-icon">❓</span>
            <span>Support</span>
          </a>
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>
            <span className="nav-icon">📞</span>
            <span>Contact Us</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Contact Us</h1>
            <p>Get in touch with our support team</p>
          </div>
          <div className="header-actions">
            <button className="header-btn">
              <span>🔔</span>
            </button>
            <div className="user-profile">
              <div className={`profile-avatar ${isAgency ? 'agency' : ''}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">{isAgency ? 'Agency' : 'Customer'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Contact Info Cards */}
        <section className="dashboard-section contact-info-section">
          <div className="contact-info-grid">
            {contactInfo.map((info, index) => (
              <div key={index} className="contact-info-card">
                <span className="contact-info-icon">{info.icon}</span>
                <h3>{info.title}</h3>
                {info.details.map((detail, idx) => (
                  <p key={idx}>{detail}</p>
                ))}
              </div>
            ))}
          </div>
        </section>

        <div className="contact-content-grid">
          {/* Contact Form */}
          <section className="dashboard-section contact-form-section">
            <div className="section-header">
              <h2>Send us a Message</h2>
            </div>
            
            {submitStatus.message && (
              <div className={`submit-status ${submitStatus.type}`}>
                {submitStatus.message}
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Support</option>
                  <option value="account">Account Issues</option>
                  <option value="order">Order Related</option>
                  <option value="product">Product Listing</option>
                  <option value="payment">Payment Issues</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Describe your issue or question in detail..."
                />
              </div>

              <button
                type="submit"
                className={`submit-btn ${isAgency ? 'agency' : 'customer'}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>

          {/* Map Section */}
          <section className="dashboard-section map-section">
            <div className="section-header">
              <h2>Find Us</h2>
            </div>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.8588233955835!2d77.2049873150827!3d28.61432498242495!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sMinistry%20of%20Finance!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Setu Office Location"
              />
            </div>
            <div className="map-info">
              <h4>📍 Ministry of Finance, North Block</h4>
              <p>New Delhi - 110001, India</p>
              <div className="map-actions">
                <a
                  href="https://www.google.com/maps/dir//Ministry+of+Finance,+North+Block,+New+Delhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="directions-btn"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Quick Links Section */}
        <section className="dashboard-section quick-links-section">
          <div className="section-header">
            <h2>Quick Help Links</h2>
          </div>
          <div className="quick-links-grid">
            <button className="quick-link-card" onClick={() => navigate('/support')}>
              <span className="quick-link-icon">❓</span>
              <span className="quick-link-text">FAQ / Help Center</span>
            </button>
            <button className="quick-link-card" onClick={() => navigate('/messages')}>
              <span className="quick-link-icon">💬</span>
              <span className="quick-link-text">Live Chat Support</span>
            </button>
            <button className="quick-link-card" onClick={() => navigate('/settings')}>
              <span className="quick-link-icon">⚙️</span>
              <span className="quick-link-text">Account Settings</span>
            </button>
            <button className="quick-link-card" onClick={() => window.open('https://www.setu.gov.in/guidelines', '_blank')}>
              <span className="quick-link-icon">📋</span>
              <span className="quick-link-text">Guidelines & Policies</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ContactUs;

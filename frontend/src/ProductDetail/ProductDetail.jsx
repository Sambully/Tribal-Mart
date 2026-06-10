import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import CustomerSidebar from '../components/CustomerSidebar';
import ReviewSection from '../components/ReviewSection';
import { useToast } from '../components/Toast';
import { compareUtils } from '../Compare/Compare';
import './ProductDetail.css';

const ProductDetail = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [messageData, setMessageData] = useState({
    subject: '',
    message: ''
  });
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login/customer');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchProduct();
  }, [navigate, id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      setProduct(response.data);

      // Track in "recently viewed" (last 10, customers only)
      try {
        const me = JSON.parse(localStorage.getItem('user') || 'null');
        if (me?.role === 'customer') {
          const p = response.data;
          const compact = {
            _id: p._id, title: p.title, sellingPrice: p.sellingPrice, originalPrice: p.originalPrice,
            category: p.category, images: (p.images || []).slice(0, 1), agencyName: p.agencyName,
          };
          const stored = JSON.parse(localStorage.getItem('tm_recent') || '[]');
          const next = [compact, ...stored.filter(x => x._id !== p._id)].slice(0, 10);
          localStorage.setItem('tm_recent', JSON.stringify(next));
        }
      } catch (_) {}
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageChange = (e) => {
    setMessageData({
      ...messageData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    try {
      await api.post('/api/messages', {
        productId: product._id,
        agencyId: product.agency,
        subject: messageData.subject,
        message: messageData.message
      });

      setMessageSent(true);
      setMessageData({ subject: '', message: '' });
      setTimeout(() => {
        setShowMessageForm(false);
        setMessageSent(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const calculateSavings = (original, selling) => {
    return Math.round(((original - selling) / original) * 100);
  };

  if (!user) return null;

  const isCustomer = user.role === 'customer';

  return (
    <div className="dashboard-container">
      {isCustomer ? (
        <CustomerSidebar />
      ) : (
        <aside className="dashboard-sidebar agency-sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-icon">🪔</span>
              <span className="logo-text">Tribal Mart</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/dashboard/agency'); }}>
              <span className="nav-icon">🏠</span><span>Dashboard</span>
            </a>
            <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/my-products'); }}>
              <span className="nav-icon">📦</span><span>My Products</span>
            </a>
            <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/add-product'); }}>
              <span className="nav-icon">➕</span><span>Add Product</span>
            </a>
            <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}>
              <span className="nav-icon">📊</span><span>Analytics</span>
            </a>
            <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/messages'); }}>
              <span className="nav-icon">💬</span><span>Messages</span>
            </a>
            <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
              <span className="nav-icon">⚙️</span><span>Settings</span>
            </a>
          </nav>
          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-btn">
              <span className="nav-icon">🚪</span><span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
            <h1>Product Details</h1>
          </div>
          <div className="header-actions">
            <button className="header-btn">
              <span>🔔</span>
            </button>
            <div className="user-profile">
              <div className={`profile-avatar ${!isCustomer ? 'agency' : ''}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">{isCustomer ? 'Customer' : 'Agency'}</div>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading product...</p>
          </div>
        ) : product ? (
          <div className="product-detail-container">
            <div className="product-detail-grid">
              <div className="product-images-section">
                {product.images && product.images.length > 0 ? (
                  <div className="main-image-container">
                    <img src={getImageUrl(product.images[0])} alt={product.title} className="main-image" />
                    <div className="savings-badge-large">
                      {calculateSavings(product.originalPrice, product.sellingPrice)}% OFF
                    </div>
                  </div>
                ) : (
                  <div className="main-image-placeholder">
                    <span className="placeholder-icon">📦</span>
                  </div>
                )}
              </div>

              <div className="product-info-section">
                <div className="product-category-badge">{product.category}</div>
                <h1 className="product-detail-title">{product.title}</h1>
                
                <div className="product-detail-pricing">
                  <span className="detail-original-price">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="detail-selling-price">₹{product.sellingPrice.toLocaleString()}</span>
                  <span className="savings-text">
                    Save ₹{(product.originalPrice - product.sellingPrice).toLocaleString()}
                  </span>
                </div>

                <div className="product-meta-info">
                  <div className="meta-item">
                    <span className="meta-label">Condition:</span>
                    <span className="meta-value condition-badge">{product.condition}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Available Quantity:</span>
                    <span className="meta-value">{product.quantity}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Agency:</span>
                    <span
                      className="meta-value"
                      style={{ cursor: product.agency ? 'pointer' : 'default', color: product.agency ? 'var(--accent)' : 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => product.agency && navigate(`/store/${typeof product.agency === 'object' ? product.agency._id : product.agency}`)}
                    >
                      {product.agencyName}
                      {product.verifiedAgency && (
                        <span title="This cooperative is verified" style={{
                          background: 'linear-gradient(135deg, var(--forest), #2d4023)',
                          color: 'white', fontFamily: 'var(--font-display)', fontWeight: 800,
                          fontSize: '0.6rem', letterSpacing: '0.08em',
                          padding: '0.18rem 0.5rem', borderRadius: 50,
                        }}>✓ VERIFIED</span>
                      )}
                      {product.agency && '→'}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Views:</span>
                    <span className="meta-value">{product.views || 0}</span>
                  </div>
                </div>

                <div className="product-description-section">
                  <h3>Description</h3>
                  <p>{product.description}</p>
                </div>

                {isCustomer && (
                  <div className="product-actions">
                    <button
                      className="buy-now-btn"
                      onClick={() => navigate('/checkout', { state: { product } })}
                    >
                      ⚡ Buy Now
                    </button>
                    <button
                      className="contact-agency-btn"
                      onClick={async () => {
                        try {
                          await api.post('/api/customer/cart', { productId: product._id, quantity: 1 });
                          setAddedToCart(true);
                          toast.success('Added to cart');
                          setTimeout(() => setAddedToCart(false), 2400);
                        } catch (e) {
                          toast.error(e.response?.data?.message || 'Failed to add to cart');
                        }
                      }}
                      style={{ background: 'var(--ochre)', color: 'white', border: 'none' }}
                    >
                      {addedToCart ? '✓ Added to cart' : '🛒 Add to Cart'}
                    </button>
                    <button
                      className="contact-agency-btn"
                      onClick={() => setShowMessageForm(!showMessageForm)}
                    >
                      💬 Contact
                    </button>
                    <button
                      className="contact-agency-btn"
                      onClick={() => {
                        if (compareUtils.has(product._id)) {
                          compareUtils.remove(product._id);
                          toast.info('Removed from compare');
                        } else {
                          const list = compareUtils.load();
                          if (list.length >= 4) { toast.warning('Compare limit is 4 — remove one first'); return; }
                          compareUtils.add(product._id);
                          toast.success('Added to compare', { duration: 2200 });
                        }
                      }}
                      style={{ background: 'var(--bg-soft)', borderColor: 'var(--border-soft)' }}
                    >
                      ⚖️ Compare
                    </button>
                  </div>
                )}

                {showMessageForm && (
                  <div className="message-form-container">
                    <h3>Send Message to Agency</h3>
                    {messageSent ? (
                      <div className="success-message">
                        ✅ Message sent successfully!
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage} className="message-form">
                        <div className="form-group">
                          <label>Subject</label>
                          <input
                            type="text"
                            name="subject"
                            value={messageData.subject}
                            onChange={handleMessageChange}
                            placeholder="e.g., Inquiry about pricing"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Message</label>
                          <textarea
                            name="message"
                            value={messageData.message}
                            onChange={handleMessageChange}
                            placeholder="Type your message here..."
                            rows="4"
                            required
                          />
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="send-message-btn">Send Message</button>
                          <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={() => setShowMessageForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer reviews */}
            <ReviewSection productId={product._id} />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>Product not found</h3>
            <p>The product you're looking for doesn't exist or has been removed</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;

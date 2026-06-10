import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import CustomerSidebar from '../components/CustomerSidebar';
import { useToast } from '../components/Toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import './Watchlist.css';

const Watchlist = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/customer'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'customer') { navigate('/login/customer'); return; }
    setUser(parsed);
    load();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/customer/wishlist');
      // Backend returns either a list of items or { items: [...] }; normalise.
      const list = Array.isArray(res.data) ? res.data : (res.data.items || res.data.wishlist || []);
      setItems(list);
    } catch (e) {
      console.error('Wishlist load', e);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    setBusy(productId);
    try {
      await api.delete(`/api/customer/wishlist/${productId}`);
      setItems((arr) => arr.filter((i) => (i.product?._id || i._id) !== productId));
      toast.info('Removed from watchlist');
    } catch (e) {
      toast.error('Failed to remove');
    } finally {
      setBusy(null);
    }
  };

  const moveToCart = async (productId) => {
    setBusy(productId);
    try {
      await api.post('/api/customer/cart', { productId, quantity: 1 });
      await api.delete(`/api/customer/wishlist/${productId}`).catch(() => null);
      setItems((arr) => arr.filter((i) => (i.product?._id || i._id) !== productId));
      toast.success('Moved to cart');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to move');
    } finally {
      setBusy(null);
    }
  };

  if (!user) return null;

  const normalize = (item) => {
    const p = item.product || item;
    return {
      _id: p._id,
      title: p.title,
      sellingPrice: p.sellingPrice,
      originalPrice: p.originalPrice,
      category: p.category,
      agencyName: p.agencyName,
      images: p.images || [],
      status: p.status,
    };
  };

  return (
    <div className="dashboard-container cust-dash">
      <CustomerSidebar />

      <main className="dashboard-main">
        <motion.section
          className="cust-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">WATCHLIST · {items.length} item{items.length !== 1 ? 's' : ''}</span>
            <h1>Your <em>watchlist.</em></h1>
            <p>Pieces you've saved. Move them to cart when you're ready.</p>
            {items.length > 0 && (
              <div className="cust-hero-actions">
                <button
                  className="cust-btn-primary"
                  onClick={async () => {
                    for (const it of items) {
                      const p = it.product || it;
                      await api.post('/api/customer/cart', { productId: p._id, quantity: 1 }).catch(() => null);
                    }
                    toast.success(`Moved ${items.length} item${items.length !== 1 ? 's' : ''} to cart`);
                    // Clear watchlist locally; actual deletion happens individually
                    for (const it of items) {
                      const p = it.product || it;
                      await api.delete(`/api/customer/wishlist/${p._id}`).catch(() => null);
                    }
                    setItems([]);
                  }}
                >
                  🛒 Move all to cart <span>→</span>
                </button>
                <button className="cust-btn-ghost" onClick={() => navigate('/browse-products')}>
                  Browse more
                </button>
              </div>
            )}
          </div>
        </motion.section>

        {loading ? (
          <div className="cust-section">
            <div className="cust-empty-mini"><span>❤️</span><p>Loading watchlist…</p></div>
          </div>
        ) : items.length === 0 ? (
          <section className="cust-section">
            <div className="cust-empty">
              <div className="cust-empty-icon">❤️</div>
              <h3>Your watchlist is empty</h3>
              <p>Browse the marketplace and tap the heart on any craft to save it.</p>
              <button className="cust-btn-primary" onClick={() => navigate('/browse-products')}>
                Browse crafts <span>→</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="cust-section">
            <div className="cust-section-head">
              <div>
                <span className="cust-section-tag">Saved</span>
                <h2>Items you're <em>watching</em></h2>
              </div>
            </div>
            <div className="cust-products-grid">
              {items.map((it, i) => {
                const p = normalize(it);
                const isBusy = busy === p._id;
                return (
                  <motion.div
                    key={p._id || i}
                    className={`cust-product-card ${isBusy ? 'is-busy' : ''}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.05 }}
                  >
                    {p.originalPrice > p.sellingPrice && (
                      <div className="cust-product-badge">
                        {Math.round(((p.originalPrice - p.sellingPrice) / p.originalPrice) * 100)}% OFF
                      </div>
                    )}
                    <div className="cust-product-img" onClick={() => navigate(`/product/${p._id}`)} style={{ cursor: 'pointer' }}>
                      {p.images && p.images[0]
                        ? <img src={getImageUrl(p.images[0])} alt={p.title} />
                        : <span className="cust-product-fallback">🎨</span>}
                    </div>
                    <div className="cust-product-meta">
                      <span className="cust-product-cat">{p.category}</span>
                      <h4 onClick={() => navigate(`/product/${p._id}`)} style={{ cursor: 'pointer' }}>{p.title}</h4>
                      <div className="cust-product-price">
                        <span className="now">₹{Number(p.sellingPrice).toLocaleString()}</span>
                        {p.originalPrice > p.sellingPrice && (
                          <span className="was">₹{Number(p.originalPrice).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="wl-actions">
                        <button
                          className="wl-btn-primary"
                          disabled={isBusy}
                          onClick={() => moveToCart(p._id)}
                        >
                          🛒 Move to cart
                        </button>
                        <button
                          className="wl-btn-ghost"
                          disabled={isBusy}
                          onClick={() => removeFromWishlist(p._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Watchlist;

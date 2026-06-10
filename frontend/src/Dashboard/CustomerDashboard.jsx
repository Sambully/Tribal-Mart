import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import CustomerSidebar from '../components/CustomerSidebar';
import NotificationBell from '../components/NotificationBell';
import './Dashboard.css';
import './CustomerDashboard.css';

const CATEGORIES = [
  { id: 'all',        label: 'All Crafts',  icon: '✨', tint: 'linear-gradient(135deg,#c0552c,#8e3b1a)' },
  { id: 'Furniture',  label: 'Wood & Cane', icon: '🪵', tint: 'linear-gradient(135deg,#a17440,#6e4a2c)' },
  { id: 'Clothing',   label: 'Textiles',    icon: '🧵', tint: 'linear-gradient(135deg,#d99441,#b07020)' },
  { id: 'Others',     label: 'Pottery',     icon: '🏺', tint: 'linear-gradient(135deg,#deb785,#a17440)' },
  { id: 'Toys',       label: 'Jewelry',     icon: '📿', tint: 'linear-gradient(135deg,#e9c478,#a4783b)' },
  { id: 'Electronics',label: 'Metalcraft',  icon: '🔔', tint: 'linear-gradient(135deg,#c89a6e,#6e4a2c)' },
  { id: 'Appliances', label: 'Home Goods',  icon: '🪔', tint: 'linear-gradient(135deg,#efe6d4,#d8ccba)' },
];

const STATUS_BUCKETS = {
  active: ['placed', 'confirmed', 'processing', 'shipped', 'pending'],
  done:   ['delivered', 'completed'],
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/customer'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'customer') { navigate('/login/customer'); return; }
    setUser(parsed);
    loadEverything();
  }, [navigate]);

  const loadEverything = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes, wishRes] = await Promise.all([
        api.get('/api/products/all').catch(() => ({ data: [] })),
        api.get('/api/orders/my-orders').catch(() => ({ data: [] })),
        api.get('/api/customer/wishlist').catch(() => ({ data: [] })),
      ]);
      setProducts(prodRes.data || []);
      setOrders(Array.isArray(ordRes.data) ? ordRes.data : (ordRes.data.orders || []));
      setWishlist(Array.isArray(wishRes.data) ? wishRes.data : (wishRes.data.items || []));
    } catch (e) {
      console.error('Customer dashboard load error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // ── Derived stats ───────────────────────────────────────
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => STATUS_BUCKETS.active.includes((o.status || '').toLowerCase())).length;
    const completedOrders = orders.filter(o => STATUS_BUCKETS.done.includes((o.status || '').toLowerCase())).length;
    const totalSavings = orders.reduce((acc, o) => {
      const items = o.items || [];
      const saved = items.reduce((s, it) => s + ((it.originalPrice || 0) - (it.sellingPrice || it.price || 0)) * (it.quantity || 1), 0);
      return acc + saved;
    }, 0);
    return {
      activeOrders,
      completedOrders,
      watchlist: wishlist.length,
      savings: totalSavings,
    };
  }, [orders, wishlist]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    const list = activeCategory === 'all'
      ? products
      : products.filter(p => p.category === activeCategory);
    return list.slice(0, 6);
  }, [products, activeCategory]);

  const trending = useMemo(() => products.slice(0, 4), [products]);
  const recentOrders = orders.slice(0, 3);

  if (!user) return null;

  return (
    <div className="dashboard-container cust-dash">
      <CustomerSidebar />

      {/* ── Main ── */}
      <main className="dashboard-main">
        {/* Hero greeting */}
        <motion.section
          className="cust-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">{greeting()} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            <h1>
              {greeting()}, <em>{(user.name || 'friend').split(' ')[0]}</em>.
            </h1>
            <p>Browse tribal-made crafts straight from the community — every piece supports the artisan.</p>
            <div className="cust-hero-actions">
              <button className="cust-btn-primary" onClick={() => navigate('/browse-products')}>
                Browse Crafts <span>→</span>
              </button>
              <button className="cust-btn-ghost" onClick={() => navigate('/orders')}>
                My Orders
              </button>
            </div>
          </div>
          <div className="cust-hero-profile">
            <NotificationBell className="cust-bell-wrap" />
            <div className="cust-profile">
              <div className="cust-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="cust-profile-name">{user.name}</div>
                <div className="cust-profile-role">Customer · Member</div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <div className="cust-stats-grid">
          <StatCard idx={0} icon="📦" label="Active Orders"     value={stats.activeOrders} accent="terracotta" />
          <StatCard idx={1} icon="❤️" label="Watchlist"          value={stats.watchlist}    accent="ochre" />
          <StatCard idx={2} icon="💰" label="Total Savings"      value={`₹${stats.savings.toLocaleString()}`} accent="forest" />
          <StatCard idx={3} icon="✅" label="Completed Orders"   value={stats.completedOrders} accent="indigo" />
        </div>

        {/* Category strip */}
        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">Shop by craft</span>
              <h2>Explore <em>categories</em></h2>
            </div>
            <button className="view-all-btn" onClick={() => navigate('/browse-products')}>See all crafts →</button>
          </div>
          <div className="cust-category-strip">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`cust-cat-card ${activeCategory === c.id ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(c.id)}
                style={{ '--cat-tint': c.tint }}
              >
                <span className="cust-cat-icon">{c.icon}</span>
                <span className="cust-cat-label">{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured / category-filtered products */}
        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">{activeCategory === 'all' ? 'Featured' : 'Selected'}</span>
              <h2>
                {activeCategory === 'all' ? <>Handpicked <em>this week</em></> : <>{CATEGORIES.find(c=>c.id===activeCategory)?.label || activeCategory}</>}
              </h2>
            </div>
            <button className="view-all-btn" onClick={() => navigate('/browse-products')}>View all →</button>
          </div>

          {loading ? (
            <div className="cust-skeleton-grid">
              {[1,2,3].map(i => <div key={i} className="cust-skeleton-card" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No products in this category yet"
              sub="Try a different category, or browse all crafts."
              cta="Browse all crafts"
              onCta={() => navigate('/browse-products')}
            />
          ) : (
            <div className="cust-products-grid">
              {filteredProducts.map((p, i) => (
                <motion.div
                  key={p._id}
                  className="cust-product-card"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  whileHover={{ y: -6 }}
                  onClick={() => navigate(`/product/${p._id}`)}
                >
                  {p.originalPrice > p.sellingPrice && (
                    <div className="cust-product-badge">
                      {Math.round(((p.originalPrice - p.sellingPrice) / p.originalPrice) * 100)}% OFF
                    </div>
                  )}
                  <div className="cust-product-img">
                    {p.images && p.images[0]
                      ? <img src={getImageUrl(p.images[0])} alt={p.title} />
                      : <span className="cust-product-fallback">🎨</span>}
                  </div>
                  <div className="cust-product-meta">
                    <span className="cust-product-cat">{p.category}</span>
                    <h4>{p.title}</h4>
                    <div className="cust-product-price">
                      <span className="now">₹{Number(p.sellingPrice).toLocaleString()}</span>
                      {p.originalPrice > p.sellingPrice && (
                        <span className="was">₹{Number(p.originalPrice).toLocaleString()}</span>
                      )}
                    </div>
                    <div className="cust-product-foot">
                      <span className="cust-product-cond">{p.condition || 'Good'}</span>
                      <button
                        className="cust-product-cta"
                        onClick={(e) => { e.stopPropagation(); navigate(`/product/${p._id}`); }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Recent orders + trending side-by-side */}
        <div className="cust-twocol">
          <section className="cust-panel">
            <div className="cust-panel-head">
              <div>
                <span className="cust-section-tag">Your activity</span>
                <h2>Recent orders</h2>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/orders')}>View all →</button>
            </div>
            {recentOrders.length === 0 ? (
              <div className="cust-empty-mini">
                <span>🛍️</span>
                <p>No orders yet — your first craft is one click away.</p>
                <button className="cust-btn-primary" onClick={() => navigate('/browse-products')}>Start shopping</button>
              </div>
            ) : (
              <ul className="cust-order-list">
                {recentOrders.map((o, i) => (
                  <li key={o._id || i} className="cust-order-row">
                    <div className="cust-order-num">#{(o._id || '').slice(-6).toUpperCase() || `ORD-${i+1}`}</div>
                    <div className="cust-order-meta">
                      <div className="cust-order-title">{o.items?.[0]?.productTitle || o.items?.[0]?.title || 'Order'}</div>
                      <div className="cust-order-sub">{(o.items?.length || 1)} item{(o.items?.length || 1) > 1 ? 's' : ''} · {new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className={`cust-order-status ${(o.status || 'placed').toLowerCase()}`}>{o.status || 'Placed'}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cust-panel cust-trending">
            <div className="cust-panel-head">
              <div>
                <span className="cust-section-tag">Trending</span>
                <h2>Picked for <em>you</em></h2>
              </div>
            </div>
            {trending.length === 0 ? (
              <div className="cust-empty-mini">
                <span>✨</span>
                <p>Personalised picks will appear as you explore.</p>
              </div>
            ) : (
              <ul className="cust-trending-list">
                {trending.map((p) => (
                  <li
                    key={p._id}
                    className="cust-trending-row"
                    onClick={() => navigate(`/product/${p._id}`)}
                  >
                    <div className="cust-trending-thumb">
                      {p.images && p.images[0]
                        ? <img src={getImageUrl(p.images[0])} alt={p.title} />
                        : <span>🎨</span>}
                    </div>
                    <div className="cust-trending-meta">
                      <div className="cust-trending-title">{p.title}</div>
                      <div className="cust-trending-sub">{p.agencyName}</div>
                    </div>
                    <div className="cust-trending-price">₹{Number(p.sellingPrice).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Recently viewed strip */}
        {(() => {
          let recent = [];
          try { recent = JSON.parse(localStorage.getItem('tm_recent') || '[]'); } catch (_) {}
          if (recent.length === 0) return null;
          return (
            <section className="cust-section">
              <div className="cust-section-head">
                <div>
                  <span className="cust-section-tag">Last seen</span>
                  <h2>Recently <em>viewed</em></h2>
                </div>
                <button className="view-all-btn" onClick={() => { localStorage.removeItem('tm_recent'); window.location.reload(); }}>Clear →</button>
              </div>
              <div className="cust-products-grid">
                {recent.slice(0, 6).map((p) => (
                  <motion.div
                    key={p._id}
                    className="cust-product-card"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    whileHover={{ y: -6 }}
                    onClick={() => navigate(`/product/${p._id}`)}
                  >
                    <div className="cust-product-img">
                      {p.images && p.images[0]
                        ? <img src={getImageUrl(p.images[0])} alt={p.title} />
                        : <span className="cust-product-fallback">🎨</span>}
                    </div>
                    <div className="cust-product-meta">
                      <span className="cust-product-cat">{p.category}</span>
                      <h4>{p.title}</h4>
                      <div className="cust-product-price">
                        <span className="now">₹{Number(p.sellingPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Maker spotlight banner */}
        <motion.section
          className="cust-spotlight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px 0px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="cust-spotlight-pattern" aria-hidden />
          <div className="cust-spotlight-copy">
            <span className="cust-spotlight-tag">MAKER SPOTLIGHT</span>
            <h2>Meet the <em>artisans</em> behind every piece</h2>
            <p>Pithora painters in Jhabua. Dhokra brass casters in Khunti. Toda embroiderers in Nilgiris. Read their stories.</p>
            <button className="cust-btn-primary" onClick={() => navigate('/about')}>
              See the makers <span>→</span>
            </button>
          </div>
          <div className="cust-spotlight-art" aria-hidden>
            <span className="cust-spot-shape s1" />
            <span className="cust-spot-shape s2" />
            <span className="cust-spot-shape s3" />
          </div>
        </motion.section>
      </main>
    </div>
  );
};

/* ─── Greeting helper ─── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ─── Stat card ─── */
const StatCard = ({ icon, label, value, accent = 'terracotta', idx = 0 }) => (
  <motion.div
    className={`cust-stat ${accent}`}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 + idx * 0.07 }}
    whileHover={{ y: -3 }}
  >
    <div className="cust-stat-icon">{icon}</div>
    <div className="cust-stat-body">
      <div className="cust-stat-value">{value}</div>
      <div className="cust-stat-label">{label}</div>
    </div>
  </motion.div>
);

/* ─── Empty state ─── */
const EmptyState = ({ icon, title, sub, cta, onCta }) => (
  <div className="cust-empty">
    <div className="cust-empty-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{sub}</p>
    {cta && <button className="cust-btn-primary" onClick={onCta}>{cta}</button>}
  </div>
);

export default CustomerDashboard;

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import './Store.css';

const Store = () => {
  const { agencyId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/products/store/${agencyId}`);
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Could not load storefront');
      } finally {
        setLoading(false);
      }
    })();
  }, [agencyId]);

  const products = data?.products || [];
  const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);
  const categories = data?.stats?.categories || [];

  if (loading) {
    return (
      <div className="store-shell">
        <div className="store-loading">Loading storefront…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="store-shell">
        <div className="store-empty">
          <div className="store-empty-icon">🏚️</div>
          <h2>Storefront unavailable</h2>
          <p>{error || 'This agency may not have a public store yet.'}</p>
          <button className="cust-btn-primary" onClick={() => navigate('/')}>Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="store-shell">
      {/* Top nav (back link) */}
      <header className="store-topnav">
        <button className="store-back" onClick={() => navigate(-1)}>← Back</button>
        <button className="store-back" onClick={() => navigate('/')}>Tribal Mart</button>
      </header>

      {/* Storefront hero */}
      <motion.section
        className="store-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="store-hero-pattern" aria-hidden />
        <div className="store-hero-inner">
          <div className="store-monogram">{data.agency.name.charAt(0).toUpperCase()}</div>
          <div className="store-hero-copy">
            <span className="store-tag">{data.agency.verified ? '✓ VERIFIED TRIBAL COOPERATIVE' : 'TRIBAL COOPERATIVE'}</span>
            <h1>
              {data.agency.name.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{data.agency.name.split(' ').slice(-1).join(' ')}.</em>
            </h1>
            <p>
              {data.stats.total} authentic craft{data.stats.total !== 1 ? 's' : ''} ·{' '}
              {data.agency.address || 'Tribal community partner'} · Member since{' '}
              {new Date(data.agency.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
            <div className="store-hero-actions">
              <button className="cust-btn-primary" onClick={() => navigate('/browse-products')}>
                Browse all crafts <span>→</span>
              </button>
              <button className="cust-btn-ghost" onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}>
                See products
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Category strip */}
      <section className="store-cat-strip">
        <button
          className={`store-cat-pill ${cat === 'all' ? 'is-active' : ''}`}
          onClick={() => setCat('all')}
        >
          All ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`store-cat-pill ${cat === c ? 'is-active' : ''}`}
            onClick={() => setCat(c)}
          >
            {c} ({products.filter(p => p.category === c).length})
          </button>
        ))}
      </section>

      {/* Product grid */}
      <section className="store-grid-wrap">
        {filtered.length === 0 ? (
          <div className="store-empty">
            <div className="store-empty-icon">📦</div>
            <h3>Nothing here yet</h3>
            <p>No products in this category right now.</p>
          </div>
        ) : (
          <div className="store-grid">
            {filtered.map((p, i) => (
              <motion.div
                key={p._id}
                className="store-card"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                whileHover={{ y: -6 }}
                onClick={() => navigate(`/product/${p._id}`)}
              >
                {p.originalPrice > p.sellingPrice && (
                  <div className="store-badge">
                    {Math.round(((p.originalPrice - p.sellingPrice) / p.originalPrice) * 100)}% OFF
                  </div>
                )}
                <div className="store-card-img">
                  {p.images && p.images[0] ? (
                    <img src={getImageUrl(p.images[0])} alt={p.title} />
                  ) : (
                    <span>🎨</span>
                  )}
                </div>
                <div className="store-card-meta">
                  <span className="store-card-cat">{p.category}</span>
                  <h4>{p.title}</h4>
                  <div className="store-card-price">
                    <span className="now">₹{Number(p.sellingPrice).toLocaleString()}</span>
                    {p.originalPrice > p.sellingPrice && (
                      <span className="was">₹{Number(p.originalPrice).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA banner */}
      <section className="store-cta">
        <h2>Want more <em>tribal craft</em>?</h2>
        <p>Discover dozens of cooperatives bringing authentic, handmade pieces to Tribal Mart.</p>
        <button className="cust-btn-primary" onClick={() => navigate('/browse-products')}>
          Browse the marketplace <span>→</span>
        </button>
      </section>
    </div>
  );
};

export default Store;

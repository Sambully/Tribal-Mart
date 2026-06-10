import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import CustomerSidebar from '../components/CustomerSidebar';
import { useToast } from '../components/Toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import './Compare.css';

/** Compare reads product IDs from
 *   1) ?ids=A,B,C  query string (sharable)
 *   2) localStorage 'tm_compare' fallback
 *  Up to 4 products at a time.
 */

const STORAGE_KEY = 'tm_compare';

export const compareUtils = {
  load: () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } },
  save: (ids) => localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 4))),
  add: (id) => { const list = compareUtils.load(); if (!list.includes(id)) compareUtils.save([...list, id]); },
  remove: (id) => { compareUtils.save(compareUtils.load().filter(x => x !== id)); },
  has: (id) => compareUtils.load().includes(id),
  clear: () => localStorage.removeItem(STORAGE_KEY),
};

const Compare = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const ids = useMemo(() => {
    const fromUrl = (params.get('ids') || '').split(',').filter(Boolean);
    return (fromUrl.length ? fromUrl : compareUtils.load()).slice(0, 4);
  }, [params]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const fetched = [];
      for (const id of ids) {
        try {
          const res = await api.get(`/api/products/${id}`);
          fetched.push(res.data);
        } catch (_) {}
      }
      setProducts(fetched);
      setLoading(false);
    })();
  }, [ids.join(',')]);  // eslint-disable-line

  const removeOne = (id) => {
    compareUtils.remove(id);
    const next = ids.filter(x => x !== id);
    setParams(next.length ? { ids: next.join(',') } : {});
  };

  const clearAll = () => {
    compareUtils.clear();
    setParams({});
    toast.info('Compare list cleared');
  };

  // Rows: a list of {label, render(p)} comparing across products
  const ROWS = [
    { label: 'Image',       render: (p) => p.images?.[0] ? <img src={getImageUrl(p.images[0])} alt={p.title} className="cmp-img" /> : <div className="cmp-img cmp-img-placeholder">🎨</div> },
    { label: 'Title',       render: (p) => <strong className="cmp-title">{p.title}</strong> },
    { label: 'Category',    render: (p) => <span className="cmp-cat">{p.category}</span> },
    { label: 'Price',       render: (p) => <span className="cmp-price">₹{Number(p.sellingPrice).toLocaleString()}</span> },
    { label: 'Original',    render: (p) => <span className="cmp-original">₹{Number(p.originalPrice).toLocaleString()}</span> },
    { label: 'Discount',    render: (p) => p.originalPrice > p.sellingPrice ? (
      <span className="cmp-discount">{Math.round(((p.originalPrice - p.sellingPrice) / p.originalPrice) * 100)}% OFF</span>
    ) : '—' },
    { label: 'Condition',   render: (p) => p.condition || '—' },
    { label: 'Stock',       render: (p) => p.quantity > 0 ? `${p.quantity} available` : 'Out of stock' },
    { label: 'Agency',      render: (p) => p.agencyName },
    { label: 'Description', render: (p) => <span className="cmp-desc">{p.description}</span> },
  ];

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
            <span className="cust-hero-tag">COMPARE · UP TO 4 ITEMS</span>
            <h1>Compare <em>crafts.</em></h1>
            <p>Pit products side-by-side — price, condition, stock, and description, all in one table.</p>
            <div className="cust-hero-actions">
              <button className="cust-btn-primary" onClick={() => navigate('/browse-products')}>+ Add from browse <span>→</span></button>
              {products.length > 0 && (
                <button className="cust-btn-ghost" onClick={clearAll}>Clear all</button>
              )}
            </div>
          </div>
        </motion.section>

        <section className="cust-section">
          {loading ? (
            <div className="cust-empty-mini"><span>⚖️</span><p>Loading products…</p></div>
          ) : products.length === 0 ? (
            <div className="cust-empty">
              <div className="cust-empty-icon">⚖️</div>
              <h3>Nothing to compare yet</h3>
              <p>From any product card, tap the ⚖ Compare icon to add it here.</p>
              <button className="cust-btn-primary" onClick={() => navigate('/browse-products')}>Browse crafts <span>→</span></button>
            </div>
          ) : (
            <div className="cmp-grid-wrap">
              <table className="cmp-table">
                <thead>
                  <tr>
                    <th />
                    {products.map((p) => (
                      <th key={p._id}>
                        <button className="cmp-remove" onClick={() => removeOne(p._id)} aria-label="Remove">×</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, ri) => (
                    <tr key={ri}>
                      <td className="cmp-label">{row.label}</td>
                      {products.map((p) => (
                        <td key={p._id} className="cmp-cell">{row.render(p)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td />
                    {products.map((p) => (
                      <td key={p._id} className="cmp-cell">
                        <button
                          className="cust-btn-primary"
                          onClick={() => navigate(`/product/${p._id}`)}
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          View →
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Compare;

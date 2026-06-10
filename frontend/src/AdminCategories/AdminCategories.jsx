import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { useToast } from '../components/Toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';

const AdminCategories = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login/admin'); return; }
    if (JSON.parse(userData).role !== 'admin') { navigate('/login/admin'); return; }
    load();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/categories');
      setCats(res.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const addCat = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      const res = await api.post('/api/admin/categories', { name: newCat.trim() });
      setCats(res.data);
      setNewCat('');
      toast.success('Category added');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add'); }
  };

  const removeCat = async (name) => {
    if (!window.confirm(`Remove "${name}"? Existing products under this category will keep their tag.`)) return;
    try {
      const res = await api.delete(`/api/admin/categories/${encodeURIComponent(name)}`);
      setCats(res.data);
      toast.info('Category removed');
    } catch (_) { toast.error('Failed'); }
  };

  return (
    <div className="dashboard-container cust-dash role-admin">
      <AdminSidebar />

      <main className="dashboard-main">
        <motion.section
          className="cust-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">CATEGORY MANAGEMENT</span>
            <h1>Manage <em>categories.</em></h1>
            <p>Categories shown to agencies when listing products and to customers when browsing.</p>
          </div>
        </motion.section>

        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">Add new</span>
              <h2>Add a <em>category</em></h2>
            </div>
          </div>
          <form onSubmit={addCat} style={{ display: 'flex', gap: '0.75rem', maxWidth: 500 }}>
            <input
              type="text"
              placeholder="e.g. Pottery, Textiles, Jewelry…"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              style={{ flex: 1, padding: '0.75rem 0.95rem', border: '1.5px solid var(--border-soft)', background: 'var(--bg-white)', borderRadius: 11, fontSize: '0.92rem', outline: 'none', fontFamily: 'var(--font-body)' }}
            />
            <button type="submit" className="cust-btn-primary">+ Add</button>
          </form>
        </section>

        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">All categories</span>
              <h2>{loading ? 'Loading…' : `${cats.length} categories`}</h2>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {cats.map((c) => (
              <div key={c} style={{ background: 'var(--bg-soft)', border: '1.5px solid var(--border-soft)', borderRadius: 50, padding: '0.5rem 0.55rem 0.5rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--fg)' }}>{c}</span>
                <button
                  onClick={() => removeCat(c)}
                  title="Remove"
                  style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-white)', border: '1px solid var(--border-soft)', color: 'var(--fg-mid)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700 }}
                >×</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminCategories;

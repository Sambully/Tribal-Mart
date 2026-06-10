import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import AgentSidebar from '../components/AgentSidebar';
import { useToast } from '../components/Toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';

const AgencyDrilldown = () => {
  const { agencyId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login/agent'); return; }
    if (JSON.parse(userData).role !== 'agent') { navigate('/login/agent'); return; }
    (async () => {
      try {
        const res = await api.get(`/api/agents/managed-agencies/${agencyId}`);
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Could not load agency');
      } finally { setLoading(false); }
    })();
  }, [agencyId, navigate]);

  const stepDown = async () => {
    if (!window.confirm('Are you sure you want to step down from managing this agency? You will no longer be able to list products for them.')) return;
    try {
      await api.delete(`/api/agents/managed-agencies/${agencyId}`);
      toast.success('You stepped down from this agency');
      navigate('/dashboard/agent');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to step down'); }
  };

  if (loading) return (
    <div className="dashboard-container cust-dash"><AgentSidebar /><main className="dashboard-main"><div className="cust-empty-mini"><span>🏢</span><p>Loading agency…</p></div></main></div>
  );
  if (error) return (
    <div className="dashboard-container cust-dash"><AgentSidebar /><main className="dashboard-main"><div className="cust-empty"><div className="cust-empty-icon">⚠️</div><h3>{error}</h3><button className="cust-btn-primary" onClick={() => navigate('/dashboard/agent')}>Back to dashboard</button></div></main></div>
  );

  const { agency, products, myProducts, orders, stats } = data;

  return (
    <div className="dashboard-container cust-dash role-agent">
      <AgentSidebar />

      <main className="dashboard-main">
        <motion.section
          className="cust-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">MANAGED AGENCY</span>
            <h1>
              {agency.name.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{agency.name.split(' ').slice(-1).join(' ')}.</em>
            </h1>
            <p>{agency.address || agency.email} · Member since {new Date(agency.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            <div className="cust-hero-actions">
              <button className="cust-btn-primary" onClick={() => navigate(`/add-product?agencyId=${agency._id}`)}>
                + List a product for them <span>→</span>
              </button>
              <button className="cust-btn-ghost" onClick={stepDown} style={{ color: 'white' }}>
                Step down
              </button>
            </div>
          </div>
        </motion.section>

        <div className="cust-stats-grid">
          <div className="cust-stat terracotta"><div className="cust-stat-icon">📦</div><div className="cust-stat-body"><div className="cust-stat-value">{stats.total}</div><div className="cust-stat-label">Total Products</div></div></div>
          <div className="cust-stat ochre"><div className="cust-stat-icon">✅</div><div className="cust-stat-body"><div className="cust-stat-value">{stats.approved}</div><div className="cust-stat-label">Live</div></div></div>
          <div className="cust-stat forest"><div className="cust-stat-icon">💰</div><div className="cust-stat-body"><div className="cust-stat-value">{stats.sold}</div><div className="cust-stat-label">Sold</div></div></div>
          <div className="cust-stat indigo"><div className="cust-stat-icon">📑</div><div className="cust-stat-body"><div className="cust-stat-value">{stats.myUploads}</div><div className="cust-stat-label">Listed by you</div></div></div>
        </div>

        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">Recent products</span>
              <h2>Their <em>catalogue</em></h2>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="cust-empty-mini"><span>📦</span><p>No products listed yet — be the first to add one.</p></div>
          ) : (
            <ul className="ag-list">
              {products.map((p) => (
                <li key={p._id} className="ag-list-row">
                  <div className="ag-list-thumb">{p.images && p.images[0] ? <img src={getImageUrl(p.images[0])} alt={p.title} /> : <span>🎨</span>}</div>
                  <div className="ag-list-meta">
                    <h4>{p.title}</h4>
                    <p>{p.category} {String(p.uploadedByAgent) === String(JSON.parse(localStorage.getItem('user')||'{}')._id || '') ? '· Listed by you' : ''}</p>
                  </div>
                  <div className={`ag-list-status ${p.status.replace(/_/g,'-')}`}>{p.status.replace(/_/g,' ')}</div>
                  <div className="ag-list-price">₹{Number(p.sellingPrice).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">Recent orders</span>
              <h2>Their <em>orders</em></h2>
            </div>
          </div>
          {orders.length === 0 ? (
            <div className="cust-empty-mini"><span>📋</span><p>No orders yet.</p></div>
          ) : (
            <ul className="ag-list">
              {orders.slice(0, 8).map((o) => (
                <li key={o._id} className="ag-list-row" style={{ gridTemplateColumns: '56px 1fr auto auto' }}>
                  <div className="ag-list-thumb"><span>🛒</span></div>
                  <div className="ag-list-meta">
                    <h4>#{o.orderNumber || o._id.slice(-6).toUpperCase()}</h4>
                    <p>{o.customerName} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className={`ag-list-status ${(o.orderStatus || 'pending')}`}>{o.orderStatus || 'pending'}</div>
                  <div className="ag-list-price">₹{Number(o.totalAmount || 0).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default AgencyDrilldown;

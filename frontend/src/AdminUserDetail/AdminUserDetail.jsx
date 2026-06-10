import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { useToast } from '../components/Toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';

const ROLE_COLOR = {
  admin:    { bg: 'rgba(46,58,89,0.14)',  color: 'var(--indigo)' },
  agency:   { bg: 'rgba(217,148,65,0.14)', color: 'var(--ochre-dark)' },
  agent:    { bg: 'rgba(192,85,44,0.14)',  color: 'var(--accent-dark)' },
  customer: { bg: 'rgba(74,106,58,0.14)',  color: 'var(--forest)' },
};

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/admin/users/${id}`);
        setData(res.data);
      } catch (e) { toast.error('User not found'); navigate('/admin/users'); }
      finally { setLoading(false); }
    })();
  }, [id]);  // eslint-disable-line

  const toggleStatus = async () => {
    setBusy(true);
    try {
      const next = data.user.status === 'suspended' ? 'active' : 'suspended';
      await api.put(`/api/admin/users/${id}/status`, { status: next });
      toast.success(next === 'active' ? 'User reactivated' : 'User suspended');
      setData((d) => ({ ...d, user: { ...d.user, status: next } }));
    } catch (e) { toast.error('Failed'); }
    finally { setBusy(false); }
  };

  if (loading || !data) return (
    <div className="dashboard-container cust-dash role-admin">
      <AdminSidebar />
      <main className="dashboard-main"><div className="cust-empty-mini"><span>👤</span><p>Loading user…</p></div></main>
    </div>
  );

  const u = data.user;
  const roleStyle = ROLE_COLOR[u.role] || ROLE_COLOR.customer;
  const suspended = u.status === 'suspended';

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
            <span className="cust-hero-tag">USER DETAIL</span>
            <h1>
              {(u.name || 'User').split(' ').slice(0, -1).join(' ') || u.name}{' '}
              <em>{(u.name || 'User').split(' ').slice(-1).join(' ')}.</em>
            </h1>
            <p>{u.email} · {u.role} · Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <div className="cust-hero-actions">
              <button
                className="cust-btn-primary"
                onClick={toggleStatus}
                disabled={busy}
                style={{ background: suspended ? 'rgba(74,106,58,0.95)' : 'rgba(168,59,31,0.95)' }}
              >
                {suspended ? '✓ Re-activate user' : '✕ Suspend user'}
              </button>
              <button className="cust-btn-ghost" onClick={() => navigate('/admin/users')}>← Back to users</button>
            </div>
          </div>
          <div className="cust-hero-profile">
            <div className="cust-profile">
              <div className="cust-avatar">
                {u.avatarUrl ? <img src={getImageUrl(u.avatarUrl)} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (u.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="cust-profile-name">{u.name}</div>
                <div className="cust-profile-role">
                  <span style={{ background: roleStyle.bg, color: roleStyle.color, padding: '0.18rem 0.55rem', borderRadius: 50, fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                    {u.role.toUpperCase()}
                  </span>
                  {' · '}
                  <span style={{ color: suspended ? 'var(--danger)' : 'var(--forest)', fontWeight: 700 }}>
                    {suspended ? 'SUSPENDED' : 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="cust-stats-grid">
          <div className="cust-stat terracotta"><div className="cust-stat-icon">📦</div><div className="cust-stat-body"><div className="cust-stat-value">{data.stats.productsCount}</div><div className="cust-stat-label">{u.role === 'agent' ? 'Products listed' : 'Products'}</div></div></div>
          <div className="cust-stat ochre"><div className="cust-stat-icon">🛒</div><div className="cust-stat-body"><div className="cust-stat-value">{data.stats.ordersCount}</div><div className="cust-stat-label">Orders</div></div></div>
          <div className="cust-stat forest"><div className="cust-stat-icon">📍</div><div className="cust-stat-body"><div className="cust-stat-value" style={{ fontSize: '0.95rem' }}>{u.address || '—'}</div><div className="cust-stat-label">Address</div></div></div>
          <div className="cust-stat indigo"><div className="cust-stat-icon">🪔</div><div className="cust-stat-body"><div className="cust-stat-value" style={{ fontSize: '1rem' }}>{u.role}</div><div className="cust-stat-label">Role</div></div></div>
        </div>

        {/* Agent relations */}
        {data.agentRelations?.manages && (
          <section className="cust-section">
            <div className="cust-section-head">
              <div><span className="cust-section-tag">Agent · Manages</span><h2>Agencies <em>under their care</em></h2></div>
            </div>
            {data.agentRelations.manages.length === 0 ? (
              <div className="cust-empty-mini"><span>🏢</span><p>Not managing any agencies yet.</p></div>
            ) : (
              <ul className="ag-list">
                {data.agentRelations.manages.map(a => (
                  <li key={a._id} className="ag-list-row" style={{ gridTemplateColumns: '56px 1fr auto', cursor: 'pointer' }} onClick={() => navigate(`/admin/users/${a._id}`)}>
                    <div className="ag-list-thumb"><span>🏢</span></div>
                    <div className="ag-list-meta"><h4>{a.name}</h4><p>{a.email}</p></div>
                    <span className="ag-list-status approved">agency</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {data.agentRelations?.managedBy && (
          <section className="cust-section">
            <div className="cust-section-head">
              <div><span className="cust-section-tag">Managed by</span><h2>Their <em>agent</em></h2></div>
            </div>
            <ul className="ag-list">
              <li className="ag-list-row" style={{ gridTemplateColumns: '56px 1fr auto', cursor: 'pointer' }}>
                <div className="ag-list-thumb"><span>🤝</span></div>
                <div className="ag-list-meta"><h4>{data.agentRelations.managedBy.name}</h4><p>{data.agentRelations.managedBy.email}</p></div>
                <span className="ag-list-status approved">agent</span>
              </li>
            </ul>
          </section>
        )}

        {/* Products */}
        {data.products?.length > 0 && (
          <section className="cust-section">
            <div className="cust-section-head">
              <div><span className="cust-section-tag">Recent products</span><h2>Their <em>listings</em></h2></div>
            </div>
            <ul className="ag-list">
              {data.products.slice(0, 8).map(p => (
                <li key={p._id} className="ag-list-row">
                  <div className="ag-list-thumb">{p.images && p.images[0] ? <img src={getImageUrl(p.images[0])} alt={p.title} /> : <span>🎨</span>}</div>
                  <div className="ag-list-meta"><h4>{p.title}</h4><p>{p.category}</p></div>
                  <div className={`ag-list-status ${p.status.replace(/_/g,'-')}`}>{p.status.replace(/_/g,' ')}</div>
                  <div className="ag-list-price">₹{Number(p.sellingPrice).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Orders */}
        {data.orders?.length > 0 && (
          <section className="cust-section">
            <div className="cust-section-head">
              <div><span className="cust-section-tag">Recent orders</span><h2>{u.role === 'customer' ? 'Their' : 'Their cooperative\'s'} <em>orders</em></h2></div>
            </div>
            <ul className="ag-list">
              {data.orders.slice(0, 8).map(o => (
                <li key={o._id} className="ag-list-row" style={{ gridTemplateColumns: '56px 1fr auto auto' }}>
                  <div className="ag-list-thumb"><span>🛒</span></div>
                  <div className="ag-list-meta">
                    <h4>#{o.orderNumber || o._id.slice(-6).toUpperCase()}</h4>
                    <p>{u.role === 'customer' ? o.agencyName : o.customerName} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className={`ag-list-status ${(o.orderStatus || 'pending').replace(/_/g,'-')}`}>{o.orderStatus || 'pending'}</div>
                  <div className="ag-list-price">₹{Number(o.totalAmount || 0).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminUserDetail;

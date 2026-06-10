import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import './Dashboard.css';
import './CustomerDashboard.css';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [pending, setPending] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/admin'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'admin') { navigate('/login/admin'); return; }
    setUser(parsed);
    fetchAll();
  }, [navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, pendRes, prodRes, usersRes] = await Promise.all([
        api.get('/api/admin/dashboard-stats').catch(() => ({ data: {} })),
        api.get('/api/admin/pending-products').catch(() => ({ data: { products: [] } })),
        api.get('/api/admin/all-products').catch(() => ({ data: { products: [] } })),
        api.get('/api/admin/users').catch(() => ({ data: [] })),
      ]);
      // Pending/all-products endpoints return { products: [...], pagination: {...} }
      // but tolerate a raw array too in case backend changes.
      const pendList = Array.isArray(pendRes.data) ? pendRes.data : (pendRes.data?.products || []);
      const prodList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || []);
      const userList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.users || []);

      setStats(statsRes.data || {});
      setPending(pendList);
      setAllProducts(prodList);
      setUsers(userList);
    } catch (e) {
      console.error('Admin dashboard load', e);
    } finally {
      setLoading(false);
    }
  };

  const derived = useMemo(() => {
    // dashboard-stats returns { overview: { totalProducts, pendingProducts, ... }, users: { totalUsers, ... } }
    const o = stats.overview || {};
    const u = stats.users || {};
    const totalProducts = o.totalProducts ?? allProducts.length;
    const pendingCount  = o.pendingProducts ?? pending.length;
    const approved      = o.approvedProducts ?? allProducts.filter(p => p.status === 'approved').length;
    const totalUsers    = u.totalUsers ?? users.length;
    return { totalProducts, pendingCount, approved, totalUsers };
  }, [stats, allProducts, pending, users]);

  if (!user) return null;

  return (
    <div className="dashboard-container cust-dash role-admin">
      <AdminSidebar />

      <main className="dashboard-main">
        <motion.section
          className="cust-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">
              {greeting()} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <h1>
              {greeting()}, <em>{(user.name || 'admin').split(' ')[0]}</em>.
            </h1>
            <p>Keep the marketplace honest — approve listings, verify agencies, monitor activity.</p>
            <div className="cust-hero-actions">
              <button className="cust-btn-primary" onClick={() => navigate('/admin/pending-products')}>
                Review queue <span>→</span>
              </button>
              <button className="cust-btn-ghost" onClick={() => navigate('/admin/analytics')}>Platform analytics</button>
            </div>
          </div>
          <div className="cust-hero-profile">
            <NotificationBell />
            <div className="cust-profile">
              <div className="cust-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="cust-profile-name">{user.name}</div>
                <div className="cust-profile-role">Administrator</div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="cust-stats-grid">
          <Stat idx={0} icon="📦" label="Total Products"     value={derived.totalProducts} accent="indigo" />
          <Stat idx={1} icon="⏳" label="Pending Approvals"  value={derived.pendingCount}  accent="terracotta" />
          <Stat idx={2} icon="✅" label="Approved Live"      value={derived.approved}      accent="forest" />
          <Stat idx={3} icon="👥" label="Total Users"        value={derived.totalUsers}    accent="ochre" />
        </div>

        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">Quick actions</span>
              <h2>Run the <em>marketplace</em></h2>
            </div>
          </div>
          <div className="ag-action-grid">
            <ActionCard icon="⏳" title="Pending Products"
              desc="Review listings awaiting approval"
              cta="Open queue" onClick={() => navigate('/admin/pending-products')}
              accent="terracotta" />
            <ActionCard icon="📄" title="Document Approval"
              desc="Verify agency KYC documents"
              cta="Review docs" onClick={() => navigate('/document-approval')}
              accent="ochre" />
            <ActionCard icon="👥" title="Manage Users"
              desc="Suspend, activate, view roles"
              cta="View users" onClick={() => navigate('/admin/users')}
              accent="forest" />
            <ActionCard icon="📊" title="Platform Analytics"
              desc="Sales, growth, engagement"
              cta="Open report" onClick={() => navigate('/admin/analytics')}
              accent="indigo" />
          </div>
        </section>

        <div className="cust-twocol">
          <section className="cust-panel">
            <div className="cust-panel-head">
              <div>
                <span className="cust-section-tag">Approval queue</span>
                <h2>Awaiting <em>your review</em></h2>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/admin/pending-products')}>View all →</button>
            </div>
            {loading ? (
              <div className="cust-empty-mini"><span>⏳</span><p>Loading…</p></div>
            ) : pending.length === 0 ? (
              <div className="cust-empty-mini">
                <span>🎉</span>
                <p>Queue is clear — no products awaiting approval right now.</p>
              </div>
            ) : (
              <ul className="ag-list">
                {pending.slice(0, 5).map((p) => (
                  <li key={p._id} className="ag-list-row">
                    <div className="ag-list-thumb"><span>🎨</span></div>
                    <div className="ag-list-meta">
                      <h4>{p.title}</h4>
                      <p>{p.agencyName} · {p.category}</p>
                    </div>
                    <div className="ag-list-status pending">pending</div>
                    <div className="ag-list-price">₹{Number(p.sellingPrice).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cust-panel">
            <div className="cust-panel-head">
              <div>
                <span className="cust-section-tag">Community</span>
                <h2>Recent <em>signups</em></h2>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/admin/users')}>All users →</button>
            </div>
            {users.length === 0 ? (
              <div className="cust-empty-mini">
                <span>👥</span>
                <p>No registered users yet.</p>
              </div>
            ) : (
              <ul className="ag-list">
                {users.slice(0, 5).map((u) => (
                  <li key={u._id} className="ag-list-row" style={{ gridTemplateColumns: '56px 1fr auto' }}>
                    <div className="ag-list-thumb"><span>{u.name?.charAt(0)?.toUpperCase() || '?'}</span></div>
                    <div className="ag-list-meta">
                      <h4>{u.name}</h4>
                      <p>{u.email}</p>
                    </div>
                    <div className={`ag-list-status ${u.status || 'active'}`}>{u.role}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <motion.section
          className="cust-spotlight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px 0px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="cust-spotlight-pattern" aria-hidden />
          <div className="cust-spotlight-copy">
            <span className="cust-spotlight-tag">PLATFORM HEALTH</span>
            <h2>Stewardship matters <em>here.</em></h2>
            <p>Every approval, every flag — every action keeps the marketplace honest for the artisans who depend on it.</p>
            <button className="cust-btn-primary" onClick={() => navigate('/admin/analytics')}>
              See full analytics <span>→</span>
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

const Stat = ({ icon, label, value, accent, idx }) => (
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

const ActionCard = ({ icon, title, desc, cta, onClick, accent }) => (
  <motion.div
    className={`ag-action-card accent-${accent}`}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.25 }}
  >
    <div className="ag-action-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
    <button className="ag-action-cta" onClick={onClick}>{cta} →</button>
  </motion.div>
);

export default AdminDashboard;

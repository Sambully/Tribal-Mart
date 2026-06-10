import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import AgentSidebar from '../components/AgentSidebar';
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

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [myUploads, setMyUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/agent'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'agent') { navigate('/login/agent'); return; }
    setUser(parsed);
    fetchAll();
  }, [navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, agRes, upRes] = await Promise.all([
        api.get('/api/agents/requests/incoming').catch(() => ({ data: [] })),
        api.get('/api/agents/managed-agencies').catch(() => ({ data: [] })),
        api.get('/api/products/agent-uploads').catch(() => ({ data: [] })),
      ]);
      setRequests(reqRes.data || []);
      setAgencies(agRes.data || []);
      setMyUploads(upRes.data || []);
    } catch (e) {
      console.error('Agent dashboard load', e);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (id) => {
    try {
      await api.put(`/api/agents/requests/${id}/approve`);
      setActionMsg('Request approved — agency added to your managed list.');
      fetchAll();
    } catch (e) {
      setActionMsg(e.response?.data?.message || 'Failed to approve');
    }
  };

  const rejectRequest = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):') || '';
    try {
      await api.put(`/api/agents/requests/${id}/reject`, { reason });
      setActionMsg('Request rejected.');
      fetchAll();
    } catch (e) {
      setActionMsg(e.response?.data?.message || 'Failed to reject');
    }
  };

  const stats = useMemo(() => {
    const pendingReq = requests.filter(r => r.status === 'pending').length;
    const awaitingAgency = myUploads.filter(p => p.status === 'pending_agency_approval').length;
    const live = myUploads.filter(p => p.status === 'approved').length;
    return { pendingReq, agencies: agencies.length, awaitingAgency, live };
  }, [requests, myUploads, agencies]);

  if (!user) return null;
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="dashboard-container cust-dash role-agent">
      <AgentSidebar />

      <main className="dashboard-main">
        {/* Hero */}
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
              {greeting()}, <em>{(user.name || 'agent').split(' ')[0]}</em>.
            </h1>
            <p>Help tribal agencies bring their craft to a wider audience — list, manage, and stay in the loop.</p>
            <div className="cust-hero-actions">
              <button className="cust-btn-primary" onClick={() => navigate('/add-product')}>
                + List Product <span>→</span>
              </button>
              <button className="cust-btn-ghost" onClick={() => document.getElementById('agent-managed')?.scrollIntoView({ behavior: 'smooth' })}>
                My Agencies
              </button>
            </div>
          </div>
          <div className="cust-hero-profile">
            <NotificationBell />
            <div className="cust-profile">
              <div className="cust-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="cust-profile-name">{user.name}</div>
                <div className="cust-profile-role">Agent · Community helper</div>
              </div>
            </div>
          </div>
        </motion.section>

        {actionMsg && <div className="ag-banner-msg">{actionMsg}</div>}

        {/* Stats */}
        <div className="cust-stats-grid">
          <Stat idx={0} icon="📨" label="Pending Requests"        value={stats.pendingReq}      accent="terracotta" />
          <Stat idx={1} icon="🏢" label="Managed Agencies"        value={stats.agencies}        accent="ochre" />
          <Stat idx={2} icon="⏳" label="Awaiting Agency"         value={stats.awaitingAgency}  accent="forest" />
          <Stat idx={3} icon="✅" label="Live Listings"           value={stats.live}            accent="indigo" />
        </div>

        {/* Incoming Requests */}
        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">🔔 Inbox</span>
              <h2>Agency help <em>requests</em></h2>
            </div>
          </div>
          {loading ? (
            <div className="cust-empty-mini"><span>📨</span><p>Loading…</p></div>
          ) : pendingRequests.length === 0 ? (
            <div className="cust-empty-mini">
              <span>📭</span>
              <p>No pending requests yet. New requests will appear here.</p>
            </div>
          ) : (
            <ul className="ag-list">
              {pendingRequests.map((r) => (
                <li key={r._id} className="ag-list-row" style={{ gridTemplateColumns: '56px 1fr auto' }}>
                  <div className="ag-list-thumb"><span>🏢</span></div>
                  <div className="ag-list-meta">
                    <h4>{r.agencyName}</h4>
                    <p>📍 {r.agencyAddress}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--fg-light)', marginTop: 4 }}>
                      Sent {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="ag-review-btn" onClick={() => approveRequest(r._id)}>Approve</button>
                    <button className="ag-modal-reject" onClick={() => rejectRequest(r._id)}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Two-column: managed agencies + my uploads */}
        <div className="cust-twocol" id="agent-managed">
          <section className="cust-panel">
            <div className="cust-panel-head">
              <div>
                <span className="cust-section-tag">Your portfolio</span>
                <h2>Managed <em>agencies</em></h2>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/add-product')}>+ List product →</button>
            </div>
            {agencies.length === 0 ? (
              <div className="cust-empty-mini">
                <span>🏢</span>
                <p>No agencies yet — approve a request above to start managing one.</p>
              </div>
            ) : (
              <ul className="ag-list">
                {agencies.map((a) => (
                  <li key={a._id} className="ag-list-row" style={{ gridTemplateColumns: '56px 1fr auto auto', cursor: 'pointer' }} onClick={() => navigate(`/agency/${a._id}`)}>
                    <div className="ag-list-thumb"><span>🪔</span></div>
                    <div className="ag-list-meta">
                      <h4>{a.name}</h4>
                      <p>{a.email}{a.address ? ` · 📍 ${a.address}` : ''}</p>
                    </div>
                    <button
                      className="prof-btn-ghost"
                      onClick={(e) => { e.stopPropagation(); navigate(`/agency/${a._id}`); }}
                      style={{ padding: '0.5rem 0.95rem', fontSize: '0.82rem' }}
                    >Open</button>
                    <button
                      className="ag-review-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/add-product?agencyId=${a._id}`); }}
                    >List for them</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cust-panel">
            <div className="cust-panel-head">
              <div>
                <span className="cust-section-tag">Your work</span>
                <h2>Products <em>you listed</em></h2>
              </div>
            </div>
            {myUploads.length === 0 ? (
              <div className="cust-empty-mini">
                <span>📦</span>
                <p>Products you list will appear here.</p>
              </div>
            ) : (
              <ul className="ag-list">
                {myUploads.slice(0, 6).map((p) => (
                  <li key={p._id} className="ag-list-row">
                    <div className="ag-list-thumb"><span>🎨</span></div>
                    <div className="ag-list-meta">
                      <h4>{p.title}</h4>
                      <p>For: {p.agencyName} · {p.category}</p>
                    </div>
                    <div className={`ag-list-status ${p.status.replace(/_/g,'-')}`}>{p.status.replace(/_/g,' ')}</div>
                    <div className="ag-list-price">₹{Number(p.sellingPrice).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Spotlight */}
        <motion.section
          className="cust-spotlight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px 0px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="cust-spotlight-pattern" aria-hidden />
          <div className="cust-spotlight-copy">
            <span className="cust-spotlight-tag">AGENT IMPACT</span>
            <h2>Every approved listing <em>opens a door</em></h2>
            <p>You're a bridge between traditional makers and a global audience — list with care, and the marketplace amplifies their craft.</p>
            <button className="cust-btn-primary" onClick={() => navigate('/add-product')}>
              List a product <span>→</span>
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

export default AgentDashboard;

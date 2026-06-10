import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import AgencySidebar from '../components/AgencySidebar';
import NotificationBell from '../components/NotificationBell';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../i18n';
import './Dashboard.css';
import './CustomerDashboard.css';

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 5) return 'greeting.evening';
  if (h < 12) return 'greeting.morning';
  if (h < 17) return 'greeting.afternoon';
  return 'greeting.evening';
};

const AgencyDashboard = () => {
  const t = useT();
  const greeting = () => t(greetingKey());
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [myAgentRequests, setMyAgentRequests] = useState([]);
  const [agentPendingProducts, setAgentPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [requestAddress, setRequestAddress] = useState('');
  const [agentMsg, setAgentMsg] = useState('');
  const [reviewProduct, setReviewProduct] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/agency'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'agency') { navigate('/login/agency'); return; }
    setUser(parsed);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productsRes, agentsRes, myReqRes, pendAgentRes] = await Promise.all([
        api.get('/api/products/analytics').catch(() => ({ data: null })),
        api.get('/api/products/my-products').catch(() => ({ data: [] })),
        api.get('/api/agents').catch(() => ({ data: [] })),
        api.get('/api/agents/requests/mine').catch(() => ({ data: [] })),
        api.get('/api/products/agent-uploads-pending').catch(() => ({ data: [] })),
      ]);
      setAnalytics(analyticsRes.data);
      setProducts(productsRes.data || []);
      setAgents(agentsRes.data || []);
      setMyAgentRequests(myReqRes.data || []);
      setAgentPendingProducts(pendAgentRes.data || []);
    } catch (e) {
      console.error('Agency dashboard load', e);
    } finally {
      setLoading(false);
    }
  };

  const requestAgent = async (agentId) => {
    if (!requestAddress.trim()) {
      setAgentMsg('Please enter your agency address before sending a request.');
      return;
    }
    try {
      await api.post('/api/agents/requests', { agentId, agencyAddress: requestAddress });
      setAgentMsg('Request sent — the agent will review it shortly.');
      setShowAgentModal(false);
      fetchDashboardData();
    } catch (e) {
      setAgentMsg(e.response?.data?.message || 'Failed to send request');
    }
  };

  const decideProduct = async (id, approve) => {
    try {
      if (approve) {
        await api.put(`/api/products/${id}/agency-approve`);
        setAgentMsg('Approved — forwarded to admin.');
      } else {
        const reason = window.prompt('Reason for rejection (optional):') || '';
        await api.put(`/api/products/${id}/agency-reject`, { reason });
        setAgentMsg('Rejected.');
      }
      setReviewProduct(null);
      fetchDashboardData();
    } catch (e) {
      setAgentMsg(e.response?.data?.message || 'Action failed');
    }
  };

  // Derived
  const overview = analytics?.overview || {};
  const stats = useMemo(() => ({
    active:   overview.approvedProducts || 0,
    pending:  overview.pendingProducts || 0,
    revenue:  overview.totalRevenue || 0,
    sold:     overview.soldProducts || 0,
    views:    overview.totalViews || 0,
  }), [overview]);

  const recentProducts = products.slice(0, 5);

  if (!user) return null;

  return (
    <div className="dashboard-container cust-dash role-agency">
      <AgencySidebar />

      <main className="dashboard-main">
        {/* Hero greeting */}
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
              {greeting()}, <em>{(user.name || 'partner').split(' ')[0]}</em>.
            </h1>
            <p>{t('agency.heroSub')}</p>
            <div className="cust-hero-actions">
              <button className="cust-btn-primary" onClick={() => navigate('/add-product')}>
                {t('agency.addProduct')} <span>→</span>
              </button>
              <button className="cust-btn-ghost" onClick={() => navigate('/my-products')}>{t('agency.myListings')}</button>
              <button className="cust-btn-ghost" onClick={() => setShowAgentModal(true)}>{t('agency.needAgent')}</button>
            </div>
          </div>
          <div className="cust-hero-profile">
            <LanguageToggle />
            <NotificationBell />
            <div className="cust-profile">
              <div className="cust-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="cust-profile-name">{user.name}</div>
                <div className="cust-profile-role">{t('label.role.agency')}</div>
              </div>
            </div>
          </div>
        </motion.section>

        {agentMsg && (
          <div className="ag-banner-msg">{agentMsg}</div>
        )}

        {/* Stats */}
        <div className="cust-stats-grid">
          <Stat idx={0} icon="📦" label={t('stat.activeListings')}  value={stats.active}  accent="ochre" />
          <Stat idx={1} icon="⏳" label={t('stat.pendingApproval')} value={stats.pending} accent="terracotta" />
          <Stat idx={2} icon="💰" label={t('stat.totalRevenue')}    value={`₹${Number(stats.revenue).toLocaleString()}`} accent="forest" />
          <Stat idx={3} icon="✅" label={t('stat.sold')}             value={stats.sold}    accent="indigo" />
        </div>

        {/* Action cards */}
        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">{t('section.quickActions')}</span>
              <h2>{t('section.runYourShop')}</h2>
            </div>
          </div>
          <div className="ag-action-grid">
            <ActionCard
              icon="➕" title={t('action.addProduct.title')}
              desc={t('action.addProduct.desc')}
              cta={t('action.addProduct.cta')} onClick={() => navigate('/add-product')}
              accent="ochre"
            />
            <ActionCard
              icon="📊" title={t('action.analytics.title')}
              desc={t('action.analytics.desc')}
              cta={t('action.analytics.cta')} onClick={() => navigate('/analytics')}
              accent="indigo"
            />
            <ActionCard
              icon="📋" title={t('action.orders.title')}
              desc={t('action.orders.desc')}
              cta={t('action.orders.cta')} onClick={() => navigate('/agency-orders')}
              accent="terracotta"
            />
            <ActionCard
              icon="🤝" title={t('action.agent.title')}
              desc={t('action.agent.desc')}
              cta={t('action.agent.cta')} onClick={() => setShowAgentModal(true)}
              accent="forest"
            />
          </div>
        </section>

        {/* Agent-uploaded products awaiting approval */}
        {agentPendingProducts.length > 0 && (
          <section className="cust-section ag-attention">
            <div className="cust-section-head">
              <div>
                <span className="cust-section-tag">🔔 Needs your attention</span>
                <h2>Agent listings <em>awaiting your approval</em></h2>
              </div>
            </div>
            <ul className="ag-pending-list">
              {agentPendingProducts.map((p) => (
                <li key={p._id} className="ag-pending-row">
                  <div className="ag-pending-thumb">
                    {p.images && p.images[0]
                      ? <img src={getImageUrl(p.images[0])} alt={p.title} />
                      : <span>🎨</span>}
                  </div>
                  <div className="ag-pending-meta">
                    <h4>{p.title}</h4>
                    <p>{p.category} · Listed by {p.uploadedByAgent?.name || 'agent'}</p>
                  </div>
                  <div className="ag-pending-price">₹{Number(p.sellingPrice).toLocaleString()}</div>
                  <button className="ag-review-btn" onClick={() => setReviewProduct(p)}>Review</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Two-column: recent products + performance */}
        <div className="cust-twocol">
          <section className="cust-panel">
            <div className="cust-panel-head">
              <div>
                <span className="cust-section-tag">Inventory</span>
                <h2>Recent <em>listings</em></h2>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/my-products')}>View all →</button>
            </div>
            {loading ? (
              <div className="cust-empty-mini"><span>📦</span><p>Loading…</p></div>
            ) : recentProducts.length === 0 ? (
              <div className="cust-empty-mini">
                <span>📦</span>
                <p>No listings yet — start with your first product.</p>
                <button className="cust-btn-primary" onClick={() => navigate('/add-product')}>Add a product</button>
              </div>
            ) : (
              <ul className="ag-list">
                {recentProducts.map((p) => (
                  <li key={p._id} className="ag-list-row">
                    <div className="ag-list-thumb">
                      {p.images && p.images[0]
                        ? <img src={getImageUrl(p.images[0])} alt={p.title} />
                        : <span>🎨</span>}
                    </div>
                    <div className="ag-list-meta">
                      <h4>{p.title}</h4>
                      <p>{p.category}</p>
                    </div>
                    <div className={`ag-list-status ${p.status.replace(/_/g,'-')}`}>{p.status.replace(/_/g,' ')}</div>
                    <div className="ag-list-price">₹{Number(p.sellingPrice).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cust-panel">
            <div className="cust-panel-head">
              <div>
                <span className="cust-section-tag">Performance</span>
                <h2>This <em>month</em></h2>
              </div>
            </div>
            <div className="ag-perf-grid">
              <div className="ag-perf-row">
                <span className="ag-perf-label">Total views</span>
                <span className="ag-perf-value">{stats.views.toLocaleString()}</span>
              </div>
              <div className="ag-perf-row">
                <span className="ag-perf-label">Conversion rate</span>
                <span className="ag-perf-value">{overview.conversionRate || 0}%</span>
              </div>
              <div className="ag-perf-row">
                <span className="ag-perf-label">Avg. order value</span>
                <span className="ag-perf-value">₹{Number(overview.avgOrderValue || 0).toLocaleString()}</span>
              </div>
              <div className="ag-perf-row">
                <span className="ag-perf-label">Total sales</span>
                <span className="ag-perf-value">{overview.totalSales || 0}</span>
              </div>
            </div>
            <button className="cust-btn-primary ag-perf-cta" onClick={() => navigate('/analytics')}>
              Full analytics <span>→</span>
            </button>
          </section>
        </div>

        {/* Outgoing agent requests */}
        {myAgentRequests.length > 0 && (
          <section className="cust-section">
            <div className="cust-section-head">
              <div>
                <span className="cust-section-tag">Agent help</span>
                <h2>Your <em>requests</em></h2>
              </div>
            </div>
            <ul className="ag-list">
              {myAgentRequests.map((r) => (
                <li key={r._id} className="ag-list-row">
                  <div className="ag-list-thumb"><span>🤝</span></div>
                  <div className="ag-list-meta">
                    <h4>{r.agent?.name || 'Agent'}</h4>
                    <p>{r.agent?.email}</p>
                  </div>
                  <div className={`ag-list-status ${r.status}`}>{r.status}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Spotlight banner */}
        <motion.section
          className="cust-spotlight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px 0px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="cust-spotlight-pattern" aria-hidden />
          <div className="cust-spotlight-copy">
            <span className="cust-spotlight-tag">GROW YOUR COOPERATIVE</span>
            <h2>List <em>more pieces</em>, reach more buyers</h2>
            <p>Diversify your catalogue with seasonal collections — featured listings get up to 3× the views.</p>
            <button className="cust-btn-primary" onClick={() => navigate('/add-product')}>
              Add a product <span>→</span>
            </button>
          </div>
          <div className="cust-spotlight-art" aria-hidden>
            <span className="cust-spot-shape s1" />
            <span className="cust-spot-shape s2" />
            <span className="cust-spot-shape s3" />
          </div>
        </motion.section>

        {/* Browse-agents modal */}
        {showAgentModal && (
          <div onClick={() => setShowAgentModal(false)} className="ag-modal-bg">
            <div onClick={(e) => e.stopPropagation()} className="ag-modal">
              <h2>Browse Agents</h2>
              <p>Pick an agent to send a help request. They'll see your agency name and the address you provide below.</p>
              <label className="ag-field">
                <span>Your agency address *</span>
                <input
                  type="text"
                  value={requestAddress}
                  onChange={(e) => setRequestAddress(e.target.value)}
                  placeholder="Full address (visible to the agent)"
                />
              </label>
              {agents.length === 0 ? (
                <p className="ag-empty">No agents available right now.</p>
              ) : (
                <ul className="ag-modal-list">
                  {agents.map((a) => {
                    const sent = myAgentRequests.some(r => r.agent?._id === a._id && r.status === 'pending');
                    return (
                      <li key={a._id} className="ag-modal-row">
                        <div>
                          <h4>{a.name}</h4>
                          <p>{a.email}</p>
                          {a.address && <span className="ag-modal-addr">📍 {a.address}</span>}
                        </div>
                        <button
                          className="cust-btn-primary"
                          disabled={sent}
                          style={sent ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                          onClick={() => requestAgent(a._id)}
                        >
                          {sent ? 'Sent' : 'Request help'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button className="ag-modal-close" onClick={() => setShowAgentModal(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Review-product modal */}
        {reviewProduct && (
          <div onClick={() => setReviewProduct(null)} className="ag-modal-bg">
            <div onClick={(e) => e.stopPropagation()} className="ag-modal ag-modal-sm">
              <h2>Review agent listing</h2>
              <p className="ag-modal-sub">Listed by: {reviewProduct.uploadedByAgent?.name}</p>
              <h3 className="ag-modal-title">{reviewProduct.title}</h3>
              <p className="ag-modal-desc">{reviewProduct.description}</p>
              <div className="ag-modal-grid">
                <div><strong>Category:</strong> {reviewProduct.category}</div>
                <div><strong>Condition:</strong> {reviewProduct.condition}</div>
                <div><strong>Original:</strong> ₹{Number(reviewProduct.originalPrice).toLocaleString()}</div>
                <div><strong>Selling:</strong> ₹{Number(reviewProduct.sellingPrice).toLocaleString()}</div>
                <div><strong>Quantity:</strong> {reviewProduct.quantity}</div>
              </div>
              <div className="ag-modal-actions">
                <button className="ag-modal-reject" onClick={() => decideProduct(reviewProduct._id, false)}>Reject</button>
                <button className="cust-btn-primary" onClick={() => decideProduct(reviewProduct._id, true)}>
                  Approve & forward to admin <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* ─── helpers ─── */
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

export default AgencyDashboard;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import AgentSidebar from '../components/AgentSidebar';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import '../Payouts/Payouts.css';

const AgentEarnings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/agent'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'agent') { navigate('/login/agent'); return; }
    setUser(parsed);
    (async () => {
      try {
        const res = await api.get('/api/agents/earnings');
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  if (!user) return null;

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
            <span className="cust-hero-tag">EARNINGS · COMMISSION 5%</span>
            <h1>Your <em>earnings.</em></h1>
            <p>Commission on every approved sale of products you list, across all agencies you manage.</p>
          </div>
        </motion.section>

        {loading ? (
          <div className="cust-section"><div className="cust-empty-mini"><span>💰</span><p>Loading…</p></div></div>
        ) : !data ? (
          <div className="cust-section"><div className="cust-empty"><div className="cust-empty-icon">💰</div><h3>No earnings yet</h3><p>List products for agencies you manage. You earn 5% on every approved sale.</p></div></div>
        ) : (
          <>
            <section className="payout-headline">
              <div className="payout-headline-inner">
                <div>
                  <span className="cust-section-tag">Commission earned</span>
                  <div className="payout-big">₹{Number(data.commission).toLocaleString()}</div>
                  <p className="payout-sub">From ₹{Number(data.grossRevenue).toLocaleString()} in approved sales · {Math.round(data.rate * 100)}% rate</p>
                </div>
                <div className="payout-cta-block">
                  <button className="cust-btn-primary" disabled>Request payout</button>
                  <small style={{ display: 'block', color: 'var(--fg-light)', marginTop: 6 }}>Monthly on the 5th</small>
                </div>
              </div>
            </section>

            <div className="cust-stats-grid">
              <div className="cust-stat terracotta">
                <div className="cust-stat-icon">📦</div>
                <div className="cust-stat-body">
                  <div className="cust-stat-value">{data.totalProducts}</div>
                  <div className="cust-stat-label">Total Listings</div>
                </div>
              </div>
              <div className="cust-stat ochre">
                <div className="cust-stat-icon">✅</div>
                <div className="cust-stat-body">
                  <div className="cust-stat-value">{data.live}</div>
                  <div className="cust-stat-label">Live</div>
                </div>
              </div>
              <div className="cust-stat forest">
                <div className="cust-stat-icon">💰</div>
                <div className="cust-stat-body">
                  <div className="cust-stat-value">{data.sold}</div>
                  <div className="cust-stat-label">Sold</div>
                </div>
              </div>
              <div className="cust-stat indigo">
                <div className="cust-stat-icon">🏢</div>
                <div className="cust-stat-body">
                  <div className="cust-stat-value">{data.perAgency.length}</div>
                  <div className="cust-stat-label">Agencies</div>
                </div>
              </div>
            </div>

            <section className="cust-section">
              <div className="cust-section-head">
                <div>
                  <span className="cust-section-tag">Per agency</span>
                  <h2>Earnings <em>by cooperative</em></h2>
                </div>
              </div>
              {data.perAgency.length === 0 ? (
                <div className="cust-empty-mini"><span>🏢</span><p>You're not managing any agencies yet.</p></div>
              ) : (
                <ul className="payout-sched">
                  {data.perAgency.map((a) => (
                    <li key={a.agencyId} className="sched-row sched-paid" style={{ cursor: 'pointer' }} onClick={() => navigate(`/agency/${a.agencyId}`)}>
                      <div className="sched-left">
                        <div className="sched-period">{a.agencyName}</div>
                        <div className="sched-date">{a.productsListed} listed · {a.sold} sold · {a.live} live</div>
                      </div>
                      <div className="sched-amount">₹{a.commission.toLocaleString()}</div>
                      <div className="sched-pill sched-pill-paid">₹{a.revenue.toLocaleString()} GMV</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AgentEarnings;

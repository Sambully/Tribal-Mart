import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { useToast } from '../components/Toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import '../Payouts/Payouts.css';

const AdminFinance = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settled, setSettled] = useState({}); // local state for "mark as paid" toggles per agency

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login/admin'); return; }
    if (JSON.parse(userData).role !== 'admin') { navigate('/login/admin'); return; }
    (async () => {
      try {
        const res = await api.get('/api/admin/financial-summary');
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  const settle = (agencyKey, name) => {
    setSettled((s) => ({ ...s, [agencyKey]: { paidAt: Date.now() } }));
    toast.success(`Settlement to ${name} marked as paid`);
  };

  if (loading || !data) return (
    <div className="dashboard-container cust-dash role-admin">
      <AdminSidebar />
      <main className="dashboard-main"><div className="cust-empty-mini"><span>💸</span><p>Loading finance…</p></div></main>
    </div>
  );

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
            <span className="cust-hero-tag">FINANCIAL OVERVIEW</span>
            <h1>Platform <em>finances.</em></h1>
            <p>Gross merchandise value, platform commission, GST, and settlements to cooperatives.</p>
          </div>
        </motion.section>

        {/* Headline */}
        <section className="payout-headline" style={{ background: 'linear-gradient(135deg, var(--indigo) 0%, #1a2238 100%)', boxShadow: '0 14px 40px rgba(46,58,89,0.32)' }}>
          <div className="payout-headline-inner">
            <div>
              <span className="cust-section-tag">Platform revenue (commission + GST)</span>
              <div className="payout-big">₹{Number(data.platformRevenue).toLocaleString()}</div>
              <p className="payout-sub">From {data.completedOrders} completed orders · ₹{Number(data.completedGmv).toLocaleString()} GMV</p>
            </div>
          </div>
        </section>

        <div className="cust-stats-grid">
          <div className="cust-stat ochre"><div className="cust-stat-icon">📈</div><div className="cust-stat-body"><div className="cust-stat-value">₹{Number(data.gmv).toLocaleString()}</div><div className="cust-stat-label">Total GMV</div></div></div>
          <div className="cust-stat terracotta"><div className="cust-stat-icon">💼</div><div className="cust-stat-body"><div className="cust-stat-value">₹{Number(data.commission).toLocaleString()}</div><div className="cust-stat-label">Commission earned</div></div></div>
          <div className="cust-stat forest"><div className="cust-stat-icon">📋</div><div className="cust-stat-body"><div className="cust-stat-value">₹{Number(data.gst).toLocaleString()}</div><div className="cust-stat-label">GST collected</div></div></div>
          <div className="cust-stat indigo"><div className="cust-stat-icon">💸</div><div className="cust-stat-body"><div className="cust-stat-value">₹{Number(data.payable).toLocaleString()}</div><div className="cust-stat-label">Payable to agencies</div></div></div>
        </div>

        {/* Settlement table */}
        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">Settlements</span>
              <h2>Pay <em>cooperatives</em></h2>
            </div>
          </div>
          {data.settlements.length === 0 ? (
            <div className="cust-empty-mini"><span>💸</span><p>No completed orders yet — nothing to settle.</p></div>
          ) : (
            <ul className="payout-sched">
              {data.settlements.map((s) => {
                const isPaid = !!settled[s.agency];
                return (
                  <li key={s.agency} className={`sched-row ${isPaid ? 'sched-paid' : ''}`} style={{ gridTemplateColumns: '1fr auto auto auto auto' }}>
                    <div className="sched-left">
                      <div className="sched-period">{s.agencyName}</div>
                      <div className="sched-date">{s.orders} order{s.orders !== 1 ? 's' : ''} · GMV ₹{Number(s.gmv).toLocaleString()}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', color: 'var(--fg-mid)', fontSize: '0.85rem' }}>
                      −₹{Number(s.commission + s.gst).toLocaleString()}<br />
                      <small>commission + GST</small>
                    </div>
                    <div className="sched-amount">₹{Number(s.payable).toLocaleString()}</div>
                    <div className={`sched-pill ${isPaid ? 'sched-pill-paid' : 'sched-pill-pending'}`}>
                      {isPaid ? 'Paid' : 'Pending'}
                    </div>
                    {!isPaid && (
                      <button
                        onClick={() => settle(s.agency, s.agencyName)}
                        style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 50, padding: '0.5rem 1.1rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Mark paid
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">Breakdown</span>
              <h2>How <em>revenue is split</em></h2>
            </div>
          </div>
          <div className="payout-breakdown">
            <div className="pb-row"><span>Gross merchandise value (all orders)</span><span>₹{Number(data.gmv).toLocaleString()}</span></div>
            <div className="pb-row"><span>Completed GMV (delivered orders)</span><span>₹{Number(data.completedGmv).toLocaleString()}</span></div>
            <div className="pb-row"><span>Platform commission (10%)</span><span>₹{Number(data.commission).toLocaleString()}</span></div>
            <div className="pb-row"><span>GST on commission (18%)</span><span>₹{Number(data.gst).toLocaleString()}</span></div>
            <div className="pb-row total"><span>Payable to cooperatives</span><span>₹{Number(data.payable).toLocaleString()}</span></div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminFinance;

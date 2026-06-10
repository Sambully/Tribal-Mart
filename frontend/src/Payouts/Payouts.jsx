import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import AgencySidebar from '../components/AgencySidebar';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../i18n';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import './Payouts.css';

const COMMISSION_RATE = 0.10;    // 10% platform commission
const GST_RATE        = 0.18;    // GST on commission only

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 5) return 'greeting.evening';
  if (h < 12) return 'greeting.morning';
  if (h < 17) return 'greeting.afternoon';
  return 'greeting.evening';
};

const Payouts = () => {
  const navigate = useNavigate();
  const t = useT();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/agency'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'agency') { navigate('/login/agency'); return; }
    setUser(parsed);
    load();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, oRes] = await Promise.all([
        api.get('/api/products/analytics').catch(() => ({ data: null })),
        api.get('/api/orders/agency-orders').catch(() => ({ data: [] })),
      ]);
      setAnalytics(aRes.data);
      setOrders(Array.isArray(oRes.data) ? oRes.data : (oRes.data.orders || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const computed = useMemo(() => {
    const o = analytics?.overview || {};
    const grossRevenue = o.totalRevenue || 0;
    const commission   = grossRevenue * COMMISSION_RATE;
    const gst          = commission * GST_RATE;
    const netPayout    = grossRevenue - commission - gst;
    const totalOrders  = o.totalSales || 0;
    return {
      grossRevenue: Math.round(grossRevenue),
      commission:   Math.round(commission),
      gst:          Math.round(gst),
      netPayout:    Math.round(netPayout),
      totalOrders,
      avgOrderValue: o.avgOrderValue || 0,
    };
  }, [analytics]);

  const monthlySales = analytics?.monthlySales || [];
  const maxMonthRev  = Math.max(1, ...monthlySales.map(m => m.revenue || 0));

  // Mock settlement schedule
  const settlementSchedule = useMemo(() => {
    const today = new Date();
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
    return [
      { id: 1, period: 'Last week',        amount: Math.round(computed.netPayout * 0.4), status: 'paid',    date: new Date(today.getTime() - 7 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
      { id: 2, period: 'This week',        amount: Math.round(computed.netPayout * 0.35), status: 'pending', date: nextFriday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
      { id: 3, period: 'Awaiting fulfilment', amount: Math.round(computed.netPayout * 0.25), status: 'holding', date: '—' },
    ];
  }, [computed.netPayout]);

  if (!user) return null;

  return (
    <div className="dashboard-container cust-dash role-agency">
      <AgencySidebar />

      <main className="dashboard-main">
        <motion.section
          className="cust-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">{t('sidebar.payouts').toUpperCase()}</span>
            <h1>
              {t('greeting.morning') === '' ? 'Payouts' : t(greetingKey())}, <em>{(user.name || '').split(' ')[0]}</em>.
            </h1>
            <p>{t('payouts.subtitle', 'Track your sales, platform fees, and net payout to your account.')}</p>
          </div>
          <div className="cust-hero-profile">
            <LanguageToggle />
            <div className="cust-profile">
              <div className="cust-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="cust-profile-name">{user.name}</div>
                <div className="cust-profile-role">{t('label.role.agency')}</div>
              </div>
            </div>
          </div>
        </motion.section>

        {loading ? (
          <div className="cust-section">
            <div className="cust-empty-mini"><span>💸</span><p>{t('common.loading')}</p></div>
          </div>
        ) : (
          <>
            {/* Headline payout card */}
            <section className="payout-headline">
              <div className="payout-headline-inner">
                <div>
                  <span className="cust-section-tag">{t('payouts.netPayable', 'Net payable to your account')}</span>
                  <div className="payout-big">₹{computed.netPayout.toLocaleString()}</div>
                  <p className="payout-sub">
                    {t('payouts.afterFees', 'After')} 10% {t('payouts.commission', 'platform commission')} + 18% GST
                  </p>
                </div>
                <div className="payout-cta-block">
                  <button className="cust-btn-primary" disabled>
                    {t('payouts.requestPayout', 'Request early payout')}
                  </button>
                  <small style={{ display: 'block', color: 'var(--fg-light)', marginTop: 6 }}>
                    {t('payouts.weekly', 'Payouts are processed every Friday')}
                  </small>
                </div>
              </div>
            </section>

            {/* Breakdown */}
            <section className="cust-section">
              <div className="cust-section-head">
                <div>
                  <span className="cust-section-tag">{t('payouts.breakdown', 'Breakdown')}</span>
                  <h2>{t('payouts.howCalculated', 'How your payout is')} <em>{t('payouts.calculated', 'calculated')}</em></h2>
                </div>
              </div>
              <div className="payout-breakdown">
                <div className="pb-row">
                  <span>{t('payouts.grossSales', 'Gross sales')}</span>
                  <span>₹{computed.grossRevenue.toLocaleString()}</span>
                </div>
                <div className="pb-row neg">
                  <span>{t('payouts.commission', 'Platform commission')} (10%)</span>
                  <span>− ₹{computed.commission.toLocaleString()}</span>
                </div>
                <div className="pb-row neg">
                  <span>GST {t('payouts.onCommission', 'on commission')} (18%)</span>
                  <span>− ₹{computed.gst.toLocaleString()}</span>
                </div>
                <div className="pb-row total">
                  <span>{t('payouts.net', 'Net payout')}</span>
                  <span>₹{computed.netPayout.toLocaleString()}</span>
                </div>
              </div>
            </section>

            {/* Stats */}
            <div className="cust-stats-grid">
              <div className="cust-stat ochre">
                <div className="cust-stat-icon">🛍️</div>
                <div className="cust-stat-body">
                  <div className="cust-stat-value">{computed.totalOrders}</div>
                  <div className="cust-stat-label">{t('payouts.completedOrders', 'Completed orders')}</div>
                </div>
              </div>
              <div className="cust-stat terracotta">
                <div className="cust-stat-icon">💰</div>
                <div className="cust-stat-body">
                  <div className="cust-stat-value">₹{Number(computed.avgOrderValue).toLocaleString()}</div>
                  <div className="cust-stat-label">{t('payouts.avgOrder', 'Avg order value')}</div>
                </div>
              </div>
              <div className="cust-stat forest">
                <div className="cust-stat-icon">📈</div>
                <div className="cust-stat-body">
                  <div className="cust-stat-value">{(computed.grossRevenue ? ((computed.netPayout / computed.grossRevenue) * 100) : 0).toFixed(1)}%</div>
                  <div className="cust-stat-label">{t('payouts.takeHome', 'Take-home rate')}</div>
                </div>
              </div>
              <div className="cust-stat indigo">
                <div className="cust-stat-icon">🗓️</div>
                <div className="cust-stat-body">
                  <div className="cust-stat-value">Fri</div>
                  <div className="cust-stat-label">{t('payouts.nextPayoutDay', 'Next payout day')}</div>
                </div>
              </div>
            </div>

            {/* Monthly chart */}
            <section className="cust-section">
              <div className="cust-section-head">
                <div>
                  <span className="cust-section-tag">{t('payouts.last6Months', 'Last 6 months')}</span>
                  <h2>{t('payouts.salesBy', 'Sales by')} <em>{t('payouts.month', 'month')}</em></h2>
                </div>
              </div>
              {monthlySales.length === 0 ? (
                <div className="cust-empty-mini"><span>📊</span><p>{t('payouts.noSales', 'No sales recorded yet this period.')}</p></div>
              ) : (
                <div className="payout-chart">
                  {monthlySales.map((m, i) => {
                    const month = new Date(m._id.year, m._id.month - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
                    const h = Math.max(8, (m.revenue / maxMonthRev) * 180);
                    return (
                      <div key={i} className="bar-col">
                        <div className="bar-val">₹{Math.round(m.revenue / 1000)}k</div>
                        <div className="bar" style={{ height: `${h}px` }} />
                        <div className="bar-label">{month}</div>
                        <div className="bar-sub">{m.count} {t('payouts.orders', 'orders')}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Settlement schedule */}
            <section className="cust-section">
              <div className="cust-section-head">
                <div>
                  <span className="cust-section-tag">{t('payouts.upcoming', 'Upcoming')}</span>
                  <h2>{t('payouts.settlementSched', 'Settlement')} <em>{t('payouts.schedule', 'schedule')}</em></h2>
                </div>
              </div>
              <ul className="payout-sched">
                {settlementSchedule.map((s) => (
                  <li key={s.id} className={`sched-row sched-${s.status}`}>
                    <div className="sched-left">
                      <div className="sched-period">{s.period}</div>
                      <div className="sched-date">{s.date}</div>
                    </div>
                    <div className="sched-amount">₹{s.amount.toLocaleString()}</div>
                    <div className={`sched-pill sched-pill-${s.status}`}>
                      {s.status === 'paid' ? t('payouts.paid', 'Paid') : s.status === 'pending' ? t('payouts.scheduled', 'Scheduled') : t('payouts.holding', 'Holding')}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Bank info */}
            <section className="cust-section">
              <div className="cust-section-head">
                <div>
                  <span className="cust-section-tag">{t('payouts.bankInfo', 'Bank information')}</span>
                  <h2>{t('payouts.where', 'Where')} <em>{t('payouts.payoutsLand', 'your payouts land')}</em></h2>
                </div>
              </div>
              <div className="payout-bank">
                <div>
                  <h4>{user.name}</h4>
                  <p>UPI ID: <strong>{user.email?.split('@')[0]}@hdfc</strong></p>
                  <p>{t('payouts.bankNote', 'To change your payout method, contact platform support — bank verification is required.')}</p>
                </div>
                <button className="prof-btn-ghost" onClick={() => navigate('/contact')}>
                  {t('payouts.contactSupport', 'Contact support')}
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Payouts;

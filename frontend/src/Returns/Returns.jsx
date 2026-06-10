import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import CustomerSidebar from '../components/CustomerSidebar';
import AgencySidebar from '../components/AgencySidebar';
import { useToast } from '../components/Toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import '../Profile/Profile.css';
import './Returns.css';

const STATUS_PILL = {
  requested: { bg: 'rgba(192,138,44,0.14)', color: 'var(--warning)', label: 'Requested' },
  approved:  { bg: 'rgba(74,106,58,0.14)',  color: 'var(--forest)', label: 'Approved' },
  received:  { bg: 'rgba(46,58,89,0.12)',   color: 'var(--indigo)', label: 'Received' },
  refunded:  { bg: 'rgba(74,106,58,0.18)',  color: 'var(--forest)', label: 'Refunded' },
  rejected:  { bg: 'rgba(168,59,31,0.12)',  color: 'var(--danger)', label: 'Rejected' },
};

const REASONS = [
  'Item damaged in transit',
  'Wrong item delivered',
  'Item not as described',
  'Quality not as expected',
  'No longer needed',
  'Other (specify below)',
];

const Returns = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderId: '', reason: REASONS[0], detail: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login'); return; }
    setUser(JSON.parse(userData));
    load();
  }, [navigate]);

  const role = user?.role;

  const load = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(localStorage.getItem('user') || 'null');
      if (parsed?.role === 'agency') {
        const res = await api.get('/api/returns/agency');
        setReturns(res.data || []);
      } else {
        const [myReturns, orders] = await Promise.all([
          api.get('/api/returns/mine'),
          api.get('/api/orders/my-orders').catch(() => ({ data: [] })),
        ]);
        setReturns(myReturns.data || []);
        const list = Array.isArray(orders.data) ? orders.data : (orders.data.orders || []);
        // Only delivered orders without a current open return
        const openIds = new Set((myReturns.data || []).filter(r => ['requested','approved','received'].includes(r.status)).map(r => String(r.order)));
        setEligibleOrders(list.filter(o => o.orderStatus === 'delivered' && !openIds.has(String(o._id))));
      }
    } catch (e) {
      console.error('Returns load', e);
    } finally {
      setLoading(false);
    }
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    if (!form.orderId) return;
    try {
      const reason = form.reason === 'Other (specify below)' ? (form.detail || 'Other').trim() : form.reason + (form.detail ? ` · ${form.detail.trim()}` : '');
      await api.post('/api/returns', { orderId: form.orderId, reason });
      toast.success('Return request submitted');
      setShowForm(false);
      setForm({ orderId: '', reason: REASONS[0], detail: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return');
    }
  };

  const agencyDecide = async (id, decision) => {
    const note = decision === 'reject' ? (window.prompt('Reason for rejection?') || '') : '';
    try {
      await api.put(`/api/returns/${id}/decide`, { decision, note });
      toast.success(decision === 'approve' ? 'Return approved' : 'Return rejected');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const agencyRefund = async (id) => {
    if (!window.confirm('Mark this return as refunded?')) return;
    try {
      await api.put(`/api/returns/${id}/refund`);
      toast.success('Refund recorded');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-container cust-dash">
      {role === 'agency' ? <AgencySidebar /> : <CustomerSidebar />}

      <main className="dashboard-main">
        <motion.section
          className="cust-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">{role === 'agency' ? 'INCOMING RETURNS' : 'YOUR RETURNS'}</span>
            <h1>{role === 'agency' ? 'Return requests' : 'Returns &'} <em>{role === 'agency' ? 'to review.' : 'refunds.'}</em></h1>
            <p>{role === 'agency'
              ? 'Customers requesting returns on your delivered orders. Approve, ship-back, refund.'
              : 'Open a return on any delivered order within 7 days. Track the refund status here.'}</p>
            {role !== 'agency' && eligibleOrders.length > 0 && !showForm && (
              <div className="cust-hero-actions">
                <button className="cust-btn-primary" onClick={() => setShowForm(true)}>+ Start a return <span>→</span></button>
              </div>
            )}
          </div>
          <div className="cust-hero-profile">
            <div className="cust-profile">
              <div className="cust-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="cust-profile-name">{user.name}</div>
                <div className="cust-profile-role">{role}</div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* New return form */}
        {role !== 'agency' && showForm && (
          <section className="cust-section">
            <div className="cust-section-head">
              <div>
                <span className="cust-section-tag">New return</span>
                <h2>Tell us what <em>went wrong</em></h2>
              </div>
            </div>
            <form onSubmit={submitReturn} className="ret-form">
              <label className="ret-field">
                <span>Order to return *</span>
                <select required value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
                  <option value="">Select a delivered order</option>
                  {eligibleOrders.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.orderNumber || o._id.slice(-6).toUpperCase()} · ₹{Number(o.totalAmount).toLocaleString()} · {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </option>
                  ))}
                </select>
                {eligibleOrders.length === 0 && (
                  <small style={{ color: 'var(--fg-light)', marginTop: '0.4rem' }}>
                    No delivered orders are eligible for return.
                  </small>
                )}
              </label>
              <label className="ret-field">
                <span>Reason *</span>
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                  {REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label className="ret-field">
                <span>Additional detail</span>
                <textarea
                  rows="3"
                  value={form.detail}
                  onChange={(e) => setForm({ ...form, detail: e.target.value })}
                  placeholder="Describe the issue (photos can be attached after approval)"
                />
              </label>
              <div className="ret-form-actions">
                <button type="button" className="prof-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="cust-btn-primary">Submit return</button>
              </div>
            </form>
          </section>
        )}

        {/* List of returns */}
        <section className="cust-section">
          <div className="cust-section-head">
            <div>
              <span className="cust-section-tag">All returns</span>
              <h2>Return <em>history</em></h2>
            </div>
          </div>

          {loading ? (
            <div className="cust-empty-mini"><span>↩️</span><p>Loading…</p></div>
          ) : returns.length === 0 ? (
            <div className="cust-empty">
              <div className="cust-empty-icon">↩️</div>
              <h3>No returns yet</h3>
              <p>{role === 'agency'
                ? 'When customers request returns on your orders, they\'ll show here.'
                : 'You haven\'t opened any returns. Delivered orders can be returned within 7 days.'}</p>
            </div>
          ) : (
            <div className="ret-list">
              {returns.map((r) => {
                const pill = STATUS_PILL[r.status] || STATUS_PILL.requested;
                return (
                  <div key={r._id} className="ret-card">
                    <div className="ret-card-head">
                      <div>
                        <div className="ret-no">#{r.orderNumber || r._id.slice(-6).toUpperCase()}</div>
                        <div className="ret-sub">
                          {role === 'agency' ? `From ${r.customerName}` : `Sold by ${r.agencyName || 'agency'}`} ·{' '}
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="ret-pill" style={{ background: pill.bg, color: pill.color }}>{pill.label}</div>
                    </div>

                    <div className="ret-card-body">
                      <p className="ret-reason"><strong>Reason:</strong> {r.reason}</p>
                      {r.items?.length > 0 && (
                        <ul className="ret-items">
                          {r.items.map((it, i) => (
                            <li key={i}>
                              <span>{it.title}</span>
                              <span>Qty {it.quantity}</span>
                              <span>₹{Number((it.sellingPrice || 0) * (it.quantity || 1)).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="ret-refund">Refund amount: <strong>₹{Number(r.refundAmount || 0).toLocaleString()}</strong></div>

                      {r.timeline?.length > 0 && (
                        <ul className="ret-timeline">
                          {r.timeline.map((t, i) => (
                            <li key={i}>
                              <span className="ret-dot" />
                              <div>
                                <strong>{t.status}</strong> — {t.message}
                                <span className="ret-time">
                                  {new Date(t.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {role === 'agency' && r.status === 'requested' && (
                        <div className="ret-actions">
                          <button className="ret-btn-primary" onClick={() => agencyDecide(r._id, 'approve')}>Approve return</button>
                          <button className="ret-btn-reject" onClick={() => agencyDecide(r._id, 'reject')}>Reject</button>
                        </div>
                      )}
                      {role === 'agency' && ['approved', 'received'].includes(r.status) && (
                        <div className="ret-actions">
                          <button className="ret-btn-primary" onClick={() => agencyRefund(r._id)}>Mark refunded</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Returns;

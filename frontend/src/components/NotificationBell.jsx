import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './NotificationBell.css';

// Role-aware notification fetcher.
// Returns [{ id, icon, title, sub, href, kind }, ...]
const buildNotifications = async (role) => {
  const out = [];
  try {
    if (role === 'agency') {
      const [pendAgent, orders] = await Promise.all([
        api.get('/api/products/agent-uploads-pending').catch(() => ({ data: [] })),
        api.get('/api/orders/agency-recent').catch(() => ({ data: [] })),
      ]);
      (pendAgent.data || []).slice(0, 5).forEach(p => out.push({
        id: 'pa-' + p._id, icon: '🔔',
        title: 'Agent listing awaiting your approval',
        sub: p.title, href: '/dashboard/agency', kind: 'warning'
      }));
      (Array.isArray(orders.data) ? orders.data : (orders.data.orders || [])).slice(0, 5).forEach(o => out.push({
        id: 'o-' + o._id, icon: '📋',
        title: `New order · ${o.orderNumber || ''}`,
        sub: `From ${o.customerName || 'a buyer'}`, href: '/agency-orders', kind: 'info'
      }));
    } else if (role === 'agent') {
      const reqs = await api.get('/api/agents/requests/incoming').catch(() => ({ data: [] }));
      (reqs.data || []).filter(r => r.status === 'pending').slice(0, 6).forEach(r => out.push({
        id: 'r-' + r._id, icon: '📨',
        title: `Help request from ${r.agencyName}`,
        sub: r.agencyAddress, href: '/dashboard/agent', kind: 'warning'
      }));
    } else if (role === 'admin') {
      const [pend, docs] = await Promise.all([
        api.get('/api/admin/pending-products').catch(() => ({ data: { products: [] } })),
        api.get('/api/documents/pending').catch(() => ({ data: [] })),
      ]);
      const pendList = Array.isArray(pend.data) ? pend.data : (pend.data.products || []);
      pendList.slice(0, 5).forEach(p => out.push({
        id: 'pp-' + p._id, icon: '⏳',
        title: 'Product awaiting approval',
        sub: `${p.title} · ${p.agencyName}`, href: '/admin/pending-products', kind: 'warning'
      }));
      const docsList = Array.isArray(docs.data) ? docs.data : (docs.data.documents || []);
      docsList.slice(0, 5).forEach(d => out.push({
        id: 'd-' + d._id, icon: '📄',
        title: 'Document awaiting verification',
        sub: d.agencyName || 'Agency document', href: '/document-approval', kind: 'info'
      }));
    } else { // customer
      const orders = await api.get('/api/orders/my-orders').catch(() => ({ data: [] }));
      const list = Array.isArray(orders.data) ? orders.data : (orders.data.orders || []);
      list.slice(0, 5).forEach(o => out.push({
        id: 'co-' + o._id, icon: o.orderStatus === 'delivered' ? '✅' : o.orderStatus === 'shipped' ? '🚚' : '📦',
        title: `Order ${o.orderStatus || 'placed'}`,
        sub: o.orderNumber || '', href: '/orders', kind: 'info'
      }));
    }
  } catch (e) { console.error('Notifications load', e); }
  return out;
};

const NotificationBell = ({ className = '' }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  const load = async () => {
    if (!user) return;
    setLoaded(false);
    const data = await buildNotifications(user.role);
    setItems(data);
    setLoaded(true);
  };

  useEffect(() => {
    if (open && !loaded) load();
  }, [open]);   // eslint-disable-line

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!user) return null;
  const count = items.length;

  return (
    <div className={`notif-wrap ${className}`} ref={ref}>
      <button
        className="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        title="Notifications"
      >
        🔔
        {loaded && count > 0 && <span className="notif-dot">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-head">
            <h4>Notifications</h4>
            <button className="notif-refresh" onClick={load}>↻</button>
          </div>
          {!loaded ? (
            <div className="notif-empty">Loading…</div>
          ) : items.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">🌟</div>
              <p>You're all caught up.</p>
            </div>
          ) : (
            <ul className="notif-list">
              {items.map((it) => (
                <li
                  key={it.id}
                  className={`notif-item kind-${it.kind || 'info'}`}
                  onClick={() => { setOpen(false); navigate(it.href); }}
                >
                  <span className="notif-item-icon">{it.icon}</span>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{it.title}</div>
                    {it.sub && <div className="notif-item-sub">{it.sub}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

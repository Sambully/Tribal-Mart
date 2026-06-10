import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AgencySidebar from '../components/AgencySidebar';
import './AgencyOrders.css';

const AgencyOrders = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingForm, setTrackingForm] = useState({ status: '', message: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login/agency');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'agency') {
      navigate('/login/agency');
      return;
    }

    setUser(parsedUser);
    fetchOrders();
    fetchStats();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders/agency-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/orders/agency-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      alert('Order status updated successfully');
      fetchOrders();
      fetchStats();
      if (selectedOrder && selectedOrder._id === orderId) {
        const response = await api.get(`/api/orders/${orderId}`);
        setSelectedOrder(response.data);
      }
    } catch (error) {
      alert('Failed to update order status');
      console.error(error);
    }
  };

  const handleAddTracking = async (e) => {
    e.preventDefault();
    if (!trackingForm.status || !trackingForm.message) {
      alert('Please fill all fields');
      return;
    }

    try {
      await api.post(`/api/orders/${selectedOrder._id}/tracking`, trackingForm);
      alert('Tracking update added');
      setTrackingForm({ status: '', message: '' });
      const response = await api.get(`/api/orders/${selectedOrder._id}`);
      setSelectedOrder(response.data);
      fetchOrders();
    } catch (error) {
      alert('Failed to add tracking update');
      console.error(error);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const printPackingSlip = (order) => {
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    const addr = order.shippingAddress || {};
    const itemsHtml = (order.items || []).map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${it.productTitle || it.title || 'Item'}</strong></td>
        <td style="text-align:center; font-size:18px; font-weight:700">${it.quantity}</td>
        <td>SKU-${(it.product || '').slice(-6).toUpperCase()}</td>
      </tr>`).join('');
    const date = new Date(order.createdAt).toLocaleString('en-IN');
    win.document.write(`<!doctype html><html><head>
      <title>Packing Slip ${order.orderNumber}</title>
      <style>
        body { font-family: 'DM Sans', system-ui, sans-serif; padding: 36px; max-width: 760px; margin: 0 auto; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #c0552c; padding-bottom: 14px; margin-bottom: 22px; }
        .brand { font-family: Georgia, serif; font-style: italic; font-weight: 700; font-size: 24px; color: #c0552c; }
        .brand small { display: block; font-style: normal; font-weight: 600; font-size: 11px; letter-spacing: 0.16em; color: #5b4e44; text-transform: uppercase; margin-top: 4px; }
        .order-no { font-family: 'Figtree', sans-serif; font-weight: 900; font-size: 20px; }
        .box { background: #faf6f0; border: 1px solid #d8ccba; padding: 12px 16px; border-radius: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 24px; }
        h4 { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.14em; color: #5b4e44; text-transform: uppercase; }
        p { margin: 2px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #1a1410; color: white; padding: 10px; text-align: left; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
        td { padding: 10px; border-bottom: 1px solid #ebe0cd; font-size: 13px; }
        .barcode { font-family: monospace; font-size: 28px; letter-spacing: 4px; text-align: center; padding: 14px; background: #1a1410; color: white; border-radius: 8px; margin-top: 18px; }
        .notes { margin-top: 24px; padding: 14px; background: #fff3e8; border-left: 4px solid #c0552c; border-radius: 4px; font-size: 12px; }
        .foot { margin-top: 30px; padding-top: 14px; border-top: 1px solid #d8ccba; font-size: 11px; color: #8c7d70; text-align: center; }
        @media print { body { background: white; } .noprint { display: none; } }
      </style></head><body>
      <div class="head">
        <div class="brand">Tribal Mart<small>Packing Slip</small></div>
        <div style="text-align:right">
          <div class="order-no">#${order.orderNumber}</div>
          <div style="font-size:13px; color:#5b4e44">${date}</div>
          <div style="font-size:13px; color:#5b4e44">Status: <strong>${(order.orderStatus || 'pending').toUpperCase()}</strong></div>
        </div>
      </div>
      <div class="grid">
        <div class="box">
          <h4>Ship to</h4>
          <p><strong style="font-size: 15px;">${addr.fullName || ''}</strong></p>
          <p>${addr.addressLine1 || ''}</p>
          ${addr.addressLine2 ? `<p>${addr.addressLine2}</p>` : ''}
          <p>${addr.city || ''}, ${addr.state || ''} – ${addr.pincode || ''}</p>
          <p>📞 ${addr.phone || ''}</p>
        </div>
        <div class="box">
          <h4>From</h4>
          <p><strong>${order.items?.[0]?.agencyName || ''}</strong></p>
          <p>Verified Tribal Cooperative</p>
          <p>Tribal Mart Marketplace</p>
        </div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Item</th><th style="text-align:center">Qty</th><th>SKU</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="barcode">*${order.orderNumber || order._id.slice(-10).toUpperCase()}*</div>
      <div class="notes">
        <strong>⚠ Packer's checklist:</strong>
        ☐ Items match order  ·  ☐ Bubble-wrap fragile pieces  ·  ☐ Include thank-you note  ·  ☐ Print 2 copies (one inside, one outside)
      </div>
      <div class="noprint" style="text-align:center; margin-top:18px;">
        <button onclick="window.print()" style="background:#c0552c; color:white; padding:10px 24px; border:none; border-radius:8px; font-weight:700; cursor:pointer;">🖨 Print</button>
      </div>
      <div class="foot">Tribal Mart · Authentic crafts of India · Generated ${date}</div>
    </body></html>`);
    win.document.close();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-badge-agency pending', icon: '⏳', text: 'Pending' },
      confirmed: { class: 'status-badge-agency confirmed', icon: '✓', text: 'Confirmed' },
      processing: { class: 'status-badge-agency processing', icon: '📦', text: 'Processing' },
      shipped: { class: 'status-badge-agency shipped', icon: '🚚', text: 'Shipped' },
      delivered: { class: 'status-badge-agency delivered', icon: '✅', text: 'Delivered' },
      cancelled: { class: 'status-badge-agency cancelled', icon: '✗', text: 'Cancelled' }
    };
    return badges[status] || badges.pending;
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <AgencySidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Orders Management</h1>
            <p>Manage and ship customer orders</p>
          </div>
          <div className="header-actions">
            <button className="header-btn">
              <span>🔔</span>
            </button>
            <div className="user-profile">
              <div className="profile-avatar agency">{user.name.charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">Agency</div>
              </div>
            </div>
          </div>
        </header>

        {/* Order Statistics */}
        {stats && (
          <div className="stats-grid-agency">
            <div className="stat-card-agency">
              <div className="stat-icon-agency">📋</div>
              <div className="stat-value-agency">{stats.total}</div>
              <div className="stat-label-agency">Total Orders</div>
            </div>
            <div className="stat-card-agency pending">
              <div className="stat-icon-agency">⏳</div>
              <div className="stat-value-agency">{stats.pending}</div>
              <div className="stat-label-agency">Pending</div>
            </div>
            <div className="stat-card-agency shipped">
              <div className="stat-icon-agency">🚚</div>
              <div className="stat-value-agency">{stats.shipped}</div>
              <div className="stat-label-agency">Shipped</div>
            </div>
            <div className="stat-card-agency delivered">
              <div className="stat-icon-agency">✅</div>
              <div className="stat-value-agency">{stats.delivered}</div>
              <div className="stat-label-agency">Delivered</div>
            </div>
            <div className="stat-card-agency revenue">
              <div className="stat-icon-agency">💰</div>
              <div className="stat-value-agency">₹{stats.totalRevenue.toLocaleString()}</div>
              <div className="stat-label-agency">Total Revenue</div>
            </div>
          </div>
        )}

        <section className="dashboard-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Orders Yet</h3>
              <p>You haven't received any orders yet.</p>
            </div>
          ) : (
            <div className="orders-table-agency">
              {orders.map((order) => (
                <div key={order._id} className="order-row-agency">
                  <div className="order-info-agency">
                    <h4>Order #{order.orderNumber}</h4>
                    <p className="customer-name">Customer: {order.customerName}</p>
                    <p className="order-date-agency">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  <div className="order-items-agency">
                    {order.items.filter(item => item.agencyName === user.name).map((item, index) => (
                      <div key={index} className="item-summary">
                        <strong>{item.productTitle}</strong>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-amount-agency">
                    <span className="amount-label">Amount</span>
                    <span className="amount-value">
                      ₹{order.items
                        .filter(item => item.agencyName === user.name)
                        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                        .toLocaleString()}
                    </span>
                  </div>

                  <div className={getStatusBadge(order.orderStatus).class}>
                    <span>{getStatusBadge(order.orderStatus).icon}</span>
                    {getStatusBadge(order.orderStatus).text}
                  </div>

                  <div className="order-actions-agency">
                    <button 
                      className="btn-view-agency"
                      onClick={() => handleViewOrder(order._id)}
                    >
                      View Details
                    </button>
                    {order.orderStatus === 'pending' && (
                      <button 
                        className="btn-confirm-agency"
                        onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                      >
                        Confirm
                      </button>
                    )}
                    {order.orderStatus === 'confirmed' && (
                      <button 
                        className="btn-process-agency"
                        onClick={() => handleUpdateStatus(order._id, 'processing')}
                      >
                        Process
                      </button>
                    )}
                    {order.orderStatus === 'processing' && (
                      <button 
                        className="btn-ship-agency"
                        onClick={() => handleUpdateStatus(order._id, 'shipped')}
                      >
                        Ship Now
                      </button>
                    )}
                    {order.orderStatus === 'shipped' && (
                      <button 
                        className="btn-deliver-agency"
                        onClick={() => handleUpdateStatus(order._id, 'delivered')}
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="modal-overlay-agency" onClick={() => setSelectedOrder(null)}>
            <div className="modal-content-agency" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-agency">
                <h2>Order #{selectedOrder.orderNumber}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => printPackingSlip(selectedOrder)}
                    style={{ background: 'var(--bg-soft)', border: '1.5px solid var(--border)', color: 'var(--fg)', padding: '0.5rem 1rem', borderRadius: 50, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    🖨 Packing slip
                  </button>
                  <button className="close-btn-agency" onClick={() => setSelectedOrder(null)}>✕</button>
                </div>
              </div>

              <div className="modal-body-agency">
                <div className="order-details-grid">
                  <div className="detail-section">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                    <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                    <p><strong>Phone:</strong> {selectedOrder.shippingAddress.phone}</p>
                  </div>

                  <div className="detail-section">
                    <h3>Shipping Address</h3>
                    <p>{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.addressLine1}</p>
                    {selectedOrder.shippingAddress.addressLine2 && (
                      <p>{selectedOrder.shippingAddress.addressLine2}</p>
                    )}
                    <p>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                    </p>
                  </div>
                </div>

                <div className="tracking-updates-section">
                  <h3>Tracking History</h3>
                  <div className="tracking-list">
                    {selectedOrder.trackingUpdates && selectedOrder.trackingUpdates.map((update, index) => (
                      <div key={index} className="tracking-update-item">
                        <div className="update-icon">●</div>
                        <div className="update-content">
                          <strong>{update.status}</strong>
                          <p>{update.message}</p>
                          <span className="update-time">
                            {new Date(update.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!['delivered', 'cancelled'].includes(selectedOrder.orderStatus) && (
                  <div className="add-tracking-section">
                    <h3>Add Tracking Update</h3>
                    <form onSubmit={handleAddTracking} className="tracking-form-agency">
                      <div className="form-group-agency">
                        <label>Status</label>
                        <input
                          type="text"
                          value={trackingForm.status}
                          onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                          placeholder="e.g., Out for Delivery"
                          required
                        />
                      </div>
                      <div className="form-group-agency">
                        <label>Message</label>
                        <textarea
                          value={trackingForm.message}
                          onChange={(e) => setTrackingForm({ ...trackingForm, message: e.target.value })}
                          placeholder="Provide tracking details..."
                          rows="3"
                          required
                        />
                      </div>
                      <button type="submit" className="btn-add-tracking">Add Update</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgencyOrders;

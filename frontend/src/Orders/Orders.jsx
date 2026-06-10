import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import CustomerSidebar from '../components/CustomerSidebar';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login/customer');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'customer') {
      navigate('/login/customer');
      return;
    }

    setUser(parsedUser);
    fetchOrders();

    // Check for order success message
    if (location.state?.orderSuccess) {
      setShowOrderSuccess(true);
      setOrderNumber(location.state.orderNumber);
      setTimeout(() => setShowOrderSuccess(false), 5000);
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await api.post(`/api/orders/${orderId}/cancel`, {
        reason: 'Cancelled by customer'
      });
      alert('Order cancelled successfully');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      alert('Failed to cancel order');
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const openInvoiceWindow = (order) => {
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    const itemsHtml = (order.items || []).map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>
          <strong>${it.productTitle || it.title || 'Item'}</strong>
          <div style="font-size:11px;color:#888">${it.agencyName || ''}</div>
        </td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">₹${Number(it.sellingPrice || it.price || 0).toLocaleString()}</td>
        <td style="text-align:right">₹${Number((it.sellingPrice || it.price || 0) * it.quantity).toLocaleString()}</td>
      </tr>
    `).join('');
    const addr = order.shippingAddress || {};
    const date = new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    win.document.write(`<!doctype html><html><head>
      <title>Invoice ${order.orderNumber || order._id}</title>
      <style>
        body { font-family: 'DM Sans', system-ui, sans-serif; color: #1a1410; padding: 36px; max-width: 760px; margin: 0 auto; background: #faf6f0; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2px solid #c0552c; padding-bottom: 18px; margin-bottom: 24px; }
        .brand { font-family: Georgia, serif; font-style: italic; font-weight: 700; font-size: 28px; color: #c0552c; }
        .brand small { display:block; font-style: normal; font-weight: 500; font-size: 12px; color: #5b4e44; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px;}
        .info { text-align: right; font-size: 13px; color: #5b4e44; }
        .info strong { color: #1a1410; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .block { background: #fff; padding: 14px 16px; border: 1px solid #d8ccba; border-radius: 12px; }
        .block h4 { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #5b4e44; }
        .block p { margin: 2px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #fff; border-radius: 12px; overflow: hidden; }
        thead { background: #1a1410; color: #fff; }
        th { padding: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; text-align: left; }
        td { padding: 10px; font-size: 13px; border-bottom: 1px solid #ebe0cd; vertical-align: top; }
        .totals { display: flex; justify-content: flex-end; }
        .totals table { width: 320px; }
        .totals td { border: none; padding: 6px 10px; }
        .totals .grand { background: #c0552c; color: white; font-weight: 700; font-size: 16px; }
        .foot { margin-top: 32px; padding-top: 16px; border-top: 1px solid #d8ccba; font-size: 11px; color: #8c7d70; text-align: center; }
        @media print { body { background: white; } .noprint { display:none; } }
      </style></head><body>
      <div class="head">
        <div class="brand">Tribal Mart<small>Tax Invoice</small></div>
        <div class="info">
          <div><strong>Invoice #</strong> ${order.orderNumber || order._id?.slice(-8).toUpperCase()}</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Status:</strong> ${order.orderStatus || 'pending'}</div>
        </div>
      </div>
      <div class="grid">
        <div class="block">
          <h4>Billed to</h4>
          <p><strong>${addr.fullName || order.customerName || ''}</strong></p>
          <p>${addr.phone || ''}</p>
          <p>${addr.addressLine1 || ''}</p>
          ${addr.addressLine2 ? `<p>${addr.addressLine2}</p>` : ''}
          <p>${addr.city || ''}, ${addr.state || ''} – ${addr.pincode || ''}</p>
        </div>
        <div class="block">
          <h4>Payment</h4>
          <p><strong>Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
          ${order.paymentStatus ? `<p><strong>Status:</strong> ${order.paymentStatus}</p>` : ''}
          ${order.razorpayPaymentId ? `<p><strong>Razorpay:</strong> ${order.razorpayPaymentId}</p>` : ''}
        </div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="totals">
        <table>
          <tr><td>Subtotal</td><td style="text-align:right">₹${Number(order.totalAmount || 0).toLocaleString()}</td></tr>
          <tr><td>Shipping</td><td style="text-align:right">Free</td></tr>
          <tr class="grand"><td>Total</td><td style="text-align:right">₹${Number(order.totalAmount || 0).toLocaleString()}</td></tr>
        </table>
      </div>
      <div class="noprint" style="text-align:center; margin-top: 24px;">
        <button onclick="window.print()" style="background:#c0552c; color:white; padding:10px 26px; border:none; border-radius:8px; font-weight:700; cursor:pointer;">🖨 Print / Save as PDF</button>
      </div>
      <div class="foot">
        Tribal Mart · Authentic crafts from India's tribal communities · hello@tribalmart.in<br/>
        Thank you for supporting traditional artisans.
      </div>
    </body></html>`);
    win.document.close();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-badge-order pending', icon: '⏳', text: 'Pending' },
      confirmed: { class: 'status-badge-order confirmed', icon: '✓', text: 'Confirmed' },
      processing: { class: 'status-badge-order processing', icon: '📦', text: 'Processing' },
      shipped: { class: 'status-badge-order shipped', icon: '🚚', text: 'Shipped' },
      delivered: { class: 'status-badge-order delivered', icon: '✅', text: 'Delivered' },
      cancelled: { class: 'status-badge-order cancelled', icon: '✗', text: 'Cancelled' }
    };
    return badges[status] || badges.pending;
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <CustomerSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>My Orders</h1>
            <p>Track and manage your orders</p>
          </div>
          <div className="header-actions">
            <button className="header-btn">
              <span>🔔</span>
            </button>
            <div className="user-profile">
              <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">Customer</div>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-section">
          {showOrderSuccess && (
            <div className="order-success-banner">
              <span className="success-icon">✅</span>
              <div>
                <strong>Order Placed Successfully!</strong>
                <p>Order Number: {orderNumber}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state placeholder-page">
              <div className="empty-icon">📋</div>
              <h3>No Orders Yet</h3>
              <p>You haven't placed any orders yet.</p>
              <button 
                className="cta-btn"
                onClick={() => navigate('/browse-products')}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.orderNumber}</h3>
                      <p className="order-date">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className={getStatusBadge(order.orderStatus).class}>
                      <span>{getStatusBadge(order.orderStatus).icon}</span>
                      {getStatusBadge(order.orderStatus).text}
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-image">
                          {item.productImage ? (
                            <img src={getImageUrl(item.productImage)} alt={item.productTitle} />
                          ) : (
                            <div className="no-image">📦</div>
                          )}
                        </div>
                        <div className="item-details">
                          <h4>{item.productTitle}</h4>
                          <p>Sold by: {item.agencyName}</p>
                          <p>Quantity: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary">
                    <div className="summary-row">
                      <span>Total Amount</span>
                      <span className="amount">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="summary-row savings">
                      <span>You Saved</span>
                      <span>₹{order.totalSavings.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Payment Method</span>
                      <span>
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        {order.paymentStatus ? ` • ${order.paymentStatus}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="order-actions">
                    <button 
                      className="btn-view-order"
                      onClick={() => handleViewOrder(order._id)}
                    >
                      View Details & Tracking
                    </button>
                    {!['delivered', 'cancelled'].includes(order.orderStatus) && (
                      <button 
                        className="btn-cancel-order"
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        Cancel Order
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
          <div className="modal-overlay-order" onClick={() => setSelectedOrder(null)}>
            <div className="modal-content-order" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-order">
                <h2>Order Details</h2>
                <button className="close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>

              <div className="modal-body-order">
                <div className="order-info-section">
                  <h3>Order Information</h3>
                  <p><strong>Order Number:</strong> {selectedOrder.orderNumber}</p>
                  <p><strong>Placed:</strong> {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Status:</strong>
                    <span className={getStatusBadge(selectedOrder.orderStatus).class} style={{ marginLeft: 6 }}>
                      {getStatusBadge(selectedOrder.orderStatus).icon} {getStatusBadge(selectedOrder.orderStatus).text}
                    </span>
                  </p>
                  <p><strong>Payment:</strong> {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}{selectedOrder.paymentStatus ? ` (${selectedOrder.paymentStatus})` : ''}</p>
                  <p><strong>Total Amount:</strong> ₹{selectedOrder.totalAmount.toLocaleString()}</p>
                </div>

                {/* Items in this order */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="order-info-section">
                    <h3>Items ({selectedOrder.items.length})</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {selectedOrder.items.map((it, i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'var(--bg-soft)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--fg)', fontSize: '0.92rem' }}>
                              {it.productTitle || it.title || 'Item'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--fg-mid)' }}>
                              {it.agencyName ? `${it.agencyName} · ` : ''}Qty {it.quantity}
                            </div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
                            ₹{Number((it.sellingPrice || it.price || 0) * it.quantity).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="shipping-address-section">
                  <h3>Shipping Address</h3>
                  <p>{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.phone}</p>
                  <p>{selectedOrder.shippingAddress.addressLine1}</p>
                  {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                </div>

                <div className="tracking-section">
                  <h3>Order Tracking</h3>
                  <div className="tracking-timeline">
                    {selectedOrder.trackingUpdates && selectedOrder.trackingUpdates.map((update, index) => (
                      <div key={index} className="tracking-item">
                        <div className="tracking-icon">●</div>
                        <div className="tracking-content">
                          <strong>{update.status}</strong>
                          <p>{update.message}</p>
                          <span className="tracking-time">
                            {new Date(update.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reorder + Invoice actions */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-soft)' }}>
                  <button
                    onClick={async () => {
                      // Add every item from this order to cart
                      try {
                        for (const it of (selectedOrder.items || [])) {
                          if (it.product || it.productId) {
                            await api.post('/api/customer/cart', {
                              productId: (it.product?._id || it.product || it.productId),
                              quantity: it.quantity || 1,
                            }).catch(() => null);
                          }
                        }
                        setSelectedOrder(null);
                        navigate('/cart');
                      } catch (_) {}
                    }}
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                      color: 'white', border: 'none', borderRadius: 11,
                      padding: '0.75rem 1.4rem',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
                      cursor: 'pointer', boxShadow: '0 4px 14px rgba(192,85,44,0.3)',
                    }}
                  >
                    🔄 Reorder all items
                  </button>
                  <button
                    onClick={() => openInvoiceWindow(selectedOrder)}
                    style={{
                      background: 'var(--bg-white)', color: 'var(--fg)',
                      border: '1.5px solid var(--border)', borderRadius: 11,
                      padding: '0.75rem 1.4rem',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    🧾 Download invoice
                  </button>
                  {!['delivered', 'cancelled'].includes(selectedOrder.orderStatus) && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder._id)}
                      style={{
                        background: 'var(--bg-white)', color: 'var(--danger)',
                        border: '1.5px solid var(--border)', borderRadius: 11,
                        padding: '0.75rem 1.4rem',
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Cancel order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;

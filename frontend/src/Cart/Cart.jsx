import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import CustomerSidebar from '../components/CustomerSidebar';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/customer'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'customer') { navigate('/login/customer'); return; }
    setUser(parsed);
    loadCart();
  }, [navigate]);

  const loadCart = async () => {
    try {
      const res = await api.get('/api/customer/cart');
      setCart(res.data);
    } catch (e) {
      console.error('Cart load', e);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (productId, quantity) => {
    if (quantity < 1) return;
    setBusy(productId);
    try {
      await api.put(`/api/customer/cart/${productId}`, { quantity });
      await loadCart();
    } catch (e) {
      console.error('Update qty', e);
    } finally {
      setBusy(null);
    }
  };

  const removeItem = async (productId) => {
    setBusy(productId);
    try {
      await api.delete(`/api/customer/cart/${productId}`);
      await loadCart();
    } catch (e) {
      console.error('Remove item', e);
    } finally {
      setBusy(null);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Clear all items from cart?')) return;
    try {
      await api.delete('/api/customer/cart');
      await loadCart();
    } catch (e) {
      console.error('Clear cart', e);
    }
  };

  const proceedToCheckout = () => {
    if (!cart?.items?.length) return;
    const items = cart.items
      .filter((it) => it.product)
      .map((it) => ({ product: it.product, quantity: it.quantity }));
    navigate('/checkout', { state: { items } });
  };

  if (!user) return null;
  const items = cart?.items?.filter((it) => it.product) || [];

  return (
    <div className="dashboard-container cust-dash">
      <CustomerSidebar />

      <main className="dashboard-main">
        <motion.section
          className="cust-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">YOUR CART · {items.length} item{items.length !== 1 ? 's' : ''}</span>
            <h1>Your <em>cart.</em></h1>
            <p>Review your handpicked craft, adjust quantities, and checkout when ready.</p>
          </div>
          <div className="cust-hero-profile">
            <div className="cust-profile">
              <div className="cust-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="cust-profile-name">{user.name}</div>
                <div className="cust-profile-role">Customer · Cart</div>
              </div>
            </div>
          </div>
        </motion.section>

        {loading ? (
          <div className="cust-section">
            <div className="cust-empty-mini"><span>🛒</span><p>Loading cart…</p></div>
          </div>
        ) : items.length === 0 ? (
          <section className="cust-section">
            <div className="cust-empty">
              <div className="cust-empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Discover handcrafted tribal pieces and add them to your cart.</p>
              <button className="cust-btn-primary" onClick={() => navigate('/browse-products')}>
                Browse crafts <span>→</span>
              </button>
            </div>
          </section>
        ) : (
          <div className="cart-grid">
            <section className="cust-section cart-items">
              <div className="cust-section-head">
                <div>
                  <span className="cust-section-tag">Items</span>
                  <h2>In your <em>cart</em></h2>
                </div>
                <button className="view-all-btn" onClick={clearCart}>Clear cart →</button>
              </div>

              <ul className="cart-list">
                {items.map((it) => {
                  const p = it.product;
                  const lineTotal = (p.sellingPrice || 0) * it.quantity;
                  const isBusy = busy === p._id;
                  return (
                    <li key={p._id} className={`cart-row ${isBusy ? 'is-busy' : ''}`}>
                      <div className="cart-thumb">
                        {p.images && p.images[0]
                          ? <img
                              src={getImageUrl(p.images[0])}
                              alt={p.title}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement.innerHTML = '<span>🎨</span>';
                              }}
                            />
                          : <span>🎨</span>}
                      </div>
                      <div className="cart-meta">
                        <div className="cart-cat">{p.category}</div>
                        <h4 onClick={() => navigate(`/product/${p._id}`)}>{p.title}</h4>
                        <p className="cart-agency">{p.agencyName}</p>
                      </div>
                      <div className="cart-qty">
                        <button onClick={() => updateQty(p._id, it.quantity - 1)} disabled={it.quantity <= 1 || isBusy} aria-label="Decrease">−</button>
                        <span>{it.quantity}</span>
                        <button onClick={() => updateQty(p._id, it.quantity + 1)} disabled={isBusy} aria-label="Increase">+</button>
                      </div>
                      <div className="cart-price-col">
                        <div className="cart-price">₹{lineTotal.toLocaleString()}</div>
                        <div className="cart-each">₹{Number(p.sellingPrice).toLocaleString()} each</div>
                      </div>
                      <button className="cart-remove" onClick={() => removeItem(p._id)} disabled={isBusy} aria-label="Remove">×</button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <aside className="cust-section cart-summary">
              <div className="cust-section-head">
                <div>
                  <span className="cust-section-tag">Summary</span>
                  <h2>Order <em>total</em></h2>
                </div>
              </div>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₹{Number(cart?.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="cart-summary-row">
                <span>Items</span>
                <span>{items.reduce((s, it) => s + it.quantity, 0)}</span>
              </div>
              <div className="cart-summary-row savings">
                <span>You save</span>
                <span>−₹{Number(cart?.totalSavings || 0).toLocaleString()}</span>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-row cart-total-row">
                <span>Total</span>
                <span>₹{Number(cart?.totalAmount || 0).toLocaleString()}</span>
              </div>

              <button className="cust-btn-primary cart-checkout-btn" onClick={proceedToCheckout}>
                Proceed to checkout <span>→</span>
              </button>

              <button className="cart-continue-btn" onClick={() => navigate('/browse-products')}>
                ← Continue shopping
              </button>

              <div className="cart-trust">
                <div>🛡️ Verified tribal cooperatives</div>
                <div>📦 Insured shipping</div>
                <div>↩️ 7-day return policy</div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;

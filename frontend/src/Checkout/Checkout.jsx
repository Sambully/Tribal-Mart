import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import CustomerSidebar from '../components/CustomerSidebar';
import './Checkout.css';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Two entry points:
  //  1. Single product (Buy Now from product detail): location.state.product
  //  2. Cart (Proceed to Checkout): location.state.items = [{ product, quantity }, ...]
  const passedProduct = location.state?.product;
  const passedItems = location.state?.items;
  const isMultiItem = Array.isArray(passedItems) && passedItems.length > 0;

  const lineItems = isMultiItem
    ? passedItems
    : (passedProduct ? [{ product: passedProduct, quantity: 1 }] : []);

  const subtotal = lineItems.reduce((s, it) => s + (it.product?.sellingPrice || 0) * it.quantity, 0);
  const savings  = lineItems.reduce((s, it) => s + ((it.product?.originalPrice || 0) - (it.product?.sellingPrice || 0)) * it.quantity, 0);

  // Back-compat: existing render code uses `product` and `quantity`.
  const product = lineItems[0]?.product || null;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(lineItems[0]?.quantity || 1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });

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

    // Pre-fill name with user's name
    setShippingAddress(prev => ({ ...prev, fullName: parsedUser.name }));

    // Load saved addresses; auto-select the default if any
    api.get('/api/profile/addresses')
      .then((res) => {
        const list = res.data || [];
        setSavedAddresses(list);
        const defaultAddr = list.find(a => a.isDefault) || list[0];
        if (defaultAddr) {
          setSelectedAddrId(defaultAddr._id);
          setShippingAddress({
            fullName:     defaultAddr.fullName,
            phone:        defaultAddr.phone,
            addressLine1: defaultAddr.addressLine1,
            addressLine2: defaultAddr.addressLine2 || '',
            city:         defaultAddr.city,
            state:        defaultAddr.state,
            pincode:      defaultAddr.pincode,
          });
        }
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (!product) {
      navigate('/cart');
    }
  }, [product, navigate]);

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate address
    if (!shippingAddress.fullName || !shippingAddress.phone || 
        !shippingAddress.addressLine1 || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.pincode) {
      setError('Please fill all required address fields');
      setLoading(false);
      return;
    }

    // Validate phone
    if (!/^\d{10}$/.test(shippingAddress.phone)) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    // Validate pincode
    if (!/^\d{6}$/.test(shippingAddress.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      setLoading(false);
      return;
    }

    try {
      // Build orderItems from cart OR single-product flow
      const orderItems = isMultiItem
        ? lineItems.map((it) => ({ productId: it.product._id, quantity: it.quantity }))
        : [{ productId: product._id, quantity }];

      if (paymentMethod === 'online') {
        const sessionResponse = await api.post('/api/orders/create-online-payment-order', {
          items: orderItems,
          shippingAddress
        });

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError('Unable to load the payment gateway. Please try again.');
          setLoading(false);
          return;
        }

        const { keyId, orderId, amount, currency } = sessionResponse.data;

        const options = {
          key: keyId,
          amount,
          currency,
          name: 'Tribal Mart',
          description: `Payment for ${product.title}`,
          order_id: orderId,
          handler: async (response) => {
            try {
              const confirmResponse = await api.post('/api/orders/confirm-online-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              navigate('/orders', {
                state: {
                  orderSuccess: true,
                  orderNumber: confirmResponse.data.order.orderNumber
                }
              });
            } catch (confirmError) {
              setError(confirmError.response?.data?.message || 'Payment was successful but order confirmation failed');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: shippingAddress.fullName,
            email: user.email,
            contact: shippingAddress.phone
          },
          notes: {
            productTitle: product.title,
            agencyName: product.agencyName
          },
          theme: {
            color: '#1e88e5'
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        return;
      }

      const orderData = {
        items: orderItems,
        shippingAddress,
        paymentMethod
      };

      const response = await api.post('/api/orders', orderData);

      // Clear cart after a successful multi-item order (so it doesn't linger)
      if (isMultiItem) {
        try { await api.delete('/api/customer/cart'); } catch (_) {}
      }

      navigate('/orders', {
        state: {
          orderSuccess: true,
          orderNumber: response.data.order?.orderNumber
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      console.error('Place order error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user || !product) return null;

  // Totals: for multi-item use the cart computation; single-item uses quantity input
  const totalAmount  = isMultiItem ? subtotal : product.sellingPrice * quantity;
  const totalSavings = isMultiItem ? savings  : (product.originalPrice - product.sellingPrice) * quantity;

  return (
    <div className="dashboard-container">
      <CustomerSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Checkout</h1>
            <p>Complete your order</p>
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

        <div className="checkout-container">
          <div className="checkout-main">
            <section className="shipping-section">
              <h2>Shipping Address</h2>
              {error && <div className="error-message-checkout">{error}</div>}

              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--fg)' }}>Saved addresses</strong>
                    <button type="button" onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                      Manage →
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
                    {savedAddresses.map((a) => (
                      <label
                        key={a._id}
                        style={{
                          background: selectedAddrId === a._id ? 'rgba(192,85,44,0.06)' : 'var(--bg-soft)',
                          border: `1.5px solid ${selectedAddrId === a._id ? 'var(--accent)' : 'var(--border-soft)'}`,
                          borderRadius: 12,
                          padding: '0.8rem 0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="savedAddr"
                          value={a._id}
                          checked={selectedAddrId === a._id}
                          onChange={() => {
                            setSelectedAddrId(a._id);
                            setShippingAddress({
                              fullName:     a.fullName,
                              phone:        a.phone,
                              addressLine1: a.addressLine1,
                              addressLine2: a.addressLine2 || '',
                              city:         a.city,
                              state:        a.state,
                              pincode:      a.pincode,
                            });
                          }}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent-dark)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {a.label || 'Address'} {a.isDefault ? '· DEFAULT' : ''}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{a.fullName}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--fg-mid)' }}>
                          {a.addressLine1}, {a.city}, {a.state} – {a.pincode}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="shipping-form">
                <div className="form-row-checkout">
                  <div className="form-group-checkout">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={shippingAddress.fullName}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>

                  <div className="form-group-checkout">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleAddressChange}
                      placeholder="10-digit number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group-checkout">
                  <label>Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleAddressChange}
                    placeholder="House No., Building Name"
                    required
                  />
                </div>

                <div className="form-group-checkout">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleAddressChange}
                    placeholder="Road Name, Area, Colony (Optional)"
                  />
                </div>

                <div className="form-row-checkout">
                  <div className="form-group-checkout">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>

                  <div className="form-group-checkout">
                    <label>State *</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>

                  <div className="form-group-checkout">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={shippingAddress.pincode}
                      onChange={handleAddressChange}
                      placeholder="6-digit code"
                      required
                    />
                  </div>
                </div>

                <div className="payment-section">
                  <h3>Payment Method</h3>
                  <div className="payment-options-grid">
                    <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`} htmlFor="cod">
                      <input
                        type="radio"
                        id="cod"
                        name="payment"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                      />
                      <span className="payment-icon">💵</span>
                      <div>
                        <strong>Cash on Delivery (COD)</strong>
                        <p>Pay when you receive the product</p>
                      </div>
                    </label>

                    <label className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`} htmlFor="online">
                      <input
                        type="radio"
                        id="online"
                        name="payment"
                        checked={paymentMethod === 'online'}
                        onChange={() => setPaymentMethod('online')}
                      />
                      <span className="payment-icon">💳</span>
                      <div>
                        <strong>Secure Online Payment</strong>
                        <p>Pay by card, UPI, or net banking through Razorpay</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="place-order-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : paymentMethod === 'online' ? 'Pay Securely' : 'Place Order'}
                </button>
              </form>
            </section>
          </div>

          <div className="order-summary">
            <h2>Order Summary {isMultiItem ? `· ${lineItems.length} items` : ''}</h2>

            {/* Multi-item cart view */}
            {isMultiItem ? (
              <div className="summary-multi-list">
                {lineItems.map((it) => (
                  <div key={it.product._id} className="summary-multi-row">
                    <div className="summary-product-image" style={{ width: 56, height: 56 }}>
                      {it.product.images && it.product.images[0] ? (
                        <img src={getImageUrl(it.product.images[0])} alt={it.product.title} />
                      ) : (
                        <div className="no-image">🎨</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--fg)', fontSize: '0.92rem' }}>
                        {it.product.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--fg-mid)' }}>
                        {it.product.agencyName} · Qty {it.quantity}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
                      ₹{(it.product.sellingPrice * it.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="summary-product">
                  <div className="summary-product-image">
                    {product.images && product.images.length > 0 ? (
                      <img src={getImageUrl(product.images[0])} alt={product.title} />
                    ) : (
                      <div className="no-image">📦</div>
                    )}
                  </div>
                  <div className="summary-product-info">
                    <h4>{product.title}</h4>
                    <p className="summary-agency">Sold by: {product.agencyName}</p>
                  </div>
                </div>

                <div className="quantity-selector">
                  <label>Quantity</label>
                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      disabled={quantity >= product.quantity}
                    >
                      +
                    </button>
                  </div>
                  <span className="stock-info">Max: {product.quantity}</span>
                </div>
              </>
            )}

            <div className="summary-pricing">
              <div className="price-row">
                <span>Subtotal</span>
                <span>₹{(totalAmount + totalSavings).toLocaleString()}</span>
              </div>
              <div className="price-row discount">
                <span>Discount</span>
                <span>- ₹{totalSavings.toLocaleString()}</span>
              </div>
              <div className="price-row total">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="savings-badge-checkout">
              🎉 You save ₹{totalSavings.toLocaleString()}!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;

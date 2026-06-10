import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { useToast } from '../components/Toast';
import './AdminProducts.css';

const PendingProducts = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const toggleSelected = (id) => {
    setSelectedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map(p => p._id)));
  };
  const bulkApprove = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Approve ${selectedIds.size} product(s)?`)) return;
    setBulkBusy(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      try { await api.put(`/api/admin/products/${id}/status`, { status: 'approved' }); ok++; }
      catch { fail++; }
    }
    setSelectedIds(new Set());
    setBulkBusy(false);
    toast.success(`Approved ${ok}${fail ? ` · ${fail} failed` : ''}`);
    fetchPendingProducts();
  };

  const bulkReject = async () => {
    if (selectedIds.size === 0) return;
    const reason = window.prompt(`Reject ${selectedIds.size} product(s)? Enter a reason that will be sent to each agency:`);
    if (reason === null) return;
    setBulkBusy(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      try { await api.put(`/api/admin/products/${id}/status`, { status: 'rejected', rejectionReason: reason || 'Did not meet platform guidelines' }); ok++; }
      catch { fail++; }
    }
    setSelectedIds(new Set());
    setBulkBusy(false);
    toast.success(`Rejected ${ok}${fail ? ` · ${fail} failed` : ''}`);
    fetchPendingProducts();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login/admin');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/login/admin');
      return;
    }

    setUser(parsedUser);
    fetchPendingProducts();
  }, [navigate]);

  const fetchPendingProducts = async () => {
    try {
      const response = await api.get('/api/admin/pending-products');
      const productList = response.data.products || [];
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching pending products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    if (!window.confirm('Are you sure you want to approve this product?')) {
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/api/admin/products/${productId}/status`, { status: 'approved' });
      alert('Product approved successfully!');
      fetchPendingProducts();
      setSelectedProduct(null);
    } catch (error) {
      alert('Failed to approve product');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (productId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/api/admin/products/${productId}/status`, { 
        status: 'rejected',
        rejectionReason 
      });
      alert('Product rejected');
      fetchPendingProducts();
      setSelectedProduct(null);
      setRejectionReason('');
    } catch (error) {
      alert('Failed to reject product');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <AdminSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Pending Product Approvals</h1>
            <p>Review and approve agency product listings</p>
          </div>
          <div className="header-actions">
            <button className="header-btn">
              <span>🔔</span>
            </button>
            <div className="user-profile">
              <div className="profile-avatar admin">{user.name.charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">Admin</div>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-section">
          {!loading && products.length > 0 && (
            <div className="bulk-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 12, marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--fg)' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === products.length}
                  onChange={toggleSelectAll}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
                {selectedIds.size === 0 ? 'Select all' : `${selectedIds.size} selected`}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={bulkReject}
                  disabled={selectedIds.size === 0 || bulkBusy}
                  style={{
                    background: 'var(--bg-white)', color: 'var(--danger)',
                    border: '1.5px solid var(--border)', borderRadius: 10,
                    padding: '0.6rem 1.25rem',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem',
                    cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedIds.size === 0 ? 0.5 : 1,
                  }}
                >
                  ✕ Bulk reject
                </button>
                <button
                  onClick={bulkApprove}
                  disabled={selectedIds.size === 0 || bulkBusy}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                    color: 'white', border: 'none', borderRadius: 10,
                    padding: '0.6rem 1.25rem',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem',
                    cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedIds.size === 0 ? 0.5 : 1,
                    boxShadow: '0 4px 12px rgba(192,85,44,0.3)',
                  }}
                >
                  {bulkBusy ? 'Working…' : `✓ Bulk approve (${selectedIds.size})`}
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading pending products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product._id} className="product-approval-card" style={{ position: 'relative' }}>
                  <label style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '0.3rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product._id)}
                      onChange={() => toggleSelected(product._id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                  </label>
                  <div className="product-image-section">
                    {product.images && product.images.length > 0 && (
                      <img src={getImageUrl(product.images[0])} alt={product.title} />
                    )}
                  </div>
                  <div className="product-details-section">
                    <h3>{product.title}</h3>
                    <p className="product-category">{product.category}</p>
                    <div className="product-pricing">
                      <div className="price-row">
                        <span className="label">Original Price:</span>
                        <span className="value">₹{product.originalPrice.toLocaleString()}</span>
                      </div>
                      <div className="price-row">
                        <span className="label">Selling Price:</span>
                        <span className="value selling">₹{product.sellingPrice.toLocaleString()}</span>
                      </div>
                      <div className="price-row">
                        <span className="label">Discount:</span>
                        <span className="value discount">
                          {Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100)}% OFF
                        </span>
                      </div>
                    </div>
                    <div className="product-info">
                      <p><strong>Agency:</strong> {product.agencyName}</p>
                      <p><strong>Quantity:</strong> {product.quantity}</p>
                      <p><strong>Condition:</strong> {product.condition}</p>
                      <p><strong>Location:</strong> {product.location}</p>
                    </div>
                    <div className="product-description">
                      <strong>Description:</strong>
                      <p>{product.description}</p>
                    </div>
                    
                    {selectedProduct === product._id ? (
                      <div className="rejection-form">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter reason for rejection..."
                          rows="3"
                        />
                        <div className="form-actions">
                          <button 
                            className="cancel-btn"
                            onClick={() => {
                              setSelectedProduct(null);
                              setRejectionReason('');
                            }}
                            disabled={processing}
                          >
                            Cancel
                          </button>
                          <button 
                            className="confirm-reject-btn"
                            onClick={() => handleReject(product._id)}
                            disabled={processing || !rejectionReason.trim()}
                          >
                            {processing ? 'Rejecting...' : 'Confirm Rejection'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="product-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApprove(product._id)}
                          disabled={processing}
                        >
                          ✓ Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => setSelectedProduct(product._id)}
                          disabled={processing}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>No pending approvals</h3>
              <p>All products have been reviewed</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PendingProducts;

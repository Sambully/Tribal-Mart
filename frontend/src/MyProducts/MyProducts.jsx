import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import AgencySidebar from '../components/AgencySidebar';
import '../Dashboard/Dashboard.css';
import './MyProducts.css';

const MyProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [filter, products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products/my-products');
      setProducts(response.data);
      setFilteredProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch products error:', error);
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts();
      alert('Product deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#f59e0b', bg: '#fef3c7', text: 'Pending Approval' },
      approved: { color: '#10b981', bg: '#d1fae5', text: 'Approved' },
      rejected: { color: '#ef4444', bg: '#fee2e2', text: 'Rejected' },
      sold: { color: '#6366f1', bg: '#e0e7ff', text: 'Sold' }
    };
    const badge = badges[status];
    return (
      <span 
        className="status-badge"
        style={{ color: badge.color, background: badge.bg }}
      >
        {badge.text}
      </span>
    );
  };

  const stats = {
    total: products.length,
    pending: products.filter(p => p.status === 'pending').length,
    approved: products.filter(p => p.status === 'approved').length,
    sold: products.filter(p => p.status === 'sold').length
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <AgencySidebar />
        <main className="dashboard-main">
          <div className="loading-spinner" style={{ padding: '3rem', textAlign: 'center', color: 'var(--fg-mid)' }}>Loading products…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <AgencySidebar />
      <main className="dashboard-main">
        <div className="my-products-container" style={{ padding: 0 }}>

        <div className="products-header">
          <div>
            <h1>My Products</h1>
            <p>Manage your listed products and track their status</p>
          </div>
          <button className="add-new-btn" onClick={() => navigate('/add-product')}>
            ➕ Add New Product
          </button>
        </div>

        {/* Stats */}
        <div className="products-stats">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Products</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{color: '#f59e0b'}}>{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{color: '#10b981'}}>{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{color: '#6366f1'}}>{stats.sold}</div>
            <div className="stat-label">Sold</div>
          </div>
        </div>

        {/* Filters */}
        <div className="products-filters">
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({products.length})
            </button>
            <button 
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending ({stats.pending})
            </button>
            <button 
              className={filter === 'approved' ? 'active' : ''}
              onClick={() => setFilter('approved')}
            >
              Approved ({stats.approved})
            </button>
            <button 
              className={filter === 'sold' ? 'active' : ''}
              onClick={() => setFilter('sold')}
            >
              Sold ({stats.sold})
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">📦</div>
            <h3>No products found</h3>
            <p>
              {filter === 'all' 
                ? 'Start by adding your first product' 
                : `No ${filter} products at the moment`}
            </p>
            <button className="cta-btn-products" onClick={() => navigate('/add-product')}>
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product._id} className="product-item">
                <div className="product-image-section">
                  {product.images && product.images.length > 0 ? (
                    <img src={getImageUrl(product.images[0])} alt={product.title} />
                  ) : (
                    <div className="placeholder-image">
                      {product.category === 'Electronics' && '📱'}
                      {product.category === 'Furniture' && '🏠'}
                      {product.category === 'Clothing' && '👕'}
                      {product.category === 'Appliances' && '🔌'}
                      {product.category === 'Toys' && '🧸'}
                      {product.category === 'Vehicles' && '🚗'}
                      {product.category === 'Others' && '📦'}
                    </div>
                  )}
                  <div className="product-category">{product.category}</div>
                </div>

                <div className="product-details">
                  <div className="product-title-row">
                    <h3>{product.title}</h3>
                    {getStatusBadge(product.status)}
                  </div>

                  <p className="product-description">
                    {product.description.substring(0, 100)}
                    {product.description.length > 100 && '...'}
                  </p>

                  <div className="product-info-grid">
                    <div className="info-item">
                      <span className="info-label">Condition</span>
                      <span className="info-value">{product.condition}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Quantity</span>
                      <span className="info-value">
                        {product.quantity}
                        {product.quantity > 0 && product.quantity <= 3 && (
                          <span style={{ marginLeft: 6, background: 'rgba(192,138,44,0.15)', color: 'var(--warning)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.65rem', padding: '0.18rem 0.5rem', borderRadius: 50, letterSpacing: '0.08em', textTransform: 'uppercase', verticalAlign: 'middle' }}>
                            ⚠ Low stock
                          </span>
                        )}
                        {product.quantity === 0 && (
                          <span style={{ marginLeft: 6, background: 'rgba(168,59,31,0.15)', color: 'var(--danger)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.65rem', padding: '0.18rem 0.5rem', borderRadius: 50, letterSpacing: '0.08em', textTransform: 'uppercase', verticalAlign: 'middle' }}>
                            Out of stock
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Views</span>
                      <span className="info-value">{product.views}</span>
                    </div>
                  </div>

                  <div className="product-pricing">
                    <div className="price-row">
                      <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                      <span className="selling-price">₹{product.sellingPrice.toLocaleString()}</span>
                    </div>
                    <div className="discount">
                      {((1 - product.sellingPrice / product.originalPrice) * 100).toFixed(0)}% OFF
                    </div>
                  </div>

                  {product.rejectionReason && (
                    <div className="rejection-reason">
                      <strong>Rejection Reason:</strong> {product.rejectionReason}
                    </div>
                  )}

                  <div className="product-actions">
                    <button className="btn-view" onClick={() => navigate(`/product/${product._id}`)} title="See your listing the way a customer does">👁 Preview</button>
                    {product.status !== 'sold' && product.status !== 'approved' && (
                      <button
                        className="btn-view"
                        style={{ background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }}
                        onClick={() => navigate(`/edit-product/${product._id}`)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className="btn-view"
                      title="Clone this product as a new draft"
                      onClick={async () => {
                        try {
                          const res = await api.post(`/api/products/${product._id}/duplicate`);
                          await fetchProducts();
                          navigate(`/edit-product/${res.data._id}`);
                        } catch (e) {
                          alert(e.response?.data?.message || 'Failed to duplicate');
                        }
                      }}
                    >
                      📑 Duplicate
                    </button>
                    {product.status !== 'sold' && (
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(product._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <div className="product-date">
                    Added: {new Date(product.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default MyProducts;
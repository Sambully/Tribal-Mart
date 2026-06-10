import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import './AdminProducts.css';

const AllProducts = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);

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
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/admin/all-products');
      const productList = response.data.products || [];
      setProducts(productList);
      calculateStats(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productList) => {
    setStats({
      total: productList.length,
      pending: productList.filter(p => p.status === 'pending').length,
      approved: productList.filter(p => p.status === 'approved').length,
      rejected: productList.filter(p => p.status === 'rejected').length,
      sold: productList.filter(p => p.status === 'sold').length
    });
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/admin/products/${productId}`);
      alert('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      alert('Failed to delete product');
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-badge pending', text: 'Pending', icon: '⏳' },
      approved: { class: 'status-badge approved', text: 'Approved', icon: '✓' },
      rejected: { class: 'status-badge rejected', text: 'Rejected', icon: '✗' },
      sold: { class: 'status-badge sold', text: 'Sold', icon: '💰' }
    };
    return badges[status] || badges.pending;
  };

  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'all' || product.status === filter;
    const matchesSearch = searchTerm === '' || 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.agencyName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <AdminSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>All Products</h1>
            <p>View and manage all products in the system</p>
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

        {/* Stats */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon admin">📦</div>
              <div className="stat-info">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Products</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon admin">⏳</div>
              <div className="stat-info">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon admin">✓</div>
              <div className="stat-info">
                <div className="stat-value">{stats.approved}</div>
                <div className="stat-label">Approved</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon admin">💰</div>
              <div className="stat-info">
                <div className="stat-value">{stats.sold}</div>
                <div className="stat-label">Sold</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="dashboard-section">
          <div className="filters-bar">
            <div className="filter-tabs">
              <button 
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All ({stats?.total || 0})
              </button>
              <button 
                className={filter === 'pending' ? 'active' : ''}
                onClick={() => setFilter('pending')}
              >
                Pending ({stats?.pending || 0})
              </button>
              <button 
                className={filter === 'approved' ? 'active' : ''}
                onClick={() => setFilter('approved')}
              >
                Approved ({stats?.approved || 0})
              </button>
              <button 
                className={filter === 'rejected' ? 'active' : ''}
                onClick={() => setFilter('rejected')}
              >
                Rejected ({stats?.rejected || 0})
              </button>
              <button 
                className={filter === 'sold' ? 'active' : ''}
                onClick={() => setFilter('sold')}
              >
                Sold ({stats?.sold || 0})
              </button>
            </div>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Agency</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-cell">
                          {product.images && product.images.length > 0 && (
                            <img src={getImageUrl(product.images[0])} alt={product.title} className="product-thumbnail" />
                          )}
                          <span>{product.title}</span>
                        </div>
                      </td>
                      <td>{product.agencyName}</td>
                      <td>{product.category}</td>
                      <td>₹{product.sellingPrice.toLocaleString()}</td>
                      <td>{product.quantity}</td>
                      <td>
                        <span className={getStatusBadge(product.status).class}>
                          {getStatusBadge(product.status).icon} {getStatusBadge(product.status).text}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/product/${product._id}`)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          {product.status === 'approved' && (
                            <button
                              className="view-btn"
                              onClick={async () => {
                                try {
                                  await api.put(`/api/admin/products/${product._id}/featured`);
                                  fetchProducts();
                                } catch (_) {}
                              }}
                              title={product.featured ? 'Remove from Featured' : 'Mark as Featured'}
                              style={{ background: product.featured ? 'var(--ochre)' : 'var(--bg-soft)', color: product.featured ? 'white' : 'var(--fg-mid)' }}
                            >
                              {product.featured ? '⭐' : '☆'}
                            </button>
                          )}
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteProduct(product._id)}
                            title="Delete Product"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No products found</h3>
              <p>{searchTerm ? 'Try adjusting your search' : 'No products match the selected filter'}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AllProducts;

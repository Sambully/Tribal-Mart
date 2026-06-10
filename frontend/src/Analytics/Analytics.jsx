import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import AgencySidebar from '../components/AgencySidebar';
import './Analytics.css';

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('30'); // days
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

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
    fetchAnalytics();
    fetchTopProducts();
    fetchRecentOrders();
  }, [navigate, timePeriod]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/api/products/analytics?period=${timePeriod}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await api.get('/api/products/top-products');
      setTopProducts(response.data);
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await api.get('/api/orders/agency-recent');
      setRecentOrders(response.data);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
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
      <AgencySidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Analytics Dashboard</h1>
            <p>Track your performance and insights</p>
          </div>
          <div className="header-actions">
            <div className="time-period-filter">
              <button 
                className={timePeriod === '7' ? 'active' : ''} 
                onClick={() => setTimePeriod('7')}
              >
                7 Days
              </button>
              <button 
                className={timePeriod === '30' ? 'active' : ''} 
                onClick={() => setTimePeriod('30')}
              >
                30 Days
              </button>
              <button 
                className={timePeriod === '90' ? 'active' : ''} 
                onClick={() => setTimePeriod('90')}
              >
                90 Days
              </button>
              <button 
                className={timePeriod === 'all' ? 'active' : ''} 
                onClick={() => setTimePeriod('all')}
              >
                All Time
              </button>
            </div>
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

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : analytics ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon agency">📦</div>
                <div className="stat-info">
                  <div className="stat-value">{analytics.overview.totalProducts}</div>
                  <div className="stat-label">Total Products</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon agency">✅</div>
                <div className="stat-info">
                  <div className="stat-value">{analytics.overview.approvedProducts}</div>
                  <div className="stat-label">Approved</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon agency">⏳</div>
                <div className="stat-info">
                  <div className="stat-value">{analytics.overview.pendingProducts}</div>
                  <div className="stat-label">Pending</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon agency">💰</div>
                <div className="stat-info">
                  <div className="stat-value">₹{analytics.overview.totalRevenue.toLocaleString()}</div>
                  <div className="stat-label">Total Revenue</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon agency">👁️</div>
                <div className="stat-info">
                  <div className="stat-value">{analytics.overview.totalViews}</div>
                  <div className="stat-label">Total Views</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon agency">🛒</div>
                <div className="stat-info">
                  <div className="stat-value">{analytics.overview.totalSales}</div>
                  <div className="stat-label">Total Sales</div>
                </div>
              </div>
            </div>

            <div className="analytics-row">
              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Performance Metrics</h2>
                </div>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <h4>Conversion Rate</h4>
                    <div className="metric-value">{analytics.overview.conversionRate}%</div>
                    <div className="metric-description">Views to sales ratio</div>
                  </div>
                  <div className="metric-card">
                    <h4>Avg Order Value</h4>
                    <div className="metric-value">₹{analytics.overview.avgOrderValue || 0}</div>
                    <div className="metric-description">Per transaction</div>
                  </div>
                  <div className="metric-card">
                    <h4>Approval Rate</h4>
                    <div className="metric-value">
                      {analytics.overview.totalProducts > 0 
                        ? ((analytics.overview.approvedProducts / analytics.overview.totalProducts) * 100).toFixed(0)
                        : 0}%
                    </div>
                    <div className="metric-description">Products approved</div>
                  </div>
                  <div className="metric-card">
                    <h4>Products Sold</h4>
                    <div className="metric-value">{analytics.overview.soldProducts}</div>
                    <div className="metric-description">Successfully sold</div>
                  </div>
                </div>
              </section>

              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Product Status</h2>
                </div>
                <div className="status-breakdown">
                  <div className="status-item approved">
                    <div className="status-bar" style={{width: `${(analytics.overview.approvedProducts / analytics.overview.totalProducts * 100) || 0}%`}}></div>
                    <div className="status-info">
                      <span className="status-label">✅ Approved</span>
                      <span className="status-count">{analytics.overview.approvedProducts}</span>
                    </div>
                  </div>
                  <div className="status-item pending">
                    <div className="status-bar" style={{width: `${(analytics.overview.pendingProducts / analytics.overview.totalProducts * 100) || 0}%`}}></div>
                    <div className="status-info">
                      <span className="status-label">⏳ Pending</span>
                      <span className="status-count">{analytics.overview.pendingProducts}</span>
                    </div>
                  </div>
                  <div className="status-item sold">
                    <div className="status-bar" style={{width: `${(analytics.overview.soldProducts / analytics.overview.totalProducts * 100) || 0}%`}}></div>
                    <div className="status-info">
                      <span className="status-label">💰 Sold</span>
                      <span className="status-count">{analytics.overview.soldProducts}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="analytics-row">
              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Top Products</h2>
                  <span className="section-subtitle">By views</span>
                </div>
                <div className="top-products-list">
                  {topProducts.length > 0 ? (
                    topProducts.slice(0, 5).map((product, index) => (
                      <div key={product._id} className="top-product-item">
                        <div className="product-rank">#{index + 1}</div>
                        {product.images && product.images[0] && (
                          <img src={getImageUrl(product.images[0])} alt={product.title} className="product-thumb" />
                        )}
                        <div className="product-details">
                          <div className="product-title">{product.title}</div>
                          <div className="product-category">{product.category}</div>
                        </div>
                        <div className="product-stats">
                          <div className="stat-badge">👁️ {product.views}</div>
                          <div className="stat-badge">₹{product.sellingPrice.toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-small">
                      <p>No products yet</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Category Breakdown</h2>
                  <span className="section-subtitle">Product distribution</span>
                </div>
                <div className="category-chart">
                  {analytics.categoryBreakdown.length > 0 ? (
                    analytics.categoryBreakdown.map((cat, index) => {
                      const percentage = (cat.count / analytics.overview.totalProducts * 100).toFixed(0);
                      return (
                        <div key={index} className="category-bar-item">
                          <div className="category-bar-header">
                            <span className="category-name">{cat._id || 'Other'}</span>
                            <span className="category-percentage">{percentage}%</span>
                          </div>
                          <div className="category-bar-track">
                            <div 
                              className="category-bar-fill" 
                              style={{width: `${percentage}%`}}
                            ></div>
                          </div>
                          <div className="category-count">{cat.count} products</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state-small">
                      <p>No category data</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="analytics-row">
              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Sales Trend</h2>
                  <span className="section-subtitle">Last 6 months</span>
                </div>
                <div className="sales-chart">
                  {analytics.monthlySales.length > 0 ? (
                    <div className="chart-bars">
                      {analytics.monthlySales.map((sale, index) => {
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const monthName = monthNames[sale._id.month - 1];
                        const maxRevenue = Math.max(...analytics.monthlySales.map(s => s.revenue));
                        const barHeight = maxRevenue > 0 ? (sale.revenue / maxRevenue * 100) : 0;
                        return (
                          <div key={index} className="chart-bar-container">
                            <div className="chart-bar-wrapper">
                              <div 
                                className="chart-bar" 
                                style={{height: `${barHeight}%`}}
                                title={`₹${sale.revenue.toLocaleString()}`}
                              >
                                <span className="bar-value">₹{(sale.revenue / 1000).toFixed(0)}k</span>
                              </div>
                            </div>
                            <div className="chart-label">
                              <div className="chart-month">{monthName}</div>
                              <div className="chart-count">{sale.count} sales</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state-small">
                      <div className="empty-icon">📊</div>
                      <p>No sales data yet</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Recent Orders</h2>
                  <span className="section-subtitle">Latest activity</span>
                </div>
                <div className="recent-orders-list">
                  {recentOrders.length > 0 ? (
                    recentOrders.slice(0, 5).map((order) => (
                      <div key={order._id} className="order-item">
                        <div className="order-info">
                          <div className="order-number">#{order.orderNumber}</div>
                          <div className="order-customer">{order.customer?.name || 'Customer'}</div>
                        </div>
                        <div className="order-details">
                          <div className="order-amount">₹{order.totalAmount.toLocaleString()}</div>
                          <div className={`order-status ${order.status}`}>{order.status}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-small">
                      <p>No orders yet</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No analytics data available</h3>
            <p>Start adding products to see your analytics</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;

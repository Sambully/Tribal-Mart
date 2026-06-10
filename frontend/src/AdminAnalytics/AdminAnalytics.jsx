import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('30');

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
    fetchAdminStats();
  }, [navigate, timePeriod]);

  const fetchAdminStats = async () => {
    try {
      const response = await api.get(`/api/admin/analytics?period=${timePeriod}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
    } finally {
      setLoading(false);
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
            <h1>Platform Analytics</h1>
            <p>Monitor overall platform performance</p>
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
              <div className="profile-avatar admin">{user.name.charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">Admin</div>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : stats ? (
          <>
            {/* Overview Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon primary">👥</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.users.total}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon info">🏢</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.users.agencies}</div>
                  <div className="stat-label">Agencies</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon success">👤</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.users.customers}</div>
                  <div className="stat-label">Customers</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon warning">📦</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.products.total}</div>
                  <div className="stat-label">Total Products</div>
                </div>
              </div>
            </div>

            {/* Product Stats */}
            <div className="analytics-row">
              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Product Statistics</h2>
                </div>
                <div className="product-stats-grid">
                  <div className="product-stat-item pending">
                    <div className="stat-number">{stats.products.pending}</div>
                    <div className="stat-text">⏳ Pending</div>
                  </div>
                  <div className="product-stat-item approved">
                    <div className="stat-number">{stats.products.approved}</div>
                    <div className="stat-text">✅ Approved</div>
                  </div>
                  <div className="product-stat-item rejected">
                    <div className="stat-number">{stats.products.rejected}</div>
                    <div className="stat-text">❌ Rejected</div>
                  </div>
                  <div className="product-stat-item sold">
                    <div className="stat-number">{stats.products.sold}</div>
                    <div className="stat-text">💰 Sold</div>
                  </div>
                </div>
              </section>

              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Revenue Overview</h2>
                </div>
                <div className="revenue-overview">
                  <div className="revenue-main">
                    <div className="revenue-amount">₹{stats.revenue.total.toLocaleString()}</div>
                    <div className="revenue-label">Total Platform Revenue</div>
                  </div>
                  <div className="revenue-details">
                    <div className="revenue-detail-item">
                      <span className="detail-label">Orders:</span>
                      <span className="detail-value">{stats.revenue.orders}</span>
                    </div>
                    <div className="revenue-detail-item">
                      <span className="detail-label">Avg Order:</span>
                      <span className="detail-value">₹{stats.revenue.avgOrder}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Category Distribution */}
            <div className="analytics-row">
              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Category Distribution</h2>
                  <span className="section-subtitle">Products by category</span>
                </div>
                <div className="category-chart">
                  {stats.categories && stats.categories.length > 0 ? (
                    stats.categories.map((cat, index) => {
                      const percentage = ((cat.count / stats.products.total) * 100).toFixed(0);
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

              <section className="dashboard-section analytics-section">
                <div className="section-header">
                  <h2>Top Agencies</h2>
                  <span className="section-subtitle">By products listed</span>
                </div>
                <div className="top-agencies-list">
                  {stats.topAgencies && stats.topAgencies.length > 0 ? (
                    stats.topAgencies.slice(0, 5).map((agency, index) => (
                      <div key={agency._id} className="agency-item">
                        <div className="agency-rank">#{index + 1}</div>
                        <div className="agency-details">
                          <div className="agency-name">{agency.name}</div>
                          <div className="agency-email">{agency.email}</div>
                        </div>
                        <div className="agency-count">{agency.productCount} products</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-small">
                      <p>No agencies yet</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Monthly Trends */}
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Monthly Product Submissions</h2>
                <span className="section-subtitle">Last 6 months</span>
              </div>
              <div className="monthly-chart">
                {stats.monthlyProducts && stats.monthlyProducts.length > 0 ? (
                  <div className="chart-bars">
                    {stats.monthlyProducts.map((month, index) => {
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const monthName = monthNames[month._id.month - 1];
                      const maxCount = Math.max(...stats.monthlyProducts.map(m => m.count));
                      const barHeight = maxCount > 0 ? (month.count / maxCount * 100) : 0;
                      return (
                        <div key={index} className="chart-bar-container">
                          <div className="chart-bar-wrapper">
                            <div 
                              className="chart-bar admin" 
                              style={{height: `${barHeight}%`}}
                              title={`${month.count} products`}
                            >
                              <span className="bar-value">{month.count}</span>
                            </div>
                          </div>
                          <div className="chart-label">
                            <div className="chart-month">{monthName}</div>
                            <div className="chart-year">{month._id.year}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <div className="empty-icon">📊</div>
                    <p>No submission data yet</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Recent Platform Activity</h2>
                <span className="section-subtitle">Latest updates</span>
              </div>
              <div className="activity-list">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-details">
                        <div className="activity-title">{activity.title}</div>
                        <div className="activity-time">{activity.time}</div>
                      </div>
                      <div className={`activity-badge ${activity.type}`}>{activity.badge}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-small">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No analytics data available</h3>
            <p>Analytics will appear as the platform grows</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminAnalytics;

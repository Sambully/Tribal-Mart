import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import './AdminUsers.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
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
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userList) => {
    setStats({
      total: userList.length,
      customers: userList.filter(u => u.role === 'customer').length,
      agencies: userList.filter(u => u.role === 'agency').length,
      admins: userList.filter(u => u.role === 'admin').length
    });
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/admin/users/${userId}`);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
      console.error(error);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'suspend';
    
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      await api.put(`/api/admin/users/${userId}/status`, { status: newStatus });
      alert(`User ${action}d successfully`);
      fetchUsers();
    } catch (error) {
      alert(`Failed to ${action} user`);
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getRoleBadge = (role) => {
    const badges = {
      customer: { class: 'role-badge customer', text: 'Customer', icon: '👤' },
      agency: { class: 'role-badge agency', text: 'Agency', icon: '🏢' },
      admin: { class: 'role-badge admin', text: 'Admin', icon: '👑' }
    };
    return badges[role] || badges.customer;
  };

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter;
    const matchesSearch = searchTerm === '' || 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <AdminSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>User Management</h1>
            <p>View and manage all platform users</p>
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
              <div className="stat-icon admin">👥</div>
              <div className="stat-info">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon customer">👤</div>
              <div className="stat-info">
                <div className="stat-value">{stats.customers}</div>
                <div className="stat-label">Customers</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon agency">🏢</div>
              <div className="stat-info">
                <div className="stat-value">{stats.agencies}</div>
                <div className="stat-label">Agencies</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon admin">👑</div>
              <div className="stat-info">
                <div className="stat-value">{stats.admins}</div>
                <div className="stat-label">Admins</div>
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
                className={filter === 'customer' ? 'active' : ''}
                onClick={() => setFilter('customer')}
              >
                Customers ({stats?.customers || 0})
              </button>
              <button 
                className={filter === 'agency' ? 'active' : ''}
                onClick={() => setFilter('agency')}
              >
                Agencies ({stats?.agencies || 0})
              </button>
              <button 
                className={filter === 'admin' ? 'active' : ''}
                onClick={() => setFilter('admin')}
              >
                Admins ({stats?.admins || 0})
              </button>
            </div>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar ${u.role}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={getRoleBadge(u.role).class}>
                          {getRoleBadge(u.role).icon} {getRoleBadge(u.role).text}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-indicator ${u.status || 'active'}`}>
                          {u.status === 'suspended' ? '🚫 Suspended' : '✓ Active'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="toggle-btn"
                            onClick={() => navigate(`/admin/users/${u._id}`)}
                            title="View user detail"
                            style={{ background: 'var(--accent)', color: 'white' }}
                          >
                            👁
                          </button>
                          <button
                            className="toggle-btn"
                            onClick={() => handleToggleStatus(u._id, u.status || 'active')}
                            title={u.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                          >
                            {u.status === 'suspended' ? '✓' : '🚫'}
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteUser(u._id)}
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No users found</h3>
              <p>{searchTerm ? 'Try adjusting your search' : 'No users match the selected filter'}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminUsers;

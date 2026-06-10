import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard/admin',          label: 'Dashboard',          icon: '🏠', match: /^\/dashboard\/admin/ },
  { to: '/admin/pending-products',   label: 'Pending Approvals',  icon: '⏳', match: /^\/admin\/pending-products/ },
  { to: '/admin/all-products',       label: 'All Products',       icon: '📦', match: /^\/admin\/all-products/ },
  { to: '/document-approval',        label: 'Document Approval',  icon: '📄', match: /^\/document-approval/ },
  { to: '/admin/users',              label: 'Users',              icon: '👥', match: /^\/admin\/users/ },
  { to: '/admin/analytics',          label: 'Analytics',          icon: '📊', match: /^\/admin\/analytics/ },
  { to: '/admin/finance',            label: 'Finance',            icon: '💸', match: /^\/admin\/finance/ },
  { to: '/admin/categories',         label: 'Categories',         icon: '🏷️', match: /^\/admin\/categories/ },
  { to: '/messages',                 label: 'Messages',           icon: '💬', match: /^\/messages/ },
  { to: '/admin/settings',           label: 'Settings',           icon: '⚙️', match: /^\/admin\/settings|^\/settings/ },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="dashboard-sidebar admin-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🛡️</span>
          <span className="logo-text">Admin Console</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((it) => {
          const isActive = it.match.test(pathname);
          return (
            <a
              key={it.to}
              href="#"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate(it.to); }}
            >
              <span className="nav-icon">{it.icon}</span>
              <span>{it.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

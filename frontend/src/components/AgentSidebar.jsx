import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard/agent', label: 'Dashboard',         icon: '🏠', match: /^\/dashboard\/agent/ },
  { to: '/add-product',     label: 'List Product',      icon: '➕', match: /^\/add-product/ },
  { to: '/agent-earnings',  label: 'Earnings',          icon: '💰', match: /^\/agent-earnings/ },
  { to: '/messages',        label: 'Messages',          icon: '💬', match: /^\/messages/ },
  { to: '/support',         label: 'Support',           icon: '❓', match: /^\/support/ },
  { to: '/contact',         label: 'Contact Us',        icon: '📞', match: /^\/contact/ },
  { to: '/settings',        label: 'Settings',          icon: '⚙️', match: /^\/settings/ },
];

const AgentSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="dashboard-sidebar agency-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🤝</span>
          <span className="logo-text">Tribal Mart</span>
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

export default AgentSidebar;

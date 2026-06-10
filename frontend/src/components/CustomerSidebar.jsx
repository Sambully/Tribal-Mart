import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard/customer', label: 'Dashboard',     icon: '🏠', match: /^\/dashboard\/customer/ },
  { to: '/browse-products',    label: 'Browse Crafts', icon: '🛍️', match: /^\/browse-products|^\/product\// },
  { to: '/cart',               label: 'Cart',          icon: '🛒', match: /^\/cart/ },
  { to: '/orders',             label: 'My Orders',     icon: '📋', match: /^\/orders/ },
  { to: '/returns',            label: 'Returns',       icon: '↩️', match: /^\/returns/ },
  { to: '/watchlist',          label: 'Watchlist',     icon: '❤️', match: /^\/watchlist/ },
  { to: '/compare',            label: 'Compare',       icon: '⚖️', match: /^\/compare/ },
  { to: '/profile',            label: 'My Profile',    icon: '👤', match: /^\/profile/ },
  { to: '/checkout',           label: 'Checkout',      icon: '🧾', match: /^\/checkout/, hidden: true },
  { to: '/messages',           label: 'Messages',      icon: '💬', match: /^\/messages/ },
  { to: '/support',            label: 'Support',       icon: '❓', match: /^\/support/ },
  { to: '/contact',            label: 'Contact Us',    icon: '📞', match: /^\/contact/ },
  { to: '/settings',           label: 'Settings',      icon: '⚙️', match: /^\/settings/ },
];

const CustomerSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🪔</span>
          <span className="logo-text">Tribal Mart</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.filter((it) => !it.hidden || it.match.test(pathname)).map((it) => {
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

export default CustomerSidebar;

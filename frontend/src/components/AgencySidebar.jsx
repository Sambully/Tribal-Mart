import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';

const ITEMS = [
  { to: '/dashboard/agency',  k: 'sidebar.dashboard',    icon: '🏠', match: /^\/dashboard\/agency/ },
  { to: '/my-products',       k: 'sidebar.myProducts',   icon: '📦', match: /^\/my-products/ },
  { to: '/add-product',       k: 'sidebar.addProduct',   icon: '➕', match: /^\/add-product/ },
  { to: '/agency-orders',     k: 'sidebar.orders',       icon: '📋', match: /^\/agency-orders/ },
  { to: '/returns',           k: 'sidebar.returns',      icon: '↩️', match: /^\/returns/ },
  { to: '/upload-documents',  k: 'sidebar.documents',    icon: '📄', match: /^\/upload-documents/ },
  { to: '/analytics',         k: 'sidebar.analytics',    icon: '📊', match: /^\/analytics/ },
  { to: '/payouts',           k: 'sidebar.payouts',      icon: '💸', match: /^\/payouts/ },
  { to: '/messages',          k: 'sidebar.messages',     icon: '💬', match: /^\/messages/ },
  { to: '/support',           k: 'sidebar.support',      icon: '❓', match: /^\/support/ },
  { to: '/contact',           k: 'sidebar.contact',      icon: '📞', match: /^\/contact/ },
  { to: '/settings',          k: 'sidebar.settings',     icon: '⚙️', match: /^\/settings/ },
];

const AgencySidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const t = useT();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="dashboard-sidebar agency-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🪔</span>
          <span className="logo-text">Tribal Mart</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {ITEMS.map((it) => {
          const isActive = it.match.test(pathname);
          return (
            <a
              key={it.to}
              href="#"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate(it.to); }}
            >
              <span className="nav-icon">{it.icon}</span>
              <span>{t(it.k)}</span>
            </a>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <span className="nav-icon">🚪</span>
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default AgencySidebar;

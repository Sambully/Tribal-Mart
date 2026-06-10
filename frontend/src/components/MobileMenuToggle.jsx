import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './MobileMenuToggle.css';

/**
 * Floating hamburger button shown only on mobile.
 * Toggles a [data-sidebar-open] attribute on <body>; the Dashboard.css
 * media query reads it to slide the sidebar in/out.
 */
const MobileMenuToggle = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    document.body.dataset.sidebarOpen = open ? 'true' : 'false';
    return () => { delete document.body.dataset.sidebarOpen; };
  }, [open]);

  // Auto-close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <button
        className={`mm-toggle ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        <span /><span /><span />
      </button>
      {open && <div className="mm-overlay" onClick={() => setOpen(false)} />}
    </>
  );
};

export default MobileMenuToggle;

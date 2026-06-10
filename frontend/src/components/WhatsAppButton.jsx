import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './WhatsAppButton.css';

/* ────────────────────────────────────────────────────────────────
 * Floating click-to-chat WhatsApp button.
 *
 * Always opens a WhatsApp chat with the Tribal Mart admin
 * (+91 70496 61945). The prefilled message is contextual — it
 * includes the role and name of the signed-in user so the admin
 * knows who's reaching out before opening the thread.
 *
 * Mounted once in App.jsx so it shows on landing + every dashboard.
 * Hidden on /login and /signup routes.
 * ──────────────────────────────────────────────────────────────── */

const ADMIN_NUMBER = '917049661945'; // +91 70496 61945, no symbols

const WhatsAppButton = () => {
  const location = useLocation();
  const [hover, setHover] = useState(false);

  // Hide on auth pages
  if (/^\/(login|signup)/.test(location.pathname)) return null;

  // Resolve current user (if any) for a richer prefilled message
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (_) {
      return null;
    }
  })();

  const buildMessage = () => {
    if (!user) {
      return `Hello Tribal Mart! I have a question I'd love some help with.`;
    }
    const role = (user.role || '').toLowerCase();
    const name = user.name || 'there';
    switch (role) {
      case 'customer':
        return `Hi Tribal Mart team! I'm ${name}, a customer on the platform. I need some assistance.`;
      case 'agency':
        return `Hello Tribal Mart admin! I'm ${name} from agency "${user.name}". I have a query about my listings / orders.`;
      case 'agent':
        return `Hello! I'm ${name}, an agent on Tribal Mart. I'd like to discuss the agencies I'm assisting.`;
      case 'admin':
        return `Admin test — confirming the Tribal Mart WhatsApp link works.`;
      default:
        return `Hello Tribal Mart! I'm ${name}. I need some help.`;
    }
  };

  const href = `https://wa.me/${ADMIN_NUMBER}?text=${encodeURIComponent(buildMessage())}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tm-wa-launcher"
      aria-label="Chat with Tribal Mart on WhatsApp"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      initial={{ scale: 0, rotate: 180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 230, damping: 18, delay: 0.15 }}
    >
      <span className="tm-wa-pulse" />
      <svg
        className="tm-wa-icon"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="#fff"
          d="M16.001 3.2C8.928 3.2 3.2 8.928 3.2 16.001c0 2.262.594 4.469 1.722 6.412L3.2 28.8l6.526-1.71a12.738 12.738 0 0 0 6.275 1.598h.005c7.064 0 12.792-5.728 12.795-12.797 0-3.418-1.331-6.633-3.748-9.05A12.733 12.733 0 0 0 16.001 3.2zm0 23.36h-.004a10.617 10.617 0 0 1-5.41-1.483l-.388-.231-4.025 1.055 1.076-3.926-.253-.404a10.594 10.594 0 0 1-1.626-5.671c.002-5.866 4.776-10.64 10.643-10.64 2.842 0 5.512 1.108 7.519 3.118 2.008 2.01 3.113 4.682 3.111 7.525-.003 5.866-4.777 10.657-10.643 10.657zm5.836-7.974c-.32-.16-1.894-.935-2.187-1.041-.293-.107-.507-.16-.72.16-.213.32-.826 1.041-1.012 1.254-.187.213-.373.24-.693.08-.32-.16-1.352-.498-2.575-1.589-.952-.849-1.595-1.897-1.781-2.217-.187-.32-.02-.493.14-.652.144-.143.32-.373.48-.56.16-.187.213-.32.32-.534.107-.213.053-.4-.027-.56-.08-.16-.72-1.737-.987-2.378-.26-.624-.524-.54-.72-.55l-.614-.011a1.18 1.18 0 0 0-.853.4c-.293.32-1.12 1.094-1.12 2.671 0 1.577 1.147 3.099 1.307 3.312.16.213 2.257 3.446 5.467 4.834.764.33 1.36.527 1.825.674.766.244 1.464.21 2.015.127.615-.092 1.894-.774 2.16-1.522.267-.748.267-1.39.187-1.522-.08-.133-.293-.213-.613-.373z"
        />
      </svg>
      {hover && <span className="tm-wa-tooltip">Chat on WhatsApp</span>}
    </motion.a>
  );
};

export default WhatsAppButton;

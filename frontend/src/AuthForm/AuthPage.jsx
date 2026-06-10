import React, { useState } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import customerIcon from '../assets/customer-icon.svg';
import agencyIcon from '../assets/agency-icon.svg';
import adminIcon from '../assets/admin-icon.svg';
import './AuthPage.css';

const ROLE_META = {
  customer: {
    label: 'Customer',
    accent: 'customer',
    icon: customerIcon,
    heroTitle: 'Shop authentic',
    heroTitleEm: 'craft.',
    heroSub: 'Discover handmade pieces from tribal communities across India — every purchase reaches the artisan.',
    heroImage: '/images/textile.png',
    heroTint: 'linear-gradient(135deg, #2e3a59 0%, #1a2238 100%)',
    accentColor: 'var(--indigo)',
  },
  agency: {
    label: 'Agency',
    accent: 'agency',
    icon: agencyIcon,
    heroTitle: 'List your',
    heroTitleEm: 'heritage.',
    heroSub: 'Bring your community\'s craft to a marketplace that pays fairly and respects provenance.',
    heroImage: '/images/pottery.png',
    heroTint: 'linear-gradient(135deg, #d99441 0%, #b07020 100%)',
    accentColor: 'var(--ochre)',
  },
  agent: {
    label: 'Agent',
    accent: 'agent',
    icon: agencyIcon,
    heroTitle: 'Help artisans',
    heroTitleEm: 'thrive.',
    heroSub: 'List and manage products on behalf of tribal cooperatives — a bridge between craft and commerce.',
    heroImage: '/images/sculpture.png',
    heroTint: 'linear-gradient(135deg, #c0552c 0%, #8e3b1a 100%)',
    accentColor: 'var(--accent)',
  },
  admin: {
    label: 'Admin',
    accent: 'admin',
    icon: adminIcon,
    heroTitle: 'Steward the',
    heroTitleEm: 'platform.',
    heroSub: 'Approve listings, verify agencies, and keep the marketplace honest for artisans and buyers alike.',
    heroImage: '/images/necklace.png',
    heroTint: 'linear-gradient(135deg, #1a1410 0%, #3a2c20 100%)',
    accentColor: 'var(--fg)',
  },
};

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType = 'customer' } = useParams();
  const isSignup = location.pathname.startsWith('/signup');
  const mode = isSignup ? 'signup' : 'login';
  const role = ROLE_META[userType] || ROLE_META.customer;

  const toggleMode = () => {
    if (userType === 'admin') return; // admin can't self-register
    navigate(mode === 'login' ? `/signup/${userType}` : `/login/${userType}`);
  };

  return (
    <div className="tm-auth-shell">
      <div className="tm-auth-bg" aria-hidden />

      <button className="tm-auth-back" onClick={() => navigate(mode === 'login' ? '/login' : '/signup')}>
        ← Back to portals
      </button>

      <motion.div
        className="tm-auth-card"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── LEFT: form (animates between login/signup) ── */}
        <div className="tm-auth-form-side">
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'login' ? (
              <motion.div
                key="login"
                className="tm-auth-panel"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <LoginPanel userType={userType} role={role} onToggle={toggleMode} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                className="tm-auth-panel"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <SignupPanel userType={userType} role={role} onToggle={toggleMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: hero panel (stays put, just retints) ── */}
        <motion.div
          className="tm-auth-hero-side"
          style={{ background: role.heroTint }}
          layout
        >
          <div className="tm-auth-hero-pattern" aria-hidden />
          <div className="tm-auth-hero-image-wrap">
            <img src={role.heroImage} alt="" className="tm-auth-hero-image" />
          </div>
          <div className="tm-auth-hero-copy">
            <span className="tm-auth-hero-tag">{role.label.toUpperCase()} PORTAL</span>
            <h2>
              {role.heroTitle} <em>{role.heroTitleEm}</em>
            </h2>
            <p>{role.heroSub}</p>
          </div>
          <div className="tm-auth-hero-blobs" aria-hidden>
            <span className="tm-blob tm-blob-1" />
            <span className="tm-blob tm-blob-2" />
            <span className="tm-blob tm-blob-3" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   LOGIN PANEL
   ════════════════════════════════════════════════════════════ */
const LoginPanel = ({ userType, role, onToggle }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // `?next=/path` lets callers (e.g. the chatbot) send the user here
  // and bounce them straight to a specific page after login.
  const nextPath = searchParams.get('next');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('All fields are required'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      const { token, user } = res.data;
      if (user.role !== userType) {
        setError(`This account is registered as ${user.role}. Use the correct portal.`);
        setLoading(false);
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Safe relative-path redirect from ?next= (used by chatbot "→ My Orders")
      if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
        navigate(nextPath);
        return;
      }
      navigate(
        userType === 'customer' ? '/dashboard/customer'
          : userType === 'admin' ? '/dashboard/admin'
          : userType === 'agent' ? '/dashboard/agent'
          : '/dashboard/agency'
      );
    } catch (err) {
      setError(err.response?.data || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="tm-auth-header">
        <div className={`tm-auth-icon ${role.accent}`}>
          <img src={role.icon} alt={role.label} />
        </div>
        <h1>Welcome <em>back.</em></h1>
        <p>Sign in to your {role.label} account to continue.</p>
      </div>

      <form className="tm-auth-form" onSubmit={onSubmit}>
        {error && <div className="tm-auth-error">{error}</div>}

        <label className="tm-auth-field">
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
        </label>

        <label className="tm-auth-field">
          <span>Password</span>
          <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Enter your password" required />
        </label>

        <div className="tm-auth-row">
          <label className="tm-auth-check">
            <input type="checkbox" /> <span>Remember me</span>
          </label>
          <button type="button" className="tm-auth-textlink">Forgot password?</button>
        </div>

        <button type="submit" className={`tm-auth-submit ${role.accent}`} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {userType !== 'admin' && (
        <div className="tm-auth-toggle">
          New to Tribal Mart?
          <button onClick={onToggle} className="tm-auth-textlink">Create an account</button>
        </div>
      )}
    </>
  );
};

/* ════════════════════════════════════════════════════════════
   SIGNUP PANEL
   ════════════════════════════════════════════════════════════ */
const SignupPanel = ({ userType, role, onToggle }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin can't self-register — show notice instead of form
  if (userType === 'admin') {
    return (
      <>
        <div className="tm-auth-header">
          <div className={`tm-auth-icon ${role.accent}`}>
            <img src={role.icon} alt={role.label} />
          </div>
          <h1>Admin <em>access.</em></h1>
          <p>Admin accounts can't be created publicly — please contact a platform owner.</p>
        </div>
        <button onClick={() => navigate('/login/admin')} className={`tm-auth-submit ${role.accent}`}>
          Go to Admin Login
        </button>
      </>
    );
  }

  const onChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.confirmPassword) { setError('All fields are required'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (userType === 'agent' && !form.address.trim()) { setError('Address is required for agent accounts'); return; }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: userType,
        ...(userType === 'agent' ? { address: form.address } : {}),
      });
      navigate(`/login/${userType}`);
    } catch (err) {
      setError(err.response?.data || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nameLabel = userType === 'agency' ? 'Agency Name' : 'Full Name';
  const namePlaceholder = userType === 'agency' ? 'Your cooperative or studio name' : 'Your full name';

  return (
    <>
      <div className="tm-auth-header">
        <div className={`tm-auth-icon ${role.accent}`}>
          <img src={role.icon} alt={role.label} />
        </div>
        <h1>Join as a <em>{role.label}.</em></h1>
        <p>{userType === 'agency' ? 'Bring your craft to a wider audience.' : userType === 'agent' ? 'Help tribal agencies manage their listings.' : 'Discover authentic handmade pieces.'}</p>
      </div>

      <form className="tm-auth-form" onSubmit={onSubmit}>
        {error && <div className="tm-auth-error">{error}</div>}

        <label className="tm-auth-field">
          <span>{nameLabel}</span>
          <input type="text" name="name" value={form.name} onChange={onChange} placeholder={namePlaceholder} required />
        </label>

        <label className="tm-auth-field">
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
        </label>

        {userType === 'agent' && (
          <label className="tm-auth-field">
            <span>Address</span>
            <input type="text" name="address" value={form.address} onChange={onChange} placeholder="Your full address" required />
          </label>
        )}

        <div className="tm-auth-row tm-auth-row-2col">
          <label className="tm-auth-field">
            <span>Password</span>
            <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Min 6 characters" required />
          </label>
          <label className="tm-auth-field">
            <span>Confirm</span>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} placeholder="Re-enter" required />
          </label>
        </div>

        <button type="submit" className={`tm-auth-submit ${role.accent}`} disabled={loading}>
          {loading ? 'Creating account…' : `Create ${role.label} account`}
        </button>
      </form>

      <div className="tm-auth-toggle">
        Already have an account?
        <button onClick={onToggle} className="tm-auth-textlink">Sign in</button>
      </div>
    </>
  );
};

export default AuthPage;

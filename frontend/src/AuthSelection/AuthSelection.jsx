import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthSelection.css';
import customerIcon from '../assets/customer-icon.svg';
import agencyIcon from '../assets/agency-icon.svg';
import adminIcon from '../assets/admin-icon.svg';

const AuthSelection = ({ type }) => {
  const navigate = useNavigate();
  const isSignup = type === 'signup';

  return (
    <div className="auth-selection-container">
      <div className="auth-selection-content">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        
        <h1 className="auth-title">Welcome to <em style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 500, color: 'var(--accent)' }}>Tribal Mart</em></h1>
        <p className="auth-subtitle">
          Choose your portal — every account here serves the artisans, the agencies, and the communities behind every handmade piece.
        </p>

        <div className="auth-card-wrapper">
          {/* Customer Portal */}
          <div className="auth-portal-card">
            <div className="card-top customer">
              <div className="card-icon"><img src={customerIcon} alt="Customer" /></div>
            </div>
            <h3>Customer Portal</h3>
            <p>
              {isSignup
                ? "Create an account to browse and purchase seized goods at great prices."
                : "Access your account information, view reports, and manage your orders."}
            </p>
            <button
              className="access-btn customer-btn"
              onClick={() => navigate(isSignup ? '/signup/customer' : '/login/customer')}
            >
              {isSignup ? 'Sign Up as Customer' : 'Login as Customer'}
            </button>
          </div>

          {/* Agency Portal */}
          <div className="auth-portal-card">
            <div className="card-top agency">
              <div className="card-icon"><img src={agencyIcon} alt="Agency" /></div>
            </div>
            <h3>Agency Portal</h3>
            <p>
              {isSignup
                ? "Register your agency to list seized goods and manage auctions."
                : "Manage clients, access agency tools, and view performance metrics."}
            </p>
            <button
              className="access-btn agency-btn"
              onClick={() => navigate(isSignup ? '/signup/agency' : '/login/agency')}
            >
              {isSignup ? 'Sign Up as Agency' : 'Login as Agency'}
            </button>
          </div>

          {/* Agent Portal */}
          <div className="auth-portal-card">
            <div className="card-top agent">
              <div className="card-icon"><img src={agencyIcon} alt="Agent" /></div>
            </div>
            <h3>Agent Portal</h3>
            <p>
              {isSignup
                ? "Sign up as an agent to help tribal agencies list and manage their products."
                : "Manage agencies you assist, list products for them, and track approvals."}
            </p>
            <button
              className="access-btn agent-btn"
              onClick={() => navigate(isSignup ? '/signup/agent' : '/login/agent')}
            >
              {isSignup ? 'Sign Up as Agent' : 'Login as Agent'}
            </button>
          </div>

          {/* Admin Portal - Login Only */}
          {!isSignup && (
            <div className="auth-portal-card">
              <div className="card-top admin">
                <div className="card-icon"><img src={adminIcon} alt="Admin" /></div>
              </div>
              <h3>Admin Portal</h3>
              <p>
                Admin access for product approvals, user management, and platform oversight.
              </p>
              <button
                className="access-btn admin-btn"
                onClick={() => navigate('/login/admin')}
              >
                Login as Admin
              </button>
            </div>
          )}
        </div>

        <div className="help-box">
          <h4>Need a hand?</h4>
          <p>Not sure which portal fits you, or having trouble logging in? We're here for it.</p>
          <div className="help-buttons">
            <button className="help-btn" onClick={() => navigate('/help')}>💬 Get Support</button>
            <button className="help-btn" onClick={() => navigate('/contact')}>📧 Contact Us</button>
          </div>
        </div>

        <div className="auth-switch">
          {isSignup ? (
            <p>
              Already have an account? 
              <button onClick={() => navigate('/login')} className="switch-link">
                Login here
              </button>
            </p>
          ) : (
            <p>
              Don't have an account? 
              <button onClick={() => navigate('/signup')} className="switch-link">
                Sign up here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthSelection;
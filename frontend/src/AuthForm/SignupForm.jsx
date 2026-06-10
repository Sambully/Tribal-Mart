import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import './AuthForm.css';
import customerIcon from '../assets/customer-icon.svg';
import agencyIcon from '../assets/agency-icon.svg';
import adminIcon from '../assets/admin-icon.svg';

const SignupForm = () => {
  const navigate = useNavigate();
  const { userType } = useParams();

  // Prevent admin registration through normal signup
  if (userType === 'admin') {
    return (
      <div className="auth-form-container">
        <div className="auth-form-content">
          <button className="back-btn" onClick={() => navigate('/signup')}>
            ← Back to Selection
          </button>
          <div className="form-card">
            <div className="form-header">
              <div className="form-icon admin"><img src={adminIcon} alt="Admin" /></div>
              <h2>Admin Registration</h2>
              <p>Admin accounts cannot be created through public registration</p>
            </div>
            <div className="error-message" style={{ marginBottom: '1.5rem' }}>
              Admin accounts must be created by an existing administrator or through the database directly.
            </div>
            <button
              className="submit-btn admin"
              onClick={() => navigate('/login/admin')}
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (userType === 'agent' && !formData.address.trim()) {
      setError('Address is required for agent accounts');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: userType, // 'customer' | 'agency' | 'agent'
        ...(userType === 'agent' ? { address: formData.address } : {})
      });

      console.log('Signup successful:', response.data);
      
      // Redirect to login after successful signup
      alert('Account created successfully! Please login.');
      navigate(`/login/${userType}`);
      
    } catch (err) {
      setError(err.response?.data || 'Registration failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-content">
        <button className="back-btn" onClick={() => navigate('/signup')}>
          ← Back to Selection
        </button>

        <div className="form-card">
          <div className="form-header">
            <div className={`form-icon ${userType}`}>
              <img src={userType === 'customer' ? customerIcon : agencyIcon} alt={userType} />
            </div>
            <h2>Create {userType === 'customer' ? 'Customer' : userType === 'agent' ? 'Agent' : 'Agency'} Account</h2>
            <p>Join Tribal Mart and start {userType === 'customer' ? 'browsing great deals' : userType === 'agent' ? 'helping agencies manage their listings' : 'listing your products'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">
                {userType === 'customer' ? 'Full Name' : userType === 'agent' ? 'Full Name' : 'Agency Name'}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={userType === 'customer' ? 'John Doe' : userType === 'agent' ? 'Jane Smith' : 'Your Agency Name'}
                required
              />
            </div>

            {userType === 'agent' && (
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Your full address"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${userType}`}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => navigate(`/login/${userType}`)} 
                className="link-btn"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
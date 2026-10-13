import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import axios from 'axios';
import { FiSun, FiMoon, FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';
import './Login.scss';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const dispatch = useDispatch();

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        identifier: identifier.trim(),
        mobile: identifier.trim(),
        username: identifier.trim(),
        password
      });

      if (response.data.success) {
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminUser');
        dispatch(loginSuccess(response.data.data));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const formLogoIcon = theme === 'dark' ? '/assets/logo/Rent360_icon_White.png' : '/assets/logo/Rent360_icon_Black.png';

  return (
    <div className="bond-login-layout">
      {/* Floating Theme Toggle in top right */}
      <button className="bond-theme-btn" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
      </button>

      {/* Floating Centered Card */}
      <div className="bond-login-card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="brand-logo-pill">
            <img src={formLogoIcon} alt="Rent360" />
          </div>
          <h1 className="brand-title">Rent360</h1>
          <p className="brand-subtitle">Sign in to access your tenant dashboard</p>
        </div>

        {error && <div className="bond-error-alert">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Username or Mobile Number</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input 
                type="text" 
                placeholder="Enter username or mobile number" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="eye-toggle-btn" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="bond-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-card-footer">
          <span>Protected by Rent360 Enterprise Security</span>
        </div>
      </div>
    </div>
  );
};

export default Login;

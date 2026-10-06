import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import axios from 'axios';
import { FiSun, FiMoon, FiEye, FiEyeOff } from 'react-icons/fi';
import './Login.scss';

const Login = () => {
  const [mobile, setMobile] = useState('');
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
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:61026/api/auth/login', {
        mobile,
        password
      });

      if (response.data.success) {
        dispatch(loginSuccess(response.data.data));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine which logo to use for the form header
  const formLogoIcon = theme === 'dark' ? '/assets/logo/Rent360_icon_White.png' : '/assets/logo/Rent360_icon_Black.png';

  return (
    <div className="login-layout">
      {/* Theme Toggle in top right */}
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'light' ? <FiMoon size={24} /> : <FiSun size={24} />}
      </button>

      {/* Centered Form */}
      <div className="login-box">
        <div className="brand-header">
          <div className="logo-row">
            <div className="logo-icon-box">
              <img src={formLogoIcon} alt="Rent360 Logo" className="form-logo-icon" />
            </div>
            <h1 className="logo-text">RENT360</h1>
          </div>
          <p>Welcome back! Please login to your account.</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Mobile Number</label>
            <input 
              type="tel" 
              placeholder="Enter 10-digit mobile number" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

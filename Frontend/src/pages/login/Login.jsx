import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/api'; 
import './Login.css'; 

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    role: 'shop_owner' // Default selection
  });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(''); 
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await loginUser(formData);

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        setSuccessMessage('Login Successful! Redirecting...');
        
        setTimeout(() => {
          if (formData.role === 'loader') {
            // navigate('/loader-dashboard'); 
            navigate('/loader/dashboard')
          } else if (formData.role == 'shop_owner') {
            navigate('/shop/dashboard')
          } else {
            // navigate('/shop-dashboard'); 
            navigate('/login')
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Login Error:', error);
      setErrorMessage(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background glowing orbs */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your GoLoader account</p>
        </div>

        {errorMessage && <div className="message-box error-box">{errorMessage}</div>}
        {successMessage && <div className="message-box success-box">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          
          <div className="input-group">
            <label htmlFor="role">Login As</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-control"
            >
              <option value="shop_owner">Shop Owner (Send Goods)</option>
              <option value="loader">Loader (Driver)</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+919876543210"
              required
              className="form-control"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="form-control"
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="signup-link-text">
          Don't have an account?{' '}
          <Link to="/signup" className="signup-link">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
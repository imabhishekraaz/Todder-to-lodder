import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/api'; 
import './Login.css'; 

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    role: 'shop_owner'
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

        setSuccessMessage('Authentication successful. Redirecting workspace...');
        
        setTimeout(() => {
          if (formData.role === 'loader') {
            navigate('/loader/dashboard');
          } else if (formData.role === 'shop_owner') {
            navigate('/shop/dashboard');
          } else {
            navigate('/login');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Login Error:', error);
      setErrorMessage(error.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        
        <div className="login-header-box">
          <h2 className="login-title-heading">Welcome Back</h2>
          <p className="login-subtitle-text">Sign in to your enterprise GoLoader workspace</p>
        </div>

        {errorMessage && (
          <div className="error-alert-box">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="success-alert-box">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form-stack">
          
          <div className="input-group-box">
            <label htmlFor="role" className="input-label-title">Login Designation</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-input-control select-field"
            >
              <option value="shop_owner">Merchant Partner (Send Goods)</option>
              <option value="loader">Driver Partner (Transport Operator)</option>
            </select>
          </div>

          <div className="input-group-box">
            <label htmlFor="phone" className="input-label-title">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+919876543210"
              required
              className="form-input-control"
            />
          </div>

          <div className="input-group-box">
            <label htmlFor="password" className="input-label-title">Password Credentials</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="form-input-control"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`submit-login-btn ${isLoading ? 'is-loading' : ''}`}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="signup-navigation-text">
          Don't have an account?{' '}
          <Link to="/signup" className="signup-link-anchor">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
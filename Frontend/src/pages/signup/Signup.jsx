import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/api'; 
import './Signup.css'; 

const Signup = () => {
  const navigate = useNavigate();
  
  // State for form data (photo url removed)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'loader', // Default role
    email: ''
  });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update state when user types in the inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(''); 
    setSuccessMessage('');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Send data to backend API
      const data = await registerUser(formData);

      if (data.success) {
        setSuccessMessage('Account created successfully! Redirecting to Login...');
        
        // Wait 1.5 seconds, then go to login page
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Signup Error:', error);
      setErrorMessage(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      {/* Background glowing effects */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      <div className="signup-card">
        <div className="signup-header">
          <h2 className="signup-title">Create Account</h2>
          <p className="signup-subtitle">Join GoLoader to manage your logistics</p>
        </div>

        {/* Show error or success messages */}
        {errorMessage && <div className="message-box error-box">{errorMessage}</div>}
        {successMessage && <div className="message-box success-box">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          
          {/* Row 1: Role and Name */}
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="role">I am a</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="form-control">
                <option value="loader">Loader (Driver)</option>
                <option value="shop_owner">Shop Owner (Send Goods)</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Verma" required className="form-control" />
            </div>
          </div>

          {/* Row 2: Email and Phone */}
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="email">Email Address (Optional)</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="rahul@example.com" className="form-control" />
            </div>

            <div className="input-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+919876543210" required className="form-control" />
            </div>
          </div>

          {/* Password (Full width) */}
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a strong password" required className="form-control" />
          </div>

          <button type="submit" className="signup-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="login-link-text">
          Already have an account?{' '}
          <Link to="/login" className="login-link">Sign In</Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/api'; 
import './Signup.css'; 

const Signup = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'loader', 
    email: ''
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
      const data = await registerUser(formData);

      if (data.success) {
        setSuccessMessage('Account registered successfully. Redirecting to authentication console...');
        
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Signup Error:', error);
      setErrorMessage(error.message || 'Registration failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page-wrapper">
      <div className="signup-card-container">
        
        <div className="signup-header-box">
          <h2 className="signup-title-heading">Create Account</h2>
          <p className="signup-subtitle-text">Join GoLoader to manage enterprise logistics operations</p>
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

        <form onSubmit={handleSubmit} className="signup-form-stack">
          
          <div className="form-grid-row">
            <div className="input-group-box">
              <label htmlFor="role" className="input-label-title">Registration Designation</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="form-input-control select-field">
                <option value="loader">Driver Partner (Transport Operator)</option>
                <option value="shop_owner">Merchant Partner (Send Goods)</option>
              </select>
            </div>

            <div className="input-group-box">
              <label htmlFor="name" className="input-label-title">Full Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Verma" required className="form-input-control" />
            </div>
          </div>

          <div className="form-grid-row">
            <div className="input-group-box">
              <label htmlFor="email" className="input-label-title">Email Address (Optional)</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="rahul@example.com" className="form-input-control" />
            </div>

            <div className="input-group-box">
              <label htmlFor="phone" className="input-label-title">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+919876543210" required className="form-input-control" />
            </div>
          </div>

          <div className="input-group-box">
            <label htmlFor="password" className="input-label-title">Password Credentials</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required className="form-input-control" />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`submit-signup-btn ${isLoading ? 'is-loading' : ''}`}
          >
            {isLoading ? 'Registering Account...' : 'Create Account'}
          </button>
        </form>

        <p className="signin-navigation-text">
          Already have an account?{' '}
          <Link to="/login" className="signin-link-anchor">Sign In</Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfileApi, updateShopProfileApi } from '../../../api/shopOwnerAPI';
import './ShopProfile.css';

const ShopProfile = () => {
  const navigate = useNavigate();
  const [shopOwner, setShopOwner] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shopName: '',
    address: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const res = await getUserProfileApi();
      const userData = res.data || res.user || res;

      setShopOwner(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || userData.phoneNumber || userData.mobile || '',
        shopName: userData.shopName || userData.company_name || '',
        address: userData.address || ''
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || 'Could not load profile details from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await updateShopProfileApi(formData);
      const updatedUser = response.data || response.user || response;
      
      setShopOwner(updatedUser);
      setIsEditing(false);
      setMessage('Merchant profile information updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-wrapper">
      
      {/* Navbar */}
      <nav className="profile-navbar">
        <div className="nav-brand-group">
          <button className="back-btn" onClick={() => navigate('/shop/dashboard')}>
            Back
          </button>
          <div className="nav-divider-vertical"></div>
          <span className="navbar-subtitle">Merchant Account</span>
        </div>
        <h2 className="navbar-heading">Shop Owner Profile Console</h2>
      </nav>

      <div className="profile-container">
        
        {message && (
          <div className="success-alert-box">
            {message}
          </div>
        )}
        {error && (
          <div className="error-alert-box">
            <span className="error-dot"></span>
            {error}
          </div>
        )}

        <div className="profile-card-box">
          
          <div className="profile-header-section">
            <div className="profile-avatar-box">
              {shopOwner.name ? shopOwner.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="profile-title-stack">
              <h3 className="profile-name-heading">{shopOwner.name || 'Merchant Partner'}</h3>
              <p className="profile-email-text">{shopOwner.email || 'No email telemetry provided'}</p>
              <span className="role-badge-pill">Shop Owner / Merchant</span>
            </div>
          </div>

          {isLoading && !shopOwner.name ? (
            <div className="loading-state-box">
              <p>Loading profile details...</p>
            </div>
          ) : !isEditing ? (
            <div className="profile-details-grid">
              <div className="detail-item-box">
                <span className="detail-label">Full Name</span>
                <strong className="detail-value">{shopOwner.name || 'N/A'}</strong>
              </div>
              <div className="detail-item-box">
                <span className="detail-label">Email Address</span>
                <strong className="detail-value">{shopOwner.email || 'N/A'}</strong>
              </div>
              <div className="detail-item-box">
                <span className="detail-label">Phone Number</span>
                <strong className="detail-value">{shopOwner.phone || shopOwner.phoneNumber || 'N/A'}</strong>
              </div>
              <div className="detail-item-box">
                <span className="detail-label">Shop / Business Name</span>
                <strong className="detail-value">{shopOwner.shopName || shopOwner.company_name || 'N/A'}</strong>
              </div>
              <div className="detail-item-box full-width-item">
                <span className="detail-label">Business Address</span>
                <strong className="detail-value">{shopOwner.address || 'N/A'}</strong>
              </div>

              <div className="profile-actions-row">
                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                  Edit Profile Parameters
                </button>
              </div>
            </div>
          ) : (
            <form className="profile-edit-form-stack" onSubmit={handleUpdateProfile}>
              
              <div className="input-group-box">
                <label className="input-label-title">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="form-input-control"
                />
              </div>

              <div className="input-group-box">
                <label className="input-label-title">Email Address (Read-only)</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  disabled 
                  className="form-input-control input-disabled"
                />
              </div>

              <div className="input-group-box">
                <label className="input-label-title">Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="form-input-control"
                />
              </div>

              <div className="input-group-box">
                <label className="input-label-title">Shop / Business Name</label>
                <input 
                  type="text" 
                  name="shopName" 
                  value={formData.shopName} 
                  onChange={handleChange} 
                  className="form-input-control"
                />
              </div>

              <div className="input-group-box full-width-item">
                <label className="input-label-title">Business Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  rows="3"
                  className="form-input-control profile-textarea"
                />
              </div>

              <div className="form-actions-row">
                <button type="submit" className="save-changes-btn" disabled={isLoading}>
                  {isLoading ? 'Saving Parameters...' : 'Save Changes'}
                </button>
                <button type="button" className="cancel-edit-btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ShopProfile;
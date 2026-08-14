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

  // Backend se fresh profile data fetch karna
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
      setMessage('Profile updated successfully! ✨');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <nav className="profile-navbar">
        <button className="back-btn" onClick={() => navigate('/shop/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>👤 Shop Owner Profile</h2>
      </nav>

      <div className="profile-container">
        {message && <div className="alert success-alert">{message}</div>}
        {error && <div className="alert error-alert">{error}</div>}

        <div className="profile-card">
          <div className="profile-header-section">
            <div className="profile-avatar">
              {shopOwner.name ? shopOwner.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="profile-title-info">
              <h3>{shopOwner.name || 'Shop Partner'}</h3>
              <p>{shopOwner.email || 'No email provided'}</p>
              <span className="role-tag">Shop Owner</span>
            </div>
          </div>

          {isLoading && !shopOwner.name ? (
            <div className="loading-state">Loading profile details...</div>
          ) : !isEditing ? (
            <div className="profile-details-grid">
              <div className="detail-item">
                <span>Full Name</span>
                <strong>{shopOwner.name || 'N/A'}</strong>
              </div>
              <div className="detail-item">
                <span>Email Address</span>
                <strong>{shopOwner.email || 'N/A'}</strong>
              </div>
              <div className="detail-item">
                <span>Phone Number</span>
                <strong>{shopOwner.phone || shopOwner.phoneNumber || 'N/A'}</strong>
              </div>
              <div className="detail-item">
                <span>Shop / Business Name</span>
                <strong>{shopOwner.shopName || shopOwner.company_name || 'N/A'}</strong>
              </div>
              <div className="detail-item full-width">
                <span>Business Address</span>
                <strong>{shopOwner.address || 'N/A'}</strong>
              </div>

              <div className="profile-actions">
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  Edit Profile ✏️
                </button>
              </div>
            </div>
          ) : (
            <form className="profile-edit-form" onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Email Address (Read-only)</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  disabled 
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label>Shop / Business Name</label>
                <input 
                  type="text" 
                  name="shopName" 
                  value={formData.shopName} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group full-width">
                <label>Business Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes 💾'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                  Cancel ❌
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
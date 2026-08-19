import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfileApi } from '../../../api/api';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        getProfileApi().then(res => setUser(res.data)).catch(console.error);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (!user) {
        return (
            <div className="profile-loading-screen">
                <p>Loading profile information...</p>
            </div>
        );
    }

    return (
        <div className="profile-page-wrapper">
            <div className="profile-main-layout">
                
                {/* Back Button */}
                <button className="back-nav-btn" onClick={() => navigate('/loader/dashboard')}>
                    Back to Dashboard
                </button>

                <div className="profile-sidebar">
                    <div className="avatar-section">
                        <img 
                            src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                            alt="Profile Avatar" 
                            className="profile-avatar-img"
                        />
                        <h2 className="profile-name-heading">{user.name}</h2>
                        <span className="role-badge-pill">{user.role ? user.role.replace('_', ' ') : 'User'}</span>
                    </div>

                    <button className="btn-logout desktop-logout" onClick={handleLogout}>
                        Logout Session
                    </button>
                </div>

                <div className="profile-content-area">
                    <div className="content-header-box">
                        <h3 className="content-heading">Account Information</h3>
                    </div>

                    <div className="user-info-grid">
                        <div className="info-box-item">
                            <label className="info-label">Phone Number</label> 
                            <span className="info-value">{user.phone}</span>
                        </div>
                        <div className="info-box-item">
                            <label className="info-label">Email Address</label> 
                            <span className="info-value">{user.email || 'Not Provided'}</span>
                        </div>
                        <div className="info-box-item">
                            <label className="info-label">Account Status</label> 
                            <span className={`info-value status-text ${user.is_verified ? 'status-verified' : 'status-pending'}`}>
                                {user.is_verified ? 'Verified & Active' : 'Pending Verification'}
                            </span>
                        </div>
                        <div className="info-box-item">
                            <label className="info-label">Performance Rating</label> 
                            <span className="info-value rating-value">{user.rating_avg || '5.0'} / 5.0</span>
                        </div>
                        <div className="info-box-item">
                            <label className="info-label">Online Status</label> 
                            <span className={`info-value ${user.is_online ? 'online-active' : 'offline-inactive'}`}>
                                {user.is_online ? 'Active Connection' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>

                <button className="btn-logout mobile-logout" onClick={handleLogout}>
                    Logout Session
                </button>

            </div>
        </div>
    );
};

export default Profile;
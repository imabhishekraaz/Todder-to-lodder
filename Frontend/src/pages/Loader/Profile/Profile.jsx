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

    if (!user) return <div className="loading">Loading...</div>;

    return (
        <div className="profile-page-container">
            <div className="profile-main-layout">
                
                {/* Back Button Added Here */}
                <button className="back-nav-btn" onClick={() => navigate('/loader/dashboard')}>
                    ← Dashboard
                </button>

                <div className="profile-sidebar">
                    <div className="avatar-section">
                        <img 
                            src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                            alt="Profile" 
                        />
                        <h2 className="profile-name">{user.name}</h2>
                        <span className="role-badge">{user.role.replace('_', ' ')}</span>
                    </div>

                    <button className="btn-logout desktop-logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                <div className="profile-content">
                    <div className="content-header">
                        <h3>Account Information</h3>
                    </div>

                    <div className="user-info-grid">
                        <div className="info-box"><label>Phone Number</label> <span>{user.phone}</span></div>
                        <div className="info-box"><label>Email Address</label> <span>{user.email || 'Not Provided'}</span></div>
                        <div className="info-box"><label>Account Status</label> <span>{user.is_verified ? 'Verified ✅' : 'Pending ⏳'}</span></div>
                        <div className="info-box"><label>Avg. Rating</label> <span>{user.rating_avg} ⭐</span></div>
                        <div className="info-box"><label>Online Status</label> <span>{user.is_online ? 'Active 🟢' : 'Offline ⚪'}</span></div>
                    </div>
                </div>

                <button className="btn-logout mobile-logout" onClick={handleLogout}>
                    Logout
                </button>

            </div>
        </div>
    );
};

export default Profile;
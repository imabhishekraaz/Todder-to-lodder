import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateStatusApi, fetchLoaderHistoryApi, updateLoaderLocationApi } from '../../../api/api'; 
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [loaderStats, setLoaderStats] = useState({
    totalEarnings: 0,
    completedTrips: 0,
    rating: 5.0
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.is_online !== undefined) {
        setIsOnline(parsedUser.is_online);
      }

      if (parsedUser.role === 'loader') {
        loadLoaderRealStats();
        updateCurrentLocationGPS(); 
      }
    }
  }, [navigate]);

  const updateCurrentLocationGPS = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          await updateLoaderLocationApi({
            coordinates: [lng, lat]
          });
        } catch (error) {
          console.error("Failed to sync loader GPS coordinates:", error);
        }
      },
      (error) => {
        console.error("Geolocation request denied or unavailable:", error);
      },
      { enableHighAccuracy: true }
    );
  };

  const loadLoaderRealStats = async () => {
    try {
      const response = await fetchLoaderHistoryApi();
      setLoaderStats({
        totalEarnings: response.total_earnings || 0,
        completedTrips: response.data ? response.data.length : (response.count || 0),
        rating: response.rating || 5.0
      });
    } catch (error) {
      console.error("Failed to load metrics data:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavigation = () => {
    navigate('/profile');
  };

  const handleNavigationOrder = () => {
    navigate('/orders', { state: { defaultTab: 'direct' } });
  };

  const toggleOnlineStatus = async () => {
    if (isUpdating) return;

    const newStatus = !isOnline;
    setIsOnline(newStatus);
    setIsUpdating(true);
    setErrorMessage('');

    try {
      await updateStatusApi({
        userId: user._id,
        role: user.role,
        is_online: newStatus
      });

      const updatedUser = { ...user, is_online: newStatus };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

    } catch (error) {
      console.error("Failed to update availability status:", error);
      setIsOnline(!newStatus); 
      setErrorMessage("Network sync failed. Status update reverted.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="dashboard-loading-screen">
        <p>Loading application session...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">

      {/* Enterprise Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="nav-brand-group" onClick={() => navigate('/loader/dashboard')}>
          <div className="brand-logo-box">GL</div>
          <span className="brand-title-text">GoLoader</span>
        </div>

        {/* Desktop Menu Links */}
        <div className="desktop-nav-menu desktop-only">
          <button onClick={() => navigate('/loader/dashboard')} className="nav-menu-btn active">Dashboard</button>
          <button onClick={() => navigate('/profile')} className="nav-menu-btn">Profile</button>
          {user.role === 'loader' && (
            <>
              <button onClick={() => navigate('/accept/orders', { state: { defaultTab: 'accepted' } })} className="nav-menu-btn">Active Deliveries</button>
              <button onClick={() => navigate('/orders')} className="nav-menu-btn">History</button>
              <button onClick={() => navigate('/loader/history')} className="nav-menu-btn">Payments</button>
              <button onClick={() => navigate('/my-vehicles')} className="nav-menu-btn">Fleet</button>
              <button onClick={() => navigate('/add-vehicle')} className="nav-menu-btn">Add Asset</button>
            </>
          )}
        </div>

        {/* Desktop User Section */}
        <div className="desktop-user-section desktop-only">
          <div onClick={handleNavigation} className="user-profile-pill">
            <div className="user-initials-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info-stack">
              <span className="user-display-name">{user.name}</span>
              <span className="user-display-role">{user.role === 'loader' ? 'Driver Partner' : 'Merchant'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-action-btn">
            Logout
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-toggle-btn mobile-only">
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="mobile-drawer-menu mobile-only">
          <div className="drawer-user-header">
            <div className="drawer-avatar-box">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="drawer-name-title">{user.name}</h3>
              <span className="drawer-role-subtitle">{user.role === 'loader' ? 'Driver Partner' : 'Merchant'}</span>
            </div>
          </div>
          <button onClick={() => { setMenuOpen(false); navigate('/loader/dashboard'); }} className="drawer-link-btn">Dashboard</button>
          <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="drawer-link-btn">Profile</button>
          {user.role === 'loader' && (
            <>
              <button onClick={() => { setMenuOpen(false); navigate('/accept/orders', { state: { defaultTab: 'accepted' } }); }} className="drawer-link-btn">Active Deliveries</button>
              <button onClick={() => { setMenuOpen(false); navigate('/orders'); }} className="drawer-link-btn">History & Earnings</button>
              <button onClick={() => { setMenuOpen(false); navigate('/loader/history'); }} className="drawer-link-btn">Payment Records</button>
              <button onClick={() => { setMenuOpen(false); navigate('/my-vehicles'); }} className="drawer-link-btn">Fleet Management</button>
              <button onClick={() => { setMenuOpen(false); navigate('/add-vehicle'); }} className="drawer-link-btn">Register Asset</button>
            </>
          )}
          <button onClick={handleLogout} className="drawer-logout-btn">Logout Session</button>
        </div>
      )}

      {/* Main Workspace */}
      <main className="dashboard-main-content">

        {errorMessage && (
          <div className="error-alert-box">
            {errorMessage}
          </div>
        )}

        {/* Welcome Banner */}
        <div className="welcome-banner-card">
          <div>
            <h1 className="welcome-banner-title">Welcome back, {user.name.split(' ')[0]}</h1>
            <p className="welcome-banner-desc">Manage operations telemetry, monitor fulfillment pipelines, and review performance indicators.</p>
          </div>

          {user.role === 'loader' && (
            <div className="status-toggle-box">
              <div className="status-indicator-wrap">
                <span className={`status-dot-icon ${isOnline ? 'dot-online' : 'dot-offline'}`}></span>
                <span className={`status-text-label ${isOnline ? 'text-online' : 'text-offline'}`}>
                  {isOnline ? 'Online Status Active' : 'Offline Status'}
                </span>
              </div>
              <label className="toggle-switch-container">
                <input 
                  type="checkbox" 
                  checked={isOnline} 
                  onChange={toggleOnlineStatus} 
                  disabled={isUpdating}
                  className="toggle-checkbox-input"
                />
                <span className={`toggle-slider-round ${isOnline ? 'checked-bg' : ''}`}>
                  <span className={`toggle-slider-thumb ${isOnline ? 'checked-pos' : ''}`}></span>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid-container">
          <div className="metric-card-item">
            <span className="metric-card-label">{user.role === 'loader' ? 'Total Earnings' : 'Active Loads'}</span>
            <span className="metric-card-value">
              {user.role === 'loader' ? `₹${loaderStats.totalEarnings}` : '0'}
            </span>
          </div>

          <div className="metric-card-item">
            <span className="metric-card-label">{user.role === 'loader' ? 'Completed Trips' : 'Total Posted'}</span>
            <span className="metric-card-value">
              {user.role === 'loader' ? loaderStats.completedTrips : '0'}
            </span>
          </div>

          <div className="metric-card-item">
            <span className="metric-card-label">Performance Rating</span>
            <span className="metric-card-value rating-highlight">
              {user.role === 'loader' ? loaderStats.rating : '0.0'}
            </span>
          </div>
        </div>

        {/* Quick Operations Section */}
        <div className="operations-section-header">
          <h2 className="section-title-heading">Operational Controls</h2>
        </div>

        <div className="operations-cards-grid">
          {user.role === 'loader' ? (
            <>
              <div className="operation-card-box">
                <div>
                  <span className="card-badge-tag">Incoming Queue</span>
                  <h3 className="operation-card-title">Order Requests</h3>
                  <p className="operation-card-desc">Review and process direct order assignments submitted by registered merchants.</p>
                </div>
                <button 
                  disabled={!isOnline} 
                  onClick={handleNavigationOrder}
                  className={`operation-card-btn ${isOnline ? 'btn-active' : 'btn-disabled'}`}
                >
                  {isOnline ? 'Access Direct Requests' : 'Switch Status Online to Access'}
                </button>
              </div>

              <div className="operation-card-box">
                <div>
                  <span className="card-badge-tag fleet-tag">Fleet Asset Hub</span>
                  <h3 className="operation-card-title">Transport Units</h3>
                  <p className="operation-card-desc">Monitor registered asset operational states or provision additional transport configurations.</p>
                </div>
                <div className="dual-action-buttons">
                  <button onClick={() => navigate('/my-vehicles')} className="card-sub-btn view-btn">View Fleet</button>
                  <button onClick={() => navigate('/add-vehicle')} className="card-sub-btn add-btn">Add Asset</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="operation-card-box">
                <div>
                  <span className="card-badge-tag">Fulfillment Dispatch</span>
                  <h3 className="operation-card-title">Publish Load Request</h3>
                  <p className="operation-card-desc">Specify route destinations and cargo constraints to broadcast assignments to verified operators.</p>
                </div>
                <button className="operation-card-btn btn-active">Create Requisition</button>
              </div>

              <div className="operation-card-box">
                <div>
                  <span className="card-badge-tag fleet-tag">Telemetry Feed</span>
                  <h3 className="operation-card-title">Live Shipments</h3>
                  <p className="operation-card-desc">Track live transit coordinates and operator route progress in real time.</p>
                </div>
                <button className="operation-card-btn view-btn">Open Telemetry Feed</button>
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
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

  // Real data states for metrics
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

      // Agar user loader hai, toh real metrics fetch karein aur GPS location update karein
      if (parsedUser.role === 'loader') {
        loadLoaderRealStats();
        updateCurrentLocationGPS(); 
      }
    }
  }, [navigate]);

  // Browser GPS capture karke backend par save karne ka function
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
          console.log("Loader GPS auto-updated successfully:", [lng, lat]);
        } catch (error) {
          console.error("Failed to auto-update loader GPS:", error);
        }
      },
      (error) => {
        console.error("Geolocation permission denied or error:", error);
      },
      { enableHighAccuracy: true }
    );
  };

  // Backend se Loader ki real earnings aur history fetch karne ka function
  const loadLoaderRealStats = async () => {
    try {
      const response = await fetchLoaderHistoryApi();
      setLoaderStats({
        totalEarnings: response.total_earnings || 0,
        completedTrips: response.data ? response.data.length : (response.count || 0),
        rating: response.rating || 5.0
      });
    } catch (error) {
      console.error("Failed to load loader stats:", error);
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
      console.error("Failed to update status:", error);
      setIsOnline(!newStatus); 
      alert("Failed to update status. Please check your connection.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return <div className="loading-screen">Loading GoLoader...</div>;

  return (
    <div className="dashboard-wrapper">

      {/* Modern Sleek Navbar */}
      <nav className="dashboard-navbar">
        <div className="nav-brand" onClick={() => navigate('/loader/dashboard')}>
          <div className="brand-logo">GL</div>
          <span className="brand-name">GoLoader</span>
        </div>

        {/* Laptop / Desktop Navigation Links */}
        <div className="nav-menu desktop-only">
          <button onClick={() => navigate('/loader/dashboard')} className="nav-link active">Dashboard</button>
          <button onClick={() => navigate('/profile')} className="nav-link">Profile</button>
          {user.role === 'loader' && (
            <>
              <button onClick={() => navigate('/accept/orders', { state: { defaultTab: 'accepted' } })} className="nav-link">Accepted Orders</button>
              <button onClick={() => navigate('/orders')} className="nav-link">History</button>
              {/* 🚀 Added Payment History Navbar Button */}
              <button onClick={() => navigate('/loader/history')} className="nav-link">Payments</button>
              <button onClick={() => navigate('/my-vehicles')} className="nav-link">Vehicles</button>
              <button onClick={() => navigate('/add-vehicle')} className="nav-link">Add Vehicle</button>
            </>
          )}
        </div>

        {/* Laptop Right User & Logout Actions */}
        <div className="nav-right desktop-only">
          <div onClick={handleNavigation} className="user-pill">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="user-meta">
              <span className="u-name">{user.name}</span>
              <span className="u-role">{user.role === 'loader' ? 'Driver Partner' : 'Shop Owner'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button className="hamburger-btn mobile-only" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Dropdown Drawer Menu */}
      {menuOpen && (
        <div className="mobile-drawer mobile-only">
          <div className="drawer-user-card">
            <div className="user-avatar large">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <h3>{user.name}</h3>
              <span>{user.role === 'loader' ? 'Driver Partner' : 'Shop Owner'}</span>
            </div>
          </div>
          <div className="drawer-links">
            <button onClick={() => { setMenuOpen(false); navigate('/loader/dashboard'); }}>Dashboard</button>
            <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>My Profile</button>
            {user.role === 'loader' && (
              <>
                <button onClick={() => { setMenuOpen(false); navigate('/loader/history', { state: { defaultTab: 'accepted' } }); }}>Accepted Orders</button>
                <button onClick={() => { setMenuOpen(false); navigate('/loader/history'); }}>History & Earnings</button>
                {/* 🚀 Added Payment History Mobile Drawer Button */}
                <button onClick={() => { setMenuOpen(false); navigate('/loader/payments'); }}>Payment History</button>
                <button onClick={() => { setMenuOpen(false); navigate('/my-vehicles'); }}>All Vehicles</button>
                <button onClick={() => { setMenuOpen(false); navigate('/add-vehicle'); }}>Add Vehicle</button>
              </>
            )}
            <button onClick={handleLogout} className="drawer-logout-btn">Logout</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="dashboard-content">

        {/* Hero Banner Section */}
        <div className="hero-banner">
          <div className="hero-text">
            <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
            <p>Manage your fleet, track requests, and grow your logistics workflow.</p>
          </div>

          {user.role === 'loader' && (
            <div className={`status-pill-box ${isOnline ? 'online-glow' : 'offline-glow'}`}>
              <div className="status-info">
                <span className="dot"></span>
                <span>{isOnline ? 'You are Online' : 'You are Offline'}</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isOnline} 
                  onChange={toggleOnlineStatus} 
                  disabled={isUpdating}
                />
                <span className="slider round"></span>
              </label>
            </div>
          )}
        </div>

        {/* Stats Grid Bar */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">💰</div>
            <div className="metric-data">
              <span className="metric-value">
                {user.role === 'loader' ? `₹${loaderStats.totalEarnings}` : '0'}
              </span>
              <span className="metric-title">{user.role === 'loader' ? 'Total Earnings' : 'Active Loads'}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📦</div>
            <div className="metric-data">
              <span className="metric-value">
                {user.role === 'loader' ? loaderStats.completedTrips : '0'}
              </span>
              <span className="metric-title">{user.role === 'loader' ? 'Completed Trips' : 'Total Posted'}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⭐</div>
            <div className="metric-data">
              <span className="metric-value">
                {user.role === 'loader' ? loaderStats.rating : '0.0'}
              </span>
              <span className="metric-title">Performance Rating</span>
            </div>
          </div>
        </div>

        {/* Quick Action Grid Section */}
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>

        <div className="action-cards-grid">
          {user.role === 'loader' ? (
            <>
              <div className="action-card featured">
                <div className="card-top">
                  <span className="badge-tag">Incoming</span>
                  <div className="card-emoji">📥</div>
                </div>
                <h3>Order Requests</h3>
                <p>View and respond to order requests sent by shop owners.</p>
                <button className="card-btn primary" disabled={!isOnline} onClick={handleNavigationOrder}>
                  {isOnline ? 'View Direct Requests' : 'Go Online to View'}
                </button>
              </div>

              <div className="action-card">
                <div className="card-top">
                  <span className="badge-tag secondary">Fleet</span>
                  <div className="card-emoji">🚛</div>
                </div>
                <h3>Vehicle Hub</h3>
                <p>Inspect registered vehicle statuses or onboard a new transporter.</p>
                <div className="dual-btns">
                  <button className="card-btn outline" onClick={() => navigate('/my-vehicles')}>All Vehicles</button>
                  <button className="card-btn dark" onClick={() => navigate('/add-vehicle')}>Add Vehicle</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="action-card featured">
                <div className="card-top">
                  <span className="badge-tag">Dispatch</span>
                  <div className="card-emoji">📦</div>
                </div>
                <h3>Post a Load</h3>
                <p>Publish pick-up and drop locations to instantly connect with verified drivers.</p>
                <button className="card-btn primary">Create Request</button>
              </div>

              <div className="action-card">
                <div className="card-top">
                  <span className="badge-tag secondary">Tracking</span>
                  <div className="card-emoji">📍</div>
                </div>
                <h3>Live Shipments</h3>
                <p>Monitor real-time transit telemetry and driver progress seamlessly.</p>
                <button className="card-btn outline">Track Now</button>
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
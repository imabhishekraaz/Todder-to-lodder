import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchShopOrdersApi } from '../../../api/shopOwnerAPI';
import './ShopDashboard.css';

const ShopDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const shopOwner = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadShopOrders();
  }, []);

  const loadShopOrders = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchShopOrdersApi();
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching shop orders:", error);
      setErrorMessage(error.message || 'Failed to load your orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // --- Real Data Dynamic Calculations ---
  const totalOrders = orders.length;

  // Active deliveries
  const activeDeliveries = orders.filter(o => {
    const status = o.status ? o.status.toLowerCase() : '';
    return status === 'accepted' || status === 'in_transit' || status === 'arrived' || status === 'loaded';
  }).length;

  // Completed deliveries
  const completedDeliveries = orders.filter(o => {
    const status = o.status ? o.status.toLowerCase() : '';
    return status === 'completed' || status === 'delivered';
  }).length;

  return (
    <div className="shop-dashboard-wrapper">
      
      {/* UPDATE: Navbar with Profile and History Buttons */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>Shop Dashboard 🏪</h2>
        </div>

        {/* Naye Navigation Links Yahan Add Kiye Hain */}
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/history')}>
            📜 History
          </button>
          <button className="nav-btn" onClick={() => navigate('/shop/profile')}>
            👤 Profile
          </button>
        </div>

        <div className="nav-user-info">
          <span>Welcome, <strong>{shopOwner.name || 'Partner'}</strong></span>
          <button className="logout-btn" onClick={handleLogout}>Logout 🚪</button>
        </div>
      </nav>

      <div className="dashboard-container">

        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        <div className="action-banner">
          <div className="banner-text">
            <h3>Need to ship goods? 📦</h3>
            <p>Post a new delivery request and connect with nearby vehicle loaders instantly.</p>
          </div>
          <button className="post-load-btn" onClick={() => navigate('/create/order')}>
            Post New Order 🚀
          </button>
        </div>

        {/* Real Dynamic Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Orders Posted</span>
            <h3>{totalOrders}</h3>
          </div>
          <div className="stat-card">
            <span>Active Deliveries</span>
            <h3>{activeDeliveries}</h3>
          </div>
          <div className="stat-card">
            <span>Completed Deliveries</span>
            <h3>{completedDeliveries}</h3>
          </div>
        </div>

        <div className="orders-section-header">
          <h3>Your Recent Orders</h3>
          <button className="refresh-link" onClick={loadShopOrders}>
            Refresh 🔄
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Orders Posted Yet</h3>
            <p>You haven't created any delivery requests. Get started by posting your first load!</p>
            <button className="post-load-btn" onClick={() => navigate('/order/create')}>
              Post Order Now ➕
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((orders) => (
              <div key={orders._id} className="order-card">
                
                <div className="order-card-header">
                  <span className="category-badge">{orders.goods?.category || 'General Goods'}</span>
                  <span className={`status-badge ${orders.status}`}>
                    {orders.status ? orders.status.replace('_', ' ').toUpperCase() : 'REQUESTED'}
                  </span>
                </div>

                <div className="order-route">
                  <div className="route-point pickup">
                    <span className="dot-indicator green"></span>
                    <div>
                      <small>PICKUP</small>
                      <p>{orders.pickup?.address || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="route-line"></div>

                  <div className="route-point drop">
                    <span className="dot-indicator red"></span>
                    <div>
                      <small>DROP-OFF</small>
                      <p>{orders.drop?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="order-specs">
                  <div className="spec-item">
                    <span>Weight:</span>
                    <strong>{orders.goods?.weight_kg || 0} KG</strong>
                  </div>
                  <div className="spec-item">
                    <span>Fare:</span>
                    <strong className="fare-text">₹{orders.estimated_fare || 'N/A'}</strong>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="details-btn" 
                    onClick={() => navigate('/order/details', { state: { orderId: orders._id, orders } })}
                  >
                    View Status Details 📋
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ShopDashboard;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchShopOrdersApi, cancelOrderApi } from '../../../api/shopOwnerAPI';
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

  // ❌ Cancel Order Function
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await cancelOrderApi(orderId);
      // UI state ko update karein taaki status instantly 'CANCELLED' dikhe bina page reload kiye
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
    }
  };

  // --- Real Data Dynamic Calculations ---
  const totalOrders = orders.length;

  const activeDeliveries = orders.filter(o => {
    const status = o.status ? o.status.toLowerCase() : '';
    return status === 'accepted' || status === 'in_transit' || status === 'arrived' || status === 'loaded';
  }).length;

  const completedDeliveries = orders.filter(o => {
    const status = o.status ? o.status.toLowerCase() : '';
    return status === 'completed' || status === 'delivered';
  }).length;

  return (
    <div className="shop-dashboard-wrapper">
      
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>Shop Dashboard</h2>
        </div>

        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/history')}>
            History
          </button>
          <button className="nav-btn" onClick={() => navigate('/shop/profile')}>
            Profile
          </button>
        </div>

        <div className="nav-user-info">
          <span>Welcome, <strong>{shopOwner.name || 'Partner'}</strong></span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-container">

        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        <div className="action-banner">
          <div className="banner-text">
            <h3>Need to ship goods?</h3>
            <p>Post a new delivery request and connect with nearby vehicle loaders instantly.</p>
          </div>
          <button className="post-load-btn" onClick={() => navigate('/create/order')}>
            Post New Order
          </button>
        </div>

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
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No Orders Posted Yet</h3>
            <p>You haven't created any delivery requests. Get started by posting your first load!</p>
            <button className="post-load-btn" onClick={() => navigate('/create/order')}>
              Post Order Now
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((singleOrder) => (
              <div key={singleOrder._id} className="order-card">
                
                <div className="order-card-header">
                  <span className="category-badge">{singleOrder.goods?.category || 'General Goods'}</span>
                  <span className={`status-badge ${singleOrder.status}`}>
                    {singleOrder.status ? singleOrder.status.replace('_', ' ').toUpperCase() : 'REQUESTED'}
                  </span>
                </div>

                <div className="order-route">
                  <div className="route-point pickup">
                    <span className="dot-indicator green"></span>
                    <div>
                      <small>PICKUP</small>
                      <p>{singleOrder.pickup?.address || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="route-line"></div>

                  <div className="route-point drop">
                    <span className="dot-indicator red"></span>
                    <div>
                      <small>DROP-OFF</small>
                      <p>{singleOrder.drop?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="order-specs">
                  <div className="spec-item">
                    <span>Weight:</span>
                    <strong>{singleOrder.goods?.weight_kg || 0} KG</strong>
                  </div>
                  <div className="spec-item">
                    <span>Fare:</span>
                    <strong className="fare-text">₹{singleOrder.estimated_fare || 'N/A'}</strong>
                  </div>
                </div>

                <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    className="details-btn" 
                    onClick={() => navigate('/order/details', { state: { orderId: singleOrder._id, order: singleOrder } })}
                    style={{ flex: 1 }}
                  >
                    View Status Details
                  </button>

                  {/* 🚀 Sirf 'requested' status par hi Cancel button dikhega */}
                  {singleOrder.status === 'requested' && (
                    <button 
                      className="cancel-btn" 
                      onClick={() => handleCancelOrder(singleOrder._id)}
                      style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Cancel
                    </button>
                  )}
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
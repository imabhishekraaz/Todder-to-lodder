import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchShopOrdersApi, cancelOrderApi } from '../../../api/shopOwnerAPI';
import './ShopDashboard.css';

const ShopDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      setErrorMessage(error.message || 'Failed to retrieve active order ledgers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleCancelOrder = async (orderId) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await cancelOrderApi(orderId);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );
      setSuccessMessage('Freight requisition cancelled successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to execute requisition cancellation.');
    }
  };

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
      
      {/* Enterprise Navbar */}
      <nav className="dashboard-navbar">
        <div className="nav-brand-group">
          <h2 className="navbar-heading">Merchant Dashboard</h2>
        </div>

        <div className="desktop-nav-links">
          {/* 🚀 Order History Button */}
          <button className="nav-menu-btn" onClick={() => navigate('/history')}>
            Order History
          </button>
          {/* 🚀 Payment History Button */}
          <button className="nav-menu-btn" onClick={() => navigate('/shop/history')}>
            Payment History
          </button>
          <button className="nav-menu-btn" onClick={() => navigate('/shop/profile')}>
            Account Profile
          </button>
        </div>

        <div className="nav-user-section">
          <span className="user-welcome-text">Partner: <strong className="user-name-strong">{shopOwner.name || 'Merchant'}</strong></span>
          <button className="logout-action-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-main-container">

        {errorMessage && (
          <div className="error-alert-box">
            <span className="error-dot"></span>
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="success-alert-box">
            {successMessage}
          </div>
        )}

        {/* Action Banner Card */}
        <div className="action-banner-card">
          <div className="banner-text-stack">
            <h3>Need to broadcast freight shipments?</h3>
            <p>Publish a new delivery requisition to instantly connect with verified transport operators.</p>
          </div>
          <button className="post-load-trigger-btn" onClick={() => navigate('/create/order')}>
            Post New Requisition
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid-stack">
          <div className="metric-card-box">
            <span className="metric-label">Total Requisitions Posted</span>
            <h3 className="metric-value">{totalOrders}</h3>
          </div>
          <div className="metric-card-box">
            <span className="metric-label">Active Fulfills</span>
            <h3 className="metric-value">{activeDeliveries}</h3>
          </div>
          <div className="metric-card-box">
            <span className="metric-label">Completed Deliveries</span>
            <h3 className="metric-value success-val">{completedDeliveries}</h3>
          </div>
        </div>

        <div className="section-header-row">
          <h3 className="section-title-heading">Recent Requisitions</h3>
          <button className="refresh-ledger-btn" onClick={loadShopOrders}>
            Refresh Ledger
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state-box">
            <p>Retrieving merchant requisition feeds...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state-box">
            <h4 className="empty-title">No Requisitions Published</h4>
            <p className="empty-desc">You haven't created any freight assignments yet. Initiate your first dispatch.</p>
            <button className="post-load-trigger-btn empty-action-btn" onClick={() => navigate('/create/order')}>
              Post Order Now
            </button>
          </div>
        ) : (
          <div className="orders-card-grid">
            {orders.map((singleOrder) => (
              <div key={singleOrder._id} className="order-item-card">
                
                <div className="card-top-row">
                  <span className="category-badge-pill">{singleOrder.goods?.category || 'General Goods'}</span>
                  <span className={`order-status-badge ${singleOrder.status}`}>
                    {singleOrder.status ? singleOrder.status.replace('_', ' ').toUpperCase() : 'REQUESTED'}
                  </span>
                </div>

                <div className="route-details-panel">
                  <div>
                    <span className="route-point-label pickup-color">ORIGIN POINT</span>
                    <p className="route-address-text">{singleOrder.pickup?.address || 'N/A'}</p>
                  </div>
                  <div className="route-point-divider"></div>
                  <div>
                    <span className="route-point-label drop-color">DESTINATION POINT</span>
                    <p className="route-address-text">{singleOrder.drop?.address || 'N/A'}</p>
                  </div>
                </div>

                <div className="card-meta-row">
                  <span className="meta-label">Gross Weight: <strong className="meta-value">{singleOrder.goods?.weight_kg || 0} KG</strong></span>
                  <span className="meta-label">Tariff Fare: <strong className="fare-value">₹{singleOrder.estimated_fare || 'N/A'}</strong></span>
                </div>

                <div className="card-action-row">
                  <button 
                    className="view-details-btn" 
                    onClick={() => navigate('/order/details', { state: { orderId: singleOrder._id, order: singleOrder } })}
                  >
                    View Status Details
                  </button>

                  {singleOrder.status === 'requested' && (
                    <button 
                      className="cancel-requisition-btn" 
                      onClick={() => handleCancelOrder(singleOrder._id)}
                    >
                      Cancel Requisition
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
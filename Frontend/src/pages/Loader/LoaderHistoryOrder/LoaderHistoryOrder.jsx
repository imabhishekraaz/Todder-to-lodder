import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchNearbyOrdersApi, fetchAcceptedOrdersApi, acceptOrderApi } from '../../../api/api';
import './LoaderHistoryOrder.css';

const LoaderHistoryOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'available');
  const loaderUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Tab change hone par automatic sahi API call hogi
  useEffect(() => {
    if (activeTab === 'available') {
      loadNearbyOrders();
    } else {
      loadAcceptedOrders();
    }
  }, [activeTab]);

  // 1. Nearby Available Orders fetch karne ke liye
  const loadNearbyOrders = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchNearbyOrdersApi();
      const orderList = response.data || response.orders || response;
      setOrders(orderList);
    } catch (err) {
      console.error("Error fetching nearby orders:", err);
      setErrorMessage(err.message || 'Failed to load nearby orders.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Accepted/My Deliveries fetch karne ke liye
  const loadAcceptedOrders = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchAcceptedOrdersApi();
      const acceptedList = response.data || response.orders || response;
      setOrders(acceptedList);
    } catch (err) {
      console.error("Error fetching accepted orders:", err);
      setErrorMessage(err.message || 'Failed to load accepted orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const vehicleId = loaderUser.vehicleId || loaderUser.vehicle_id || prompt('Apni Vehicle ID enter karein:');
      
      if (!vehicleId) {
        alert('Vehicle ID is required to accept the order.');
        return;
      }

      await acceptOrderApi(orderId, vehicleId);
      
      alert('Order accepted successfully! 🎉');
      setActiveTab('accepted');

    } catch (err) {
      console.error("Error accepting order:", err);
      alert(err.message || 'Failed to accept this order.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="loader-dashboard-wrapper">
      <nav className="loader-nav">
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* 🔙 Yahan Back Button add kiya gaya hai */}
          <button 
            className="back-btn" 
            onClick={() => navigate('/loader/dashboard')}
            style={{ background: '#374151', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ← Back
          </button>
          <h2>Vehicle Loader Dashboard 🚚</h2>
        </div>
        <div className="nav-user-info" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Welcome, <strong>{loaderUser.name || 'Driver Partner'}</strong></span>
          <button 
            className="history-nav-btn" 
            onClick={() => navigate('/loader/history')}
            style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            💰 Earnings & History
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout 🚪</button>
        </div>
      </nav>

      <div className="loader-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            📦 Available Orders (Nearby)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            🚀 My Deliveries / Accepted
          </button>
        </div>

        <div className="orders-section-header">
          <h3>{activeTab === 'available' ? 'New Orders Nearby' : 'Your Accepted Deliveries'}</h3>
          <button className="refresh-link" onClick={activeTab === 'available' ? loadNearbyOrders : loadAcceptedOrders}>
            Refresh 🔄
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Orders Found</h3>
            <p>{activeTab === 'available' ? 'No nearby delivery requests found right now.' : 'Aapne abhi tak koi order accept nahi kiya hai.'}</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-card-header">
                  <span className="category-badge">{order.goods?.category || 'General Goods'}</span>
                  <span className={`status-badge ${order.status}`}>
                    {order.status ? order.status.replace('_', ' ').toUpperCase() : 'REQUESTED'}
                  </span>
                </div>

                <div className="order-route">
                  <div className="route-point pickup">
                    <span className="dot-indicator green"></span>
                    <div>
                      <small>PICKUP (SHOP)</small>
                      <p>{order.pickup?.address || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="route-line"></div>

                  <div className="route-point drop">
                    <span className="dot-indicator red"></span>
                    <div>
                      <small>DROP-OFF</small>
                      <p>{order.drop?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="order-specs">
                  <div className="spec-item">
                    <span>Weight:</span>
                    <strong>{order.goods?.weight_kg || 0} KG</strong>
                  </div>
                  <div className="spec-item">
                    <span>Fare:</span>
                    <strong className="fare-text">₹{order.estimated_fare || 'N/A'}</strong>
                  </div>
                </div>

                <div className="card-actions">
                  {activeTab === 'available' ? (
                    <button 
                      className="accept-btn" 
                      onClick={() => handleAcceptOrder(order._id)}
                    >
                      Accept Order 🚀
                    </button>
                  ) : (
                    <button 
                      className="details-btn" 
                      onClick={() => navigate('/loader/complete-order', { state: { order } })}
                    >
                      View Status & Complete 📋
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

export default LoaderHistoryOrder;
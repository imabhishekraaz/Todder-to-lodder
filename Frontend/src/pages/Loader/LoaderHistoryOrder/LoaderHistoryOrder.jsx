import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchLoaderDirectOrdersApi, acceptOrderApi, rejectOrderApi } from '../../../api/api';
import './LoaderHistoryOrder.css';

const LoaderHistoryOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'direct');
  const loaderUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (activeTab === 'direct') {
      loadDirectRequests();
    } else {
      loadAcceptedOrders();
    }
  }, [activeTab]);

  const loadDirectRequests = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetchLoaderDirectOrdersApi();
      const orderList = response.data || response.orders || response || [];
      const pendingOrders = orderList.filter(o => o.status === 'requested' || o.status === 'pending');
      setOrders(pendingOrders);
    } catch (err) {
      console.error("Error fetching direct requests:", err);
      setErrorMessage(err.message || 'Failed to load direct requests.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAcceptedOrders = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetchLoaderDirectOrdersApi();
      const orderList = response.data || response.orders || response || [];
      
      // 🚀 Yahan delivered aur completed orders ko filter out kar diya gaya hai
      // Taaki sirf in-progress active orders hi screen par dikhein
      const activeOrders = orderList.filter(o => {
        const status = o.status ? o.status.toLowerCase() : '';
        return ['accepted', 'in_transit', 'arrived', 'loaded'].includes(status);
      });

      setOrders(activeOrders);
    } catch (err) {
      console.error("Error fetching accepted orders:", err);
      setErrorMessage(err.message || 'Failed to load active orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrderApi(orderId);
      setOrders(prev => prev.filter(order => order._id !== orderId));
      setActiveTab('accepted'); 
    } catch (err) {
      console.error("Error accepting order:", err);
      setErrorMessage(err.message || 'Failed to accept this assignment.');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await rejectOrderApi(orderId, 'Rejected by driver partner');
      setOrders(prev => prev.filter(order => order._id !== orderId));
    } catch (err) {
      console.error("Error rejecting order:", err);
      setErrorMessage(err.message || 'Failed to reject assignment.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="history-page-wrapper">
      
      {/* Navbar */}
      <nav className="history-navbar">
        <div className="navbar-left-group">
          <button 
            onClick={() => navigate('/loader/dashboard')}
            className="back-btn"
          >
            Back to Dashboard
          </button>
          <h2 className="navbar-heading">Driver Operations Console</h2>
        </div>
        <div className="navbar-right-group">
          <span className="partner-info-text">Partner: <strong className="partner-name-val">{loaderUser.name || 'Driver Partner'}</strong></span>
          <button 
            onClick={handleLogout} 
            className="logout-action-btn"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="history-main-container">
        
        {errorMessage && (
          <div className="error-alert-box">
            {errorMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tab-navigation-bar">
          <button 
            onClick={() => setActiveTab('direct')}
            className={`tab-switch-btn ${activeTab === 'direct' ? 'tab-active' : 'tab-inactive'}`}
          >
            Direct Assignments
          </button>
          <button 
            onClick={() => setActiveTab('accepted')}
            className={`tab-switch-btn ${activeTab === 'accepted' ? 'tab-active' : 'tab-inactive'}`}
          >
            Active Deliveries
          </button>
        </div>

        <div className="section-header-row">
          <h3 className="section-header-title">
            {activeTab === 'direct' ? 'Pending Direct Requests' : 'In-Progress Active Deliveries'}
          </h3>
          <button 
            onClick={activeTab === 'direct' ? loadDirectRequests : loadAcceptedOrders} 
            className="refresh-records-btn"
          >
            Refresh Records
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state-box">
            <p>Retrieving transaction feeds...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state-box">
            <h4 className="empty-state-title">No Records Available</h4>
            <p className="empty-state-desc">
              {activeTab === 'direct' ? 'No incoming order requests currently pending review.' : 'No active deliveries currently in progress.'}
            </p>
          </div>
        ) : (
          <div className="orders-card-grid">
            {orders.map((order) => (
              <div key={order._id} className="order-item-card">
                
                <div className="card-top-row">
                  <div className="card-badge-group">
                    <span className="category-badge-pill">
                      {order.goods?.category || 'General Goods'}
                    </span>
                    <span className="weight-info-text">Weight: {order.goods?.weight_kg || 0} KG</span>
                  </div>
                  <span className="order-status-badge">
                    {order.status ? order.status.replace('_', ' ') : 'REQUESTED'}
                  </span>
                </div>

                {order.goods?.photo_url && (
                  <div className="goods-preview-box">
                    <img 
                      src={`http://localhost:5000/${order.goods.photo_url}`} 
                      alt="Goods Asset Preview" 
                      className="goods-preview-thumb" 
                    />
                  </div>
                )}

                <div className="route-details-panel">
                  <div>
                    <span className="route-point-label pickup-color">PICKUP LOCATION</span>
                    <p className="route-address-text">{order.pickup?.address || 'N/A'}</p>
                  </div>
                  <div className="route-point-divider"></div>
                  <div>
                    <span className="route-point-label drop-color">DROP-OFF LOCATION</span>
                    <p className="route-address-text">{order.drop?.address || 'N/A'}</p>
                  </div>
                </div>

                <div className="card-meta-row">
                  <span className="meta-label">Merchant: <strong className="meta-value">{order.shop_owner_id?.name || 'N/A'}</strong></span>
                  <span className="meta-label">Estimated Fare: <strong className="fare-value">₹{order.estimated_fare || 0}</strong></span>
                </div>

                <div className="card-action-row">
                  {activeTab === 'direct' ? (
                    <>
                      <button 
                        onClick={() => handleAcceptOrder(order._id)}
                        className="accept-assignment-btn"
                      >
                        Accept Order
                      </button>
                      <button 
                        onClick={() => handleRejectOrder(order._id)}
                        className="decline-assignment-btn"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => navigate('/order-details', { state: { order } })}
                      className="manage-fulfillment-btn"
                    >
                      Manage Fulfillment Details
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
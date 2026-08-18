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

  // 1. Load Direct Orders assigned specifically to this loader
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

  // 2. Load Accepted / My Deliveries
  const loadAcceptedOrders = async () => {
    setIsLoading(true);
    setErrorMessage(''); // 🛠️ FIXED: seterrorMessage ki jagah setErrorMessage kar diya hai
    try {
      const response = await fetchLoaderDirectOrdersApi();
      const orderList = response.data || response.orders || response || [];
      
      // Active status wale orders jo abhi tak paid nahi hue hain (is_paid === false)
      const acceptedOrders = orderList.filter(o => {
        const isActiveStatus = ['accepted', 'in_transit', 'arrived', 'delivered'].includes(o.status);
        const isNotPaid = o.is_paid === false || o.is_paid === undefined; // fallback for older orders
        return isActiveStatus && isNotPaid;
      });

      setOrders(acceptedOrders);
    } catch (err) {
      console.error("Error fetching accepted orders:", err);
      setErrorMessage(err.message || 'Failed to load accepted orders.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Accept Order Handler
  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrderApi(orderId);
      setOrders(prev => prev.filter(order => order._id !== orderId));
      setActiveTab('accepted'); 
    } catch (err) {
      console.error("Error accepting order:", err);
      setErrorMessage(err.message || 'Failed to accept this order.');
    }
  };

  // 4. Reject Order Handler
  const handleRejectOrder = async (orderId) => {
    try {
      await rejectOrderApi(orderId, 'Rejected by loader');
      setOrders(prev => prev.filter(order => order._id !== orderId));
    } catch (err) {
      console.error("Error rejecting order:", err);
      setErrorMessage(err.message || 'Failed to reject order.');
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
          <button className="logout-btn" onClick={handleLogout}>Logout 🚪</button>
        </div>
      </nav>

      <div className="loader-container">
        {errorMessage && <div className="alert error-alert" style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{errorMessage}</div>}

        {/* Tabs for Direct Requests vs Accepted Orders */}
        <div className="dashboard-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
            onClick={() => setActiveTab('direct')}
            style={{ padding: '10px 16px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'direct' ? '#2563eb' : '#e2e8f0', color: activeTab === 'direct' ? 'white' : '#334151', border: 'none' }}
          >
            📥 Direct Requests (Incoming Orders)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveTab('accepted')}
            style={{ padding: '10px 16px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'accepted' ? '#2563eb' : '#e2e8f0', color: activeTab === 'accepted' ? 'white' : '#334151', border: 'none' }}
          >
            🚀 My Deliveries / Accepted
          </button>
        </div>

        <div className="orders-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>{activeTab === 'direct' ? 'Orders Sent Directly To You' : 'Your Accepted Deliveries'}</h3>
          <button className="refresh-link" onClick={activeTab === 'direct' ? loadDirectRequests : loadAcceptedOrders} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}>
            Refresh 🔄
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '8px' }}>
            <span className="empty-icon" style={{ fontSize: '32px' }}>📭</span>
            <h3>No Orders Found</h3>
            <p>{activeTab === 'direct' ? 'Aapke paas abhi koi nayi order request nahi aayi hai.' : 'Aapne abhi tak koi order accept nahi kiya hai ya sabhi ki payment clear ho chuki hai.'}</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order._id} className="order-card" style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="category-badge" style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {order.goods?.category || 'General Goods'} ({order.goods?.weight_kg || 0} KG)
                  </span>
                  <span className={`status-badge ${order.status}`} style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '12px', color: '#d97706' }}>
                    {order.status ? order.status.replace('_', ' ') : 'REQUESTED'}
                  </span>
                </div>

                {/* Goods Photo Preview */}
                {order.goods?.photo_url && (
                  <div style={{ marginBottom: '10px' }}>
                    <img 
                      src={`http://localhost:5000/${order.goods.photo_url}`} 
                      alt="Goods Preview" 
                      style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                    />
                  </div>
                )}

                <div className="order-route" style={{ marginBottom: '12px' }}>
                  <div className="route-point pickup" style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#059669', marginRight: '6px' }}>🟢</span>
                    <div>
                      <small style={{ color: '#64748b', fontSize: '11px' }}>PICKUP (SHOP)</small>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{order.pickup?.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="route-point drop">
                    <span style={{ color: '#dc2626', marginRight: '6px' }}>🔴</span>
                    <div>
                      <small style={{ color: '#64748b', fontSize: '11px' }}>DROP-OFF</small>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{order.drop?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="order-specs" style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                  <div><span>Shop Owner: </span><strong>{order.shop_owner_id?.name || 'N/A'}</strong></div>
                  <div><span>Estimated Fare: </span><strong style={{ color: '#059669' }}>₹{order.estimated_fare || 0}</strong></div>
                </div>

                {/* Accept / Reject Buttons for Direct Requests */}
                <div className="card-actions" style={{ display: 'flex', gap: '10px' }}>
                  {activeTab === 'direct' ? (
                    <>
                      <button 
                        className="accept-btn" 
                        onClick={() => handleAcceptOrder(order._id)}
                        style={{ flex: 1, background: '#059669', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Accept Order ✅
                      </button>
                      <button 
                        className="reject-btn" 
                        onClick={() => handleRejectOrder(order._id)}
                        style={{ flex: 1, background: '#dc2626', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Reject / Cancel ❌
                      </button>
                    </>
                  ) : (
                    <button 
                      className="details-btn" 
                      onClick={() => navigate('/order-details', { state: { order } })}
                      style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
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
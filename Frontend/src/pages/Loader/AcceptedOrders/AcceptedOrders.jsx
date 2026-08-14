import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAcceptedOrdersApi } from '../../../api/api';
import './AcceptedOrders.css';

const AcceptedOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      navigate('/login');
      return;
    }

    if (user.role !== 'loader') {
      setErrorMessage('Only loaders can access this page.');
      setIsLoading(false);
      return;
    }

    loadAcceptedOrders();
  }, [navigate]);

  console.log(orders)
  const loadAcceptedOrders = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchAcceptedOrdersApi();
      setOrders(response.data || response || []);
    } catch (error) {
      console.error("Error fetching accepted orders:", error);
      setErrorMessage(error.message || 'Failed to fetch your accepted orders.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="accepted-orders-wrapper">
      
      <nav className="orders-navbar">
        <button className="back-btn" onClick={() => navigate('/loader/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>My Accepted Deliveries 🚚</h2>
      </nav>

      <div className="orders-container">
        
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your accepted orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Accepted Orders Yet</h3>
            <p>You haven't accepted any delivery requests yet. Check nearby orders to start delivering!</p>
            <button className="explore-btn" onClick={() => navigate('/loads/active')}>
              View Nearby Loads 📦
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                
                <div className="order-card-header">
                  <span className="category-badge">{order.goods?.category || 'General Goods'}</span>
                  <span className={`status-badge ${order.status}`}>
                    {order.status ? order.status.replace('_', ' ').toUpperCase() : 'ACCEPTED'}
                  </span>
                </div>

                <div className="order-route">
                  <div className="route-point pickup">
                    <span className="dot-indicator green"></span>
                    <div>
                      <small>PICKUP</small>
                      <p>{order.pickup?.address || 'Pickup Location'}</p>
                    </div>
                  </div>

                  <div className="route-line"></div>

                  <div className="route-point drop">
                    <span className="dot-indicator red"></span>
                    <div>
                      <small>DROP-OFF</small>
                      <p>{order.drop?.address || 'Drop Location'}</p>
                    </div>
                  </div>
                </div>

                <div className="order-specs">
                  <div className="spec-item">
                    <span>Weight:</span>
                    <strong>{order.goods?.weight_kg || 0} KG</strong>
                  </div>
                  <div className="spec-item">
                    <span>Estimated Fare:</span>
                    <strong className="fare-text">₹{order.estimated_fare || 'N/A'}</strong>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="track-btn" 
                    onClick={() => navigate('/order-details', { state: { orderId: orders[0]._id } })}
                  >
                    View Details & Track 📍
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

export default AcceptedOrders;
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchOrderDetailsApi } from '../../../api/api';
import './OrderDetails.css';

const OrderDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get orderId passed via state (e.g., from AcceptedOrders page)
  const orderId = location.state?.orderId || location.state?.order?._id;

  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!order);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    console.log(order)
    console.log(orderId)

    // If order wasn't passed in state, but we have an ID, fetch via API
    if (orderId && !order) {
      loadOrderDetails(orderId);
    } else if (!orderId && !order) {
      setErrorMessage('No order ID found.');
      setIsLoading(false);
    }
  }, [orderId, order, navigate]);

  const loadOrderDetails = async (id) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchOrderDetailsApi(id);
      console.log(response)
      setOrder(response.data || response);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setErrorMessage(error.message || 'Failed to load order information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="order-details-wrapper">
      <nav className="details-navbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Shipment Details 📋</h2>
      </nav>

      <div className="details-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching shipment details...</p>
          </div>
        ) : !order ? (
          <div className="empty-state">
            <h3>Order Not Found</h3>
            <p>The requested order could not be located.</p>
          </div>
        ) : (
          <div className="details-card">
            <div className="details-header">
              <div>
                <span className="order-id-label">Order ID: #{order._id}</span>
                <h3>{order.goods?.category || 'General Goods'}</h3>
              </div>
              <span className={`status-pill ${order.status}`}>
                {order.status ? order.status.replace('_', ' ').toUpperCase() : 'ACCEPTED'}
              </span>
            </div>

            <div className="route-section">
              <h4>Route Information</h4>
              <div className="route-box">
                <div className="route-point pickup">
                  <span className="dot-indicator green"></span>
                  <div>
                    <small>PICKUP ADDRESS</small>
                    <p>{order.pickup?.address || 'N/A'}</p>
                  </div>
                </div>

                <div className="route-connector"></div>

                <div className="route-point drop">
                  <span className="dot-indicator red"></span>
                  <div>
                    <small>DROP-OFF ADDRESS</small>
                    <p>{order.drop?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="specs-section">
              <h4>Shipment Specifications</h4>
              <div className="specs-grid">
                <div className="spec-box">
                  <span>Goods Category</span>
                  <strong>{order.goods?.category || 'N/A'}</strong>
                </div>
                <div className="spec-box">
                  <span>Weight</span>
                  <strong>{order.goods?.weight_kg || 0} KG</strong>
                </div>
                <div className="spec-box">
                  <span>Vehicle Requested</span>
                  <strong>{order.vehicle_type_requested ? order.vehicle_type_requested.replace('_', ' ') : 'N/A'}</strong>
                </div>
                <div className="spec-box">
                  <span>Estimated Fare</span>
                  <strong className="fare-highlight">₹{order.estimated_fare || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {order.status_history && order.status_history.length > 0 && (
              <div className="history-section">
                <h4>Status Timeline</h4>
                <div className="timeline-list">
                  {order.status_history.map((historyItem, index) => (
                    <div key={index} className="timeline-item">
                      <span className="timeline-dot"></span>
                      <div className="timeline-content">
                        <strong>{historyItem.status.replace('_', ' ').toUpperCase()}</strong>
                        <small>{new Date(historyItem.timestamp).toLocaleString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="action-footer">
              <button className="primary-action-btn" onClick={() => navigate('/accept-orders')}>
                Back to Accepted Orders 🚚
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
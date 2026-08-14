import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateOrderStatusApi } from '../../../api/api';
import './LoaderCompleteOrder.css';

const LoaderCompleteOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!order) {
    return (
      <div className="error-screen">
        <h3>Order details nahi mili!</h3>
        <button onClick={() => navigate('/loader/dashboard')}>← Back to Dashboard</button>
      </div>
    );
  }

  // Shop Owner details extract karne ke liye safe check
  const shopOwnerName = order.shop_owner_id?.name || order.customer?.name || 'Shop Owner';
  const shopOwnerPhone = order.shop_owner_id?.phone || order.customer?.phone || 'N/A';

  const handleCompleteOrder = async () => {
    const confirm = window.confirm("Kya aap customer/shop ke address par pahunch gaye hain? Order ko complete mark karein?");
    if (!confirm) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Yahan wahi PUT /orders/:orderId/status API call ho rahi hai
      await updateOrderStatusApi(order._id, 'delivered');
      
      alert('Order successfully completed! 🎉 Earnings added to your account.');
      navigate('/loader/history');
    } catch (err) {
      console.error("Error completing order:", err);
      setErrorMessage(err.message || 'Failed to complete order.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="complete-order-wrapper">
      <nav className="complete-nav">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>🚚 Delivery Completion & Details</h2>
      </nav>

      <div className="complete-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        <div className="status-banner">
          <span>Current Status:</span>
          <strong className={`status-tag ${order.status}`}>{order.status?.toUpperCase()}</strong>
        </div>

        {/* Shop Owner Information Section */}
        <div className="detail-section-card">
          <h3>👤 Shop Owner Information</h3>
          <div className="info-row">
            <span>Name:</span>
            <strong>{shopOwnerName}</strong>
          </div>
          <div className="info-row">
            <span>Phone:</span>
            <strong>{shopOwnerPhone}</strong>
          </div>
        </div>

        {/* Route Details Section */}
        <div className="detail-section-card">
          <h3>📍 Route Details</h3>
          <div className="route-box-view">
            <div className="point-item">
              <span className="dot green"></span>
              <div>
                <small>PICKUP ADDRESS</small>
                <p>{order.pickup?.address || 'N/A'}</p>
              </div>
            </div>
            <div className="point-divider"></div>
            <div className="point-item">
              <span className="dot red"></span>
              <div>
                <small>DROP-OFF ADDRESS</small>
                <p>{order.drop?.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goods & Earnings Section */}
        <div className="detail-section-card">
          <h3>📦 Goods & Earnings</h3>
          <div className="info-row">
            <span>Category:</span>
            <strong>{order.goods?.category || 'General Goods'}</strong>
          </div>
          <div className="info-row">
            <span>Weight:</span>
            <strong>{order.goods?.weight_kg || 0} KG</strong>
          </div>
          <div className="info-row">
            <span>Fare to Earn:</span>
            <strong className="fare-highlight">₹{order.estimated_fare || 0}</strong>
          </div>
        </div>

        {/* Action Button */}
        {order.status !== 'delivered' ? (
          <button 
            className="mark-completed-btn" 
            onClick={handleCompleteOrder} 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Mark as Completed & Deliver ✅'}
          </button>
        ) : (
          <div className="already-completed-msg">
            ✓ This order is already marked as completed.
          </div>
        )}
      </div>
    </div>
  );
};

export default LoaderCompleteOrder;
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateOrderStatusApi } from '../../../api/api';
import './LoaderCompleteOrder.css';

const LoaderCompleteOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order);

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

  const shopOwnerName = order.shop_owner_id?.name || order.customer?.name || 'Shop Owner';
  const shopOwnerPhone = order.shop_owner_id?.phone || order.customer?.phone || 'N/A';

  // 1. Mark Order as Delivered
  const handleMarkAsDelivered = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await updateOrderStatusApi(order._id, 'delivered');
      setOrder(prev => ({ ...prev, status: 'delivered' }));
    } catch (err) {
      console.error("Error marking delivered:", err);
      setErrorMessage(err.message || 'Failed to mark as delivered.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Confirm Payment & Complete
  const handleConfirmPayment = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await updateOrderStatusApi(order._id, 'paid');
      setOrder(prev => ({ ...prev, payment_status: 'paid' }));
      navigate('/loader/dashboard');
    } catch (err) {
      console.error("Error confirming payment:", err);
      setErrorMessage(err.message || 'Failed to confirm payment.');
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
        {errorMessage && <div className="alert error-alert" style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{errorMessage}</div>}

        <div className="status-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>Status: </span>
            <strong className={`status-tag ${order.status}`} style={{ textTransform: 'uppercase', color: '#d97706' }}>{order.status}</strong>
          </div>
          <div>
            <span>Payment: </span>
            <strong style={{ textTransform: 'uppercase', color: order.payment_status === 'paid' ? '#059669' : '#dc2626' }}>
              {order.payment_status || 'pending'}
            </strong>
          </div>
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

        {/* Action Buttons */}
        <div className="action-section" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {order.status !== 'delivered' && (
            <button 
              className="mark-completed-btn" 
              onClick={handleMarkAsDelivered} 
              disabled={isLoading}
              style={{ background: '#d97706', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {isLoading ? 'Processing...' : 'Mark as Delivered 📦'}
            </button>
          )}

          {order.status === 'delivered' && order.payment_status !== 'paid' && (
            <button 
              className="confirm-payment-btn" 
              onClick={handleConfirmPayment} 
              disabled={isLoading}
              style={{ background: '#059669', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {isLoading ? 'Processing...' : 'Confirm Cash Received & Complete 🎉'}
            </button>
          )}

          {order.status === 'delivered' && order.payment_status === 'paid' && (
            <div className="already-completed-msg" style={{ textAlign: 'center', background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '6px', fontWeight: 'bold' }}>
              ✓ Order Delivered & Payment Confirmed Successfully!
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoaderCompleteOrder;
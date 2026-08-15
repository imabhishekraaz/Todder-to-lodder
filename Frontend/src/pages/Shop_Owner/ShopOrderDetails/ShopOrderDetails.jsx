import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchOrderDetailsApi, rateLoaderApi, updatePaymentStatusApi } from '../../../api/api';
import './ShopOrderDetails.css';

const ShopOrderDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const passedOrder = location.state?.order || null;
  const orderId = location.state?.orderId || passedOrder?._id;

  const [order, setOrder] = useState(passedOrder);
  const [isLoading, setIsLoading] = useState(!passedOrder && Boolean(orderId));
  const [errorMessage, setErrorMessage] = useState('');
  
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  useEffect(() => {
    if (orderId && !order) {
      loadOrderDetails(orderId);
    } else if (!orderId) {
      setErrorMessage('No order information found.');
      setIsLoading(false);
    }
  }, [orderId, order]);

  const loadOrderDetails = async (id) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchOrderDetailsApi(id);
      setOrder(response.data || response);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setErrorMessage(error.message || 'Failed to load order information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!order?.loader_id?._id && !order?.loader_id) return;

    setIsSubmittingRating(true);
    try {
      const loaderId = order.loader_id._id || order.loader_id;
      await rateLoaderApi({
        orderId: order._id,
        loaderId: loaderId,
        rating: Number(rating),
        review: review
      });
      
      setOrder(prevOrder => ({
        ...prevOrder,
        is_rated: true
      }));
    } catch (err) {
      alert(err.message || 'Failed to submit rating.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handlePaymentConfirm = async () => {
    setIsUpdatingPayment(true);
    try {
      await updatePaymentStatusApi(order._id, { payment_status: 'paid' });
      
      setOrder(prevOrder => ({
        ...prevOrder,
        payment_status: 'paid'
      }));
    } catch (err) {
      alert(err.message || 'Failed to update payment status.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Helper function to check if payment was online/UPI
  const isOnlinePayment = () => {
    return (
      order.payment_method === 'upi' || 
      order.payment_method === 'razorpay' || 
      order.payment_details || 
      order.razorpay_payment_id
    );
  };

  const getPaymentMethodDisplay = () => {
    if (isOnlinePayment()) return 'UPI / ONLINE';
    if (order.payment_method) return order.payment_method.toUpperCase();
    return 'CASH';
  };

  return (
    <div className="shop-order-details-wrapper">
      <nav className="details-navbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to Dashboard
        </button>
        <h2>Order Status & Tracking 📦</h2>
      </nav>

      <div className="details-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching order details...</p>
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
                {order.status ? order.status.replace('_', ' ').toUpperCase() : 'REQUESTED'}
              </span>
            </div>

            {/* Cancelled vs Loader Assigned vs Waiting */}
            {order.status === 'cancelled' ? (
              <div className="cancelled-info-card" style={{ background: '#fee2e2', padding: '16px', borderRadius: '8px', margin: '20px 0', color: '#991b1b' }}>
                <p><strong> This order has been cancelled.</strong></p>
                {isOnlinePayment() ? (
                  <p style={{ marginTop: '6px', fontSize: '14px', fontWeight: '600' }}>
                     Online payment detected. Your refund of ₹{order.estimated_fare} has been initiated to your source account (5-7 business days).
                  </p>
                ) : (
                  <p style={{ marginTop: '6px', fontSize: '13px', fontWeight: '500' }}>
                    This was a cash order. No online payment was made, so no refund is required.
                  </p>
                )}
              </div>
            ) : order.loader_id ? (
              <div className="loader-info-card">
                <div className="loader-header-info">
                  <span className="loader-icon">🚚</span>
                  <div>
                    <small>ASSIGNED DELIVERY PARTNER</small>
                    <h4>{order.loader_id.name || 'N/A'}</h4>
                  </div>
                </div>
                <div className="loader-contact">
                  <span>📞 {order.loader_id.phone || 'N/A'}</span>
                  <a href={`tel:${order.loader_id.phone}`} className="call-btn">
                    Call Partner
                  </a>
                </div>
              </div>
            ) : (
              <div className="pending-loader-card">
                <p>⏳ Waiting for a delivery partner to accept your order...</p>
              </div>
            )}

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
              <h4>Order Specifications</h4>
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

            {/* Payment Details Section */}
            <div className="payment-section-card" style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', margin: '20px 0' }}>
              <h4>Payment Details</h4>
              <p>Payment Method: <strong>{getPaymentMethodDisplay()}</strong></p>
              <p>Status: <strong>{order.status === 'cancelled' && isOnlinePayment() ? 'REFUND INITIATED' : (order.payment_status ? order.payment_status.replace('_', ' ').toUpperCase() : 'PENDING')}</strong></p>
              
              {/* Cash confirmation button sirf tab dikhega jab order cancel na ho aur method cash ho */}
              {order.status !== 'cancelled' && 
               !isOnlinePayment() && 
               !['paid', 'success', 'completed'].includes(order.payment_status?.toLowerCase()) && (
                <button 
                  className="pay-confirm-btn" 
                  onClick={handlePaymentConfirm} 
                  disabled={isUpdatingPayment}
                  style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}
                >
                  {isUpdatingPayment ? 'Updating...' : 'Confirm Cash Paid / COD Received 💵'}
                </button>
              )}
            </div>

            {/* Rating Section */}
            {order.status !== 'cancelled' && (order.status === 'delivered' || order.status === 'completed') && (
              <div className="rating-section-card" style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
                <h4>⭐ Rate Your Delivery Partner</h4>
                {order.is_rated ? (
                  <p>✅ You have already rated this delivery.</p>
                ) : (
                  <form onSubmit={handleRatingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label>Rating (1 to 5): </label>
                      <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
                        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                        <option value="4">⭐⭐⭐⭐ (4)</option>
                        <option value="3">⭐⭐⭐ (3)</option>
                        <option value="2">⭐⭐ (2)</option>
                        <option value="1">⭐ (1)</option>
                      </select>
                    </div>
                    <div>
                      <textarea 
                        placeholder="Write a short review (optional)..." 
                        value={review} 
                        onChange={(e) => setReview(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingRating}
                      style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {isSubmittingRating ? 'Submitting...' : 'Submit Rating & Review'}
                    </button>
                  </form>
                )}
              </div>
            )}

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
              <button className="primary-action-btn" onClick={() => navigate('/shop/dashboard')}>
                Back to Dashboard 🏪
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOrderDetails;
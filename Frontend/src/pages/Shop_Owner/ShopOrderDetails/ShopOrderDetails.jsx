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
      setErrorMessage('Order identification parameters not found.');
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
      setErrorMessage(error.message || 'Failed to retrieve shipment tracking data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!order?.loader_id?._id && !order?.loader_id) return;

    setIsSubmittingRating(true);
    setErrorMessage('');
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
      setErrorMessage(err.message || 'Failed to submit operator evaluation.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handlePaymentConfirm = async () => {
    setIsUpdatingPayment(true);
    setErrorMessage('');
    try {
      await updatePaymentStatusApi(order._id, { payment_status: 'paid' });
      
      setOrder(prevOrder => ({
        ...prevOrder,
        payment_status: 'paid'
      }));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update financial reconciliation status.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const isOnlinePayment = () => {
    return (
      order.payment_method === 'upi' || 
      order.payment_method === 'razorpay' || 
      order.razorpay_payment_id ||
      order.payment_status === 'paid' && order.payment_method !== 'cash'
    );
  };

  const isPaymentPaid = () => {
    const status = order.payment_status?.toLowerCase();
    return status === 'paid' || status === 'success' || isOnlinePayment();
  };

  const getPaymentMethodDisplay = () => {
    if (order.payment_method === 'cash') return 'Deferred Cash Settlement (COD)';
    if (isOnlinePayment()) return 'Online Escrow Settlement (UPI)';
    return order.payment_method ? order.payment_method.toUpperCase() : 'Deferred Cash Settlement';
  };

  const getPaymentStatusDisplay = () => {
    if (order.status === 'cancelled' && isOnlinePayment()) return 'Refund Initiated';
    if (isPaymentPaid()) return 'Confirmed & Reconciled';
    return 'Pending Reconciliation';
  };

  return (
    <div className="shop-order-details-wrapper">
      
      {/* Navbar */}
      <nav className="details-navbar">
        <div className="nav-brand-group">
          <button className="back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
          <div className="nav-divider-vertical"></div>
          <span className="navbar-subtitle">Logistics Telemetry</span>
        </div>
        <h2 className="navbar-heading">Shipment Status & Tracking Console</h2>
      </nav>

      <div className="details-container">
        
        {errorMessage && (
          <div className="error-alert-box">
            <span className="error-dot"></span>
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="loading-state-box">
            <p>Retrieving shipment telemetry records...</p>
          </div>
        ) : !order ? (
          <div className="empty-state-box">
            <h3 className="empty-title">Order Record Not Found</h3>
            <p className="empty-desc">The requested requisition could not be located in the database.</p>
          </div>
        ) : (
          <div className="details-card-box">
            
            <div className="details-card-header">
              <div>
                <span className="order-reference-id">Reference ID: #{order._id}</span>
                <h3 className="order-category-title">{order.goods?.category || 'General Freight'}</h3>
              </div>
              <span className={`status-badge-pill ${order.status}`}>
                {order.status ? order.status.replace('_', ' ').toUpperCase() : 'REQUESTED'}
              </span>
            </div>

            {/* Cancelled vs Loader Assigned vs Waiting */}
            {order.status === 'cancelled' ? (
              <div className="cancelled-notification-box">
                <p className="cancelled-main-text">This freight requisition has been cancelled.</p>
                {isOnlinePayment() ? (
                  <p className="cancelled-sub-text">
                    Online escrow payment detected. Your refund of ₹{order.estimated_fare} has been initiated to your source account (processed within 5-7 business days).
                  </p>
                ) : (
                  <p className="cancelled-sub-text">
                    This was a deferred cash requisition. No online transaction escrow was created.
                  </p>
                )}
              </div>
            ) : order.loader_id ? (
              <div className="assigned-partner-box">
                <div className="partner-info-stack">
                  <span className="partner-box-label">ASSIGNED TRANSPORT OPERATOR</span>
                  <h4 className="partner-name-heading">{order.loader_id.name || 'N/A'}</h4>
                  <span className="partner-phone-text">Phone: {order.loader_id.phone || 'N/A'}</span>
                </div>
                <div className="partner-contact-stack">
                  <a href={`tel:${order.loader_id.phone}`} className="operator-call-btn">
                    <span className="phone-icon">📞</span> Call Driver Partner
                  </a>
                </div>
              </div>
            ) : (
              <div className="pending-queue-banner">
                Awaiting fleet operator acceptance across the telemetry perimeter...
              </div>
            )}

            <div className="section-block">
              <h4 className="section-block-title">Route Configuration</h4>
              <div className="route-panel">
                <div className="route-point-group">
                  <span className="route-dot pickup-dot"></span>
                  <div>
                    <span className="route-point-label pickup-text">ORIGIN POINT</span>
                    <p className="route-point-address">{order.pickup?.address || 'N/A'}</p>
                  </div>
                </div>

                <div className="route-divider-line"></div>

                <div className="route-point-group">
                  <span className="route-dot drop-dot"></span>
                  <div>
                    <span className="route-point-label drop-text">DESTINATION POINT</span>
                    <p className="route-point-address">{order.drop?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-block">
              <h4 className="section-block-title">Shipment Specifications</h4>
              <div className="specs-grid-layout">
                <div className="spec-item-box">
                  <span className="spec-key">Goods Category</span>
                  <strong className="spec-val">{order.goods?.category || 'N/A'}</strong>
                </div>
                <div className="spec-item-box">
                  <span className="spec-key">Gross Weight</span>
                  <strong className="spec-val">{order.goods?.weight_kg || 0} KG</strong>
                </div>
                <div className="spec-item-box">
                  <span className="spec-key">Transport Class</span>
                  <strong className="spec-val vehicle-caps">{order.vehicle_type_requested ? order.vehicle_type_requested.replace('_', ' ') : 'N/A'}</strong>
                </div>
                <div className="spec-item-box">
                  <span className="spec-key">Estimated Tariff Fare</span>
                  <strong className="fare-highlight-val">₹{order.estimated_fare || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="payment-control-panel">
              <h4 className="control-panel-heading">Financial Reconciliation</h4>
              
              <div className="control-meta-stack">
                <span className="control-meta-item">
                  Settlement Protocol: <strong className="control-meta-strong">{getPaymentMethodDisplay()}</strong>
                </span>
                <span className="control-meta-item">
                  Reconciliation Status: <strong className={`payment-status-text ${isPaymentPaid() ? 'status-paid' : 'status-pending'}`}>
                    {getPaymentStatusDisplay()}
                  </strong>
                </span>
              </div>
              
              {order.status !== 'cancelled' && 
               order.payment_method === 'cash' && 
               !isPaymentPaid() && (
                <button 
                  className="dynamic-action-trigger-btn btn-action-success"
                  onClick={handlePaymentConfirm} 
                  disabled={isUpdatingPayment}
                >
                  {isUpdatingPayment ? 'Processing Reconciliation...' : 'Confirm Cash Settlement / COD Received'}
                </button>
              )}

              {isPaymentPaid() && order.payment_method === 'cash' && (
                <div className="completion-success-notice">
                  Financial settlement successfully verified and reconciled by merchant partner.
                </div>
              )}
            </div>

            {/* Rating Section */}
            {order.status !== 'cancelled' && (order.status === 'delivered' || order.status === 'completed') && (
              <div className="rating-control-panel">
                <h4 className="rating-panel-heading">Operator Evaluation & Review</h4>
                {order.is_rated ? (
                  <div className="rating-submitted-notice">
                    Performance evaluation successfully submitted for this assignment.
                  </div>
                ) : (
                  <form onSubmit={handleRatingSubmit} className="rating-form-stack">
                    <div className="input-group-box">
                      <label className="input-label-title">Performance Rating Scale (1 to 5 Stars)</label>
                      <select value={rating} onChange={(e) => setRating(e.target.value)} className="form-input-control select-field">
                        <option value="5">5 Stars - Exceptional Service</option>
                        <option value="4">4 Stars - Professional Execution</option>
                        <option value="3">3 Stars - Satisfactory</option>
                        <option value="2">2 Stars - Below Standard</option>
                        <option value="1">1 Star - Unsatisfactory</option>
                      </select>
                    </div>
                    <div className="input-group-box">
                      <label className="input-label-title">Operational Review (Optional)</label> 
                      <textarea 
                        placeholder="Provide detailed feedback regarding transport execution..." 
                        value={review} 
                        onChange={(e) => setReview(e.target.value)}
                        className="form-input-control review-textarea"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingRating}
                      className="submit-evaluation-btn"
                    >
                      {isSubmittingRating ? 'Transmitting Evaluation...' : 'Submit Operator Evaluation'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {order.status_history && order.status_history.length > 0 && (
              <div className="section-block timeline-section">
                <h4 className="section-block-title">Telemetry Status Timeline</h4>
                <div className="timeline-list-stack">
                  {order.status_history.map((historyItem, index) => (
                    <div key={index} className="timeline-item-row">
                      <span className="timeline-bullet-point"></span>
                      <div className="timeline-content-stack">
                        <strong className="timeline-status-text">{historyItem.status.replace('_', ' ').toUpperCase()}</strong>
                        <small className="timeline-timestamp-text">{new Date(historyItem.timestamp).toLocaleString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-footer-action">
              <button className="back-dashboard-btn" onClick={() => navigate('/shop/dashboard')}>
                Return to Merchant Dashboard
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOrderDetails;
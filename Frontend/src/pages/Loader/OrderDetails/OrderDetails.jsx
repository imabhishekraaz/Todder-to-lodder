import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchOrderDetailsApi, completeDeliveryApi } from '../../../api/api'; 
import './OrderDetails.css';

const OrderDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const orderId = location.state?.orderId || location.state?.order?._id;

  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!order && Boolean(orderId));
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (orderId && !order) {
      loadOrderDetails(orderId);
    } else if (!orderId && !order) {
      setErrorMessage('Order identification parameters not found.');
      setIsLoading(false);
    }
  }, [orderId, order, navigate]);

  const loadOrderDetails = async (id) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchOrderDetailsApi(id);
      setOrder(response.data || response);
    } catch (error) {
      console.error("Error fetching order details:", error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setErrorMessage(error.message || 'Failed to retrieve shipment specifications.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnerPaid = order?.is_paid === true || order?.payment_status === 'paid' || order?.payment_status === 'success';

  const isOrderActive = order?.status === 'accepted' || order?.status === 'ongoing' || order?.status === 'picked_up';
  const isOrderDelivered = order?.status === 'delivered';
  const isOrderCompleted = order?.status === 'completed';

  let buttonText = 'Mark Shipment as Delivered';
  let isButtonDisabled = isProcessing;
  let actionBtnClass = 'btn-action-primary';

  if (isOrderActive) {
    buttonText = isProcessing ? 'Processing Update...' : 'Mark Shipment as Delivered';
    isButtonDisabled = isProcessing;
    actionBtnClass = 'btn-action-primary';
  } else if (isOrderDelivered && !isOwnerPaid) {
    buttonText = 'Awaiting Merchant Payment Reconciliation';
    isButtonDisabled = true;
    actionBtnClass = 'btn-action-disabled';
  } else if (isOrderDelivered && isOwnerPaid) {
    buttonText = isProcessing ? 'Processing Reconciliation...' : 'Confirm Cash Settlement & Close Order';
    isButtonDisabled = isProcessing;
    actionBtnClass = 'btn-action-success';
  }

  const handleActionButtonClick = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isOrderActive) {
        const response = await completeDeliveryApi(order._id, 'mark_delivered');
        setOrder(response.data || response);
        setSuccessMessage('Delivery milestone successfully updated.');
      } 
      else if (isOrderDelivered && isOwnerPaid) {
        const response = await completeDeliveryApi(order._id, 'confirm_cash');
        setOrder(response.data || response);
        setSuccessMessage('Cash settlement registered and order closed successfully.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update order status parameters.';
      setErrorMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="order-details-wrapper">
      
      {/* Navbar */}
      <nav className="details-navbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
        <h2 className="navbar-heading">Shipment Operations Console</h2>
      </nav>

      <div className="details-container">
        
        {errorMessage && (
          <div className="error-alert-box">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="success-alert-box">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="loading-state-box">
            <p>Retrieving shipment telemetry records...</p>
          </div>
        ) : !order ? (
          <div className="empty-state-box">
            <h3 className="empty-title">Order Record Not Found</h3>
            <p className="empty-desc">The requested shipment data could not be located in the database.</p>
          </div>
        ) : (
          <div className="details-card-box">
            
            <div className="details-card-header">
              <div>
                <span className="order-reference-id">Reference ID: #{order._id}</span>
                <h3 className="order-category-title">{order.goods?.category || 'General Goods'}</h3>
              </div>
              <span className={`status-badge-pill ${order.status}`}>
                {order.status ? order.status.replace('_', ' ').toUpperCase() : 'ACCEPTED'}
              </span>
            </div>

            <div className="section-block">
              <h4 className="section-block-title">Route Configuration</h4>
              <div className="route-panel">
                <div className="route-point-group">
                  <span className="route-dot pickup-dot"></span>
                  <div>
                    <span className="route-point-label pickup-text">PICKUP POINT</span>
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
                  <span className="spec-key">Vehicle Class Requested</span>
                  <strong className="spec-val vehicle-caps">{order.vehicle_type_requested ? order.vehicle_type_requested.replace('_', ' ') : 'N/A'}</strong>
                </div>
                <div className="spec-item-box">
                  <span className="spec-key">Estimated Tariff Fare</span>
                  <strong className="fare-highlight-val">₹{order.estimated_fare || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {/* Payment & Delivery Control Section */}
            <div className="payment-control-panel">
              <h4 className="control-panel-heading">Payment & Delivery Control</h4>
              
              <div className="control-meta-stack">
                <span className="control-meta-item">
                  Payment Method: <strong className="control-meta-strong">{order.payment_method === 'cash' ? 'Cash on Delivery (COD)' : 'UPI / Online Settlement'}</strong>
                </span>
                <span className="control-meta-item">
                  Merchant Payment Status: <strong className={`payment-status-text ${isOwnerPaid ? 'status-paid' : 'status-pending'}`}>
                    {isOwnerPaid ? 'Confirmed & Reconciled' : 'Pending Confirmation'}
                  </strong>
                </span>
              </div>

              {!isOrderCompleted ? (
                <>
                  <button 
                    onClick={handleActionButtonClick}
                    disabled={isButtonDisabled}
                    className={`dynamic-action-trigger-btn ${actionBtnClass}`}
                  >
                    {buttonText}
                  </button>

                  {isOrderDelivered && !isOwnerPaid && (
                    <p className="lockout-warning-text">
                      Payment confirmation from the merchant partner is pending. Controls remain locked until financial reconciliation is complete.
                    </p>
                  )}
                </>
              ) : (
                <div className="completion-success-notice">
                  Delivery milestone successfully completed and payments reconciled.
                </div>
              )}
            </div>

            <div className="card-footer-action">
              <button className="back-dashboard-btn" onClick={() => navigate('/loader/dashboard')}>
                Return to Dashboard
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
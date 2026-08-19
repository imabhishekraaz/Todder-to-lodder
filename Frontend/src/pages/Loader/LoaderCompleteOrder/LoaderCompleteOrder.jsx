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
      <div className="error-screen-wrapper">
        <h3 className="error-screen-title">Order telemetry records not found.</h3>
        <button 
          onClick={() => navigate('/loader/dashboard')}
          className="error-screen-btn"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const shopOwnerName = order.shop_owner_id?.name || order.customer?.name || 'Merchant Partner';
  const shopOwnerPhone = order.shop_owner_id?.phone || order.customer?.phone || 'N/A';
  const isOwnerPaid = order?.is_paid === true || order?.payment_status === 'paid' || order?.payment_status === 'success';

  const handleMarkAsDelivered = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await updateOrderStatusApi(order._id, 'delivered');
      setOrder(prev => ({ ...prev, status: 'delivered' }));
    } catch (err) {
      console.error("Error marking delivered:", err);
      setErrorMessage(err.message || 'Failed to update delivery milestone status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await updateOrderStatusApi(order._id, 'paid');
      setOrder(prev => ({ ...prev, payment_status: 'paid', is_paid: true }));
      navigate('/loader/dashboard');
    } catch (err) {
      console.error("Error confirming payment:", err);
      setErrorMessage(err.message || 'Failed to register payment reconciliation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fulfillment-page-wrapper">
      
      {/* Navbar */}
      <nav className="fulfillment-navbar">
        <button 
          onClick={() => navigate(-1)}
          className="back-btn"
        >
          Back
        </button>
        <h2 className="navbar-heading">Delivery Fulfillment Management</h2>
      </nav>

      <div className="fulfillment-main-container">
        
        {errorMessage && (
          <div className="error-alert-box">
            {errorMessage}
          </div>
        )}

        <div className="fulfillment-card-box">
          
          {/* Status Header Banner */}
          <div className="status-header-banner">
            <div>
              <span className="banner-label-text">Fulfillment Milestone: </span>
              <strong className="status-highlight-pill status-active-tag">
                {order.status || 'Active'}
              </strong>
            </div>
            <div>
              <span className="banner-label-text">Financial Status: </span>
              <strong className={`status-highlight-pill ${isOwnerPaid ? 'status-paid-tag' : 'status-pending-tag'}`}>
                {isOwnerPaid ? 'Paid' : 'Pending'}
              </strong>
            </div>
          </div>

          {/* Merchant Contact Section */}
          <div className="section-block">
            <h4 className="section-block-title">Merchant Contact</h4>
            <div className="section-inner-panel">
              <div className="info-row-item">
                <span className="info-key">Designation Name:</span>
                <strong className="info-val">{shopOwnerName}</strong>
              </div>
              <div className="info-row-item">
                <span className="info-key">Contact Number:</span>
                <strong className="info-val">{shopOwnerPhone}</strong>
              </div>
            </div>
          </div>

          {/* Route Matrix Section */}
          <div className="section-block">
            <h4 className="section-block-title">Route Configuration</h4>
            <div className="section-inner-panel">
              <div className="route-point-item">
                <span className="route-point-label pickup-label">PICKUP POINT</span>
                <p className="route-point-address">{order.pickup?.address || 'N/A'}</p>
              </div>
              <div className="route-point-divider"></div>
              <div className="route-point-item">
                <span className="route-point-label drop-label">DESTINATION POINT</span>
                <p className="route-point-address">{order.drop?.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Cargo Details Section */}
          <div className="section-block">
            <h4 className="section-block-title">Cargo & Financial Specifications</h4>
            <div className="section-inner-panel">
              <div className="info-row-item">
                <span className="info-key">Goods Category:</span>
                <strong className="info-val category-caps">{order.goods?.category || 'General Goods'}</strong>
              </div>
              <div className="info-row-item">
                <span className="info-key">Gross Weight:</span>
                <strong className="info-val">{order.goods?.weight_kg || 0} KG</strong>
              </div>
              <div className="info-row-item">
                <span className="info-key">Assigned Tariff Fare:</span>
                <strong className="fare-amount-val">₹{order.estimated_fare || 0}</strong>
              </div>
            </div>
          </div>

          {/* Action Control Interface */}
          <div>
            {order.status !== 'delivered' && (
              <button 
                onClick={handleMarkAsDelivered} 
                disabled={isLoading}
                className={`action-submit-btn ${isLoading ? 'is-loading' : ''}`}
              >
                {isLoading ? 'Processing Update...' : 'Mark Shipment as Delivered'}
              </button>
            )}

            {order.status === 'delivered' && !isOwnerPaid && (
              <button 
                onClick={handleConfirmPayment} 
                disabled={isLoading}
                className={`action-payment-btn ${isLoading ? 'is-loading' : ''}`}
              >
                {isLoading ? 'Processing Reconciliation...' : 'Confirm Cash Settlement & Close Order'}
              </button>
            )}

            {order.status === 'delivered' && isOwnerPaid && (
              <div className="completion-success-banner">
                Fulfillment milestone successfully completed and payments reconciled.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoaderCompleteOrder;
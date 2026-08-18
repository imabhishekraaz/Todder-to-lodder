import React, { useEffect, useState } from 'react';
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
      setErrorMessage('No order ID found.');
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
        setErrorMessage(error.message || 'Failed to load order information.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🛡️ STRICT OWNER PAYMENT CHECK FOR LOADER BUTTON
  const isOwnerPaid = order?.is_paid === true || order?.payment_status === 'paid' || order?.payment_status === 'success';

  const isOrderActive = order?.status === 'accepted' || order?.status === 'ongoing' || order?.status === 'picked_up';
  const isOrderDelivered = order?.status === 'delivered';
  const isOrderCompleted = order?.status === 'completed';

  // Button text, color, and disabled state logic
  let buttonText = 'Mark as Delivered 📦';
  let isButtonDisabled = isProcessing;
  let buttonBg = '#d97706'; 

  if (isOrderActive) {
    buttonText = isProcessing ? 'Processing...' : 'Mark as Delivered 📦';
    isButtonDisabled = isProcessing;
    buttonBg = '#d97706';
  } else if (isOrderDelivered && !isOwnerPaid) {
    buttonText = 'Waiting for Shop Owner Payment ⏳';
    isButtonDisabled = true; // 🛑 STRICTLY LOCKED until shop owner pays!
    buttonBg = '#cbd5e1'; // Grey color
  } else if (isOrderDelivered && isOwnerPaid) {
    buttonText = isProcessing ? 'Processing...' : 'Confirm Cash Received & Complete 🎉';
    isButtonDisabled = isProcessing; // ✅ Unlocked once owner pays
    buttonBg = '#059669'; // Green color
  }

  const handleActionButtonClick = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isOrderActive) {
        const response = await completeDeliveryApi(order._id, 'mark_delivered');
        setOrder(response.data || response);
        setSuccessMessage('✅ Order marked as delivered successfully!');
      } 
      else if (isOrderDelivered && isOwnerPaid) {
        const response = await completeDeliveryApi(order._id, 'confirm_cash');
        setOrder(response.data || response);
        setSuccessMessage('🎉 Cash received and order completed successfully!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update order status.';
      setErrorMessage(errorMsg);
    } finally {
      setIsProcessing(false);
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
        {errorMessage && <div className="alert error-alert" style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{errorMessage}</div>}
        {successMessage && <div className="alert success-alert" style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{successMessage}</div>}

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

            {/* Payment & Delivery Control Section */}
            <div className="payment-action-section" style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', margin: '20px 0', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Payment & Delivery Control</h4>
              <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
                Payment Method: <strong>{order.payment_method === 'cash' ? 'CASH ON DELIVERY (COD)' : 'UPI / ONLINE'}</strong>
              </p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                Shop Owner Payment Status: <strong style={{ color: isOwnerPaid ? '#059669' : '#d97706' }}>
                  {isOwnerPaid ? '✅ Confirmed / Paid' : '⏳ Pending Confirmation'}
                </strong>
              </p>

              {/* Single Action Button */}
              {!isOrderCompleted ? (
                <>
                  <button 
                    className="dynamic-action-btn"
                    onClick={handleActionButtonClick}
                    disabled={isButtonDisabled}
                    style={{
                      background: buttonBg,
                      cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                      color: isButtonDisabled ? '#475569' : 'white',
                      padding: '14px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 'bold',
                      width: '100%',
                      fontSize: '15px'
                    }}
                  >
                    {buttonText}
                  </button>

                  {isOrderDelivered && !isOwnerPaid && (
                    <p style={{ fontSize: '13px', color: '#b45309', marginTop: '10px', textAlign: 'center', lineHeight: '1.4' }}>
                      ⚠️ Shop owner ne abhi tak payment confirm nahi ki hai. Jab tak owner confirm nahi karta, yeh button locked rahega.
                    </p>
                  )}
                </>
              ) : (
                <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#166534', fontWeight: 'bold' }}>
                  🎉 Delivery Completed & Payment Received Successfully!
                </div>
              )}
            </div>

            <div className="action-footer">
              <button className="primary-action-btn" onClick={() => navigate('/loader/dashboard')}>
                Back to Dashboard 🚚
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
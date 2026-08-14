import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaymentHistoryApi } from '../../../api/shopOwnerAPI';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await getPaymentHistoryApi();
      setPayments(res.data || []);
    } catch (error) {
      setErrorMessage(error.message || 'Could not load payment history.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch order details and navigate using state
  const handleRowClick = async (orderId) => {
    if (!orderId) {
      alert('Order ID not available.');
      return;
    }

    try {
      setIsFetchingDetails(true);
      // Passing orderId securely via router state instead of URL params
      navigate('/order/details', { state: { orderId: orderId } });
    } catch (error) {
      alert(error.message || 'Failed to open order details.');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  return (
    <div className="payment-history-wrapper">
      <nav className="history-navbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to Dashboard
        </button>
        <h2>📊 Payment & Order History</h2>
      </nav>

      <div className="history-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        {isFetchingDetails && (
          <div className="loading-banner">Loading order details...</div>
        )}

        {isLoading ? (
          <div className="loading-state">Loading your payment history...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>No payment or order history found yet. 📦</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Order ID / Goods</th>
                  <th>Route (Pickup → Drop)</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((item) => {
                  const order = item.order_id || {};
                  return (
                    <tr 
                      key={item._id} 
                      onClick={() => handleRowClick(order._id)} 
                      title="Click to view order details"
                      className="clickable-row"
                    >
                      <td>
                        <b>{order.goods?.category || 'General Goods'}</b>
                        <br />
                        <small className="weight-text">Weight: {order.goods?.weight_kg || 'N/A'} kg</small>
                      </td>
                      <td>
                        <div className="route-cell">
                          <span>📍 {order.pickup?.address || 'N/A'}</span>
                          <span>🎯 {order.drop?.address || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="amount-badge">₹{item.amount}</span>
                      </td>
                      <td>
                        <span className={`method-badge ${item.method}`}>
                          {item.method ? item.method.toUpperCase() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status ? item.status.toUpperCase() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        {item.paid_at ? new Date(item.paid_at).toLocaleString() : new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
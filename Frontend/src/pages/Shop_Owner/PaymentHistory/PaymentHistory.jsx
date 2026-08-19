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
      // 🚀 Exact response structure ke hisaab se res.data set kar rahe hain
      setPayments(res.data || []);
    } catch (error) {
      setErrorMessage(error.message || 'Could not load payment history logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = async (orderItem) => {
    const orderId = orderItem._id;

    if (!orderId) {
      setErrorMessage('Order identification parameters not found.');
      return;
    }

    try {
      setIsFetchingDetails(true);
      navigate('/order/details', { 
        state: { 
          orderId: orderId,
          order: orderItem 
        } 
      });
    } catch (error) {
      setErrorMessage(error.message || 'Failed to initialize shipment parameters.');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  return (
    <div className="payment-history-wrapper">
      
      {/* Navbar */}
      <nav className="history-navbar">
        <div className="nav-brand-group">
          <button className="back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
          <div className="nav-divider-vertical"></div>
          <span className="navbar-subtitle">Financial Ledger</span>
        </div>
        <h2 className="navbar-heading">Payment & Transaction History</h2>
      </nav>

      <div className="history-container">
        
        {errorMessage && (
          <div className="error-alert-box">
            <span className="error-dot"></span>
            {errorMessage}
          </div>
        )}

        {isFetchingDetails && (
          <div className="loading-banner-box">
            Retrieving shipment details...
          </div>
        )}

        {isLoading ? (
          <div className="loading-state-box">
            <p>Loading financial ledger records...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state-box">
            <h4 className="empty-state-title">No Transaction Records Found</h4>
            <p className="empty-state-desc">No payment logs or completed freight reconciliations are currently available.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="history-data-table">
              <thead>
                <tr>
                  <th>Order Category / Weight</th>
                  <th>Route (Origin → Destination)</th>
                  <th>Settled Amount</th>
                  <th>Protocol</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((order) => {
                  const category = order.goods?.category || 'General Freight';
                  const weight = order.goods?.weight_kg || 'N/A';
                  const pickupAddr = order.pickup?.address || 'N/A';
                  const dropAddr = order.drop?.address || 'N/A';
                  const amount = order.estimated_fare || order.amount || 0;
                  const method = order.payment_method || 'CASH';
                  const status = order.payment_status || order.status || 'REQUESTED';

                  return (
                    <tr 
                      key={order._id} 
                      onClick={() => handleRowClick(order)} 
                      title="Click to view shipment details"
                      className="clickable-table-row"
                    >
                      <td>
                        <strong className="goods-category-text">{category}</strong>
                        <span className="weight-meta-text">Gross Weight: {weight} KG</span>
                      </td>
                      <td>
                        <div className="route-cell-stack">
                          <span className="route-point-item pickup-point">Origin: {pickupAddr}</span>
                          <span className="route-point-item drop-point">Drop: {dropAddr}</span>
                        </div>
                      </td>
                      <td>
                        <span className="amount-badge-pill">₹{amount}</span>
                      </td>
                      <td>
                        <span className="method-badge-pill">
                          {method.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge-pill ${status.toLowerCase() === 'success' || status.toLowerCase() === 'paid' || status.toLowerCase() === 'delivered' ? 'status-success' : 'status-pending'}`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="timestamp-cell-text">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
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
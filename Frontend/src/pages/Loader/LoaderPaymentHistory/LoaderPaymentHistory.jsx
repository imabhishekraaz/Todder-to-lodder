import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLoaderPaymentHistoryApi } from '../../../api/api';
import './LoaderPaymentHistory.css';

const LoaderPaymentHistory = () => {
  const navigate = useNavigate();
  const [completedPayments, setCompletedPayments] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetchLoaderPaymentHistoryApi();
      setCompletedPayments(response?.data || []);
      setTotalEarnings(response?.total_earnings || 0);
    } catch (err) {
      console.error("Error loading payments:", err);
      setErrorMessage(err.message || 'Failed to load payment history logs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="payment-history-wrapper">
      
      {/* Navbar */}
      <nav className="payment-navbar">
        <button 
          onClick={() => navigate('/loader/dashboard')}
          className="back-btn"
        >
          Back to Dashboard
        </button>
        <h2 className="navbar-heading">Payment and Earnings Telemetry</h2>
      </nav>

      <div className="payment-main-container">
        
        {errorMessage && (
          <div className="error-alert-box">
            {errorMessage}
          </div>
        )}

        {/* Lifetime Earnings Summary Card */}
        <div className="earnings-summary-card">
          <div>
            <span className="summary-label-text">Lifetime Reconciled Earnings</span>
            <h2 className="total-earnings-heading">₹{totalEarnings}</h2>
            <p className="summary-stat-text">{completedPayments.length} fully reconciled and paid deliveries</p>
          </div>
          <button 
            onClick={fetchPayments} 
            className="refresh-feed-btn"
          >
            Refresh Feed
          </button>
        </div>

        <div className="section-header-row">
          <h3 className="section-title-heading">Reconciled Transactions</h3>
        </div>

        {isLoading ? (
          <div className="loading-state-box">
            <p>Loading financial ledger records...</p>
          </div>
        ) : completedPayments.length === 0 ? (
          <div className="empty-state-box">
            <h4 className="empty-state-title">No Payment Records Found</h4>
            <p className="empty-state-desc">No completed or financially settled delivery logs are currently available.</p>
          </div>
        ) : (
          <div className="payments-grid-list">
            {completedPayments.map((order) => (
              <div key={order._id} className="payment-item-card">
                
                <div className="card-top-row">
                  <span className="category-badge-pill">
                    {order.goods?.category || 'General Goods'}
                  </span>
                  <span className="status-reconciled-pill">
                    Paid / Reconciled
                  </span>
                </div>

                <div className="route-details-panel">
                  <div>
                    <span className="route-point-label pickup-color">PICKUP POINT</span>
                    <p className="route-address-text">{order.pickup?.address || 'N/A'}</p>
                  </div>
                  <div className="route-point-divider"></div>
                  <div>
                    <span className="route-point-label drop-color">DESTINATION POINT</span>
                    <p className="route-address-text">{order.drop?.address || 'N/A'}</p>
                  </div>
                </div>

                <div className="card-meta-row">
                  <span className="meta-label">Merchant Partner: <strong className="meta-value">{order.shop_owner_id?.name || 'N/A'}</strong></span>
                  <span className="meta-label">Settled Fare: <strong className="fare-value">+₹{order.estimated_fare || order.final_fare || 0}</strong></span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoaderPaymentHistory;
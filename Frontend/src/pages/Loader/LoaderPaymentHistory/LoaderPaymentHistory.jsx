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
    console.log("⚡ PaymentHistory component mounted!");
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      console.log("🔄 Fetching payments...");
      const response = await fetchLoaderPaymentHistoryApi();
      console.log("✅ Data received in component:", response);
      
      setCompletedPayments(response?.data || []);
      setTotalEarnings(response?.total_earnings || 0);
    } catch (err) {
      console.error("❌ Error loading payments:", err);
      setErrorMessage(err.message || 'Failed to load payment history.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="payment-history-wrapper">
      <nav className="payment-nav">
        <button className="back-btn" onClick={() => navigate('/loader/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>💳 Payment & Earnings History</h2>
      </nav>

      <div className="payment-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        <div className="earnings-summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-info">
            <span>Total Lifetime Earnings</span>
            <h2>₹{totalEarnings}</h2>
            <p>{completedPayments.length} Completed & Paid Deliveries</p>
          </div>
        </div>

        <div className="history-section-header">
          <h3>Completed Payments List</h3>
          <button className="refresh-btn" onClick={fetchPayments}>Refresh 🔄</button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading payments...</p>
          </div>
        ) : completedPayments.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Payments Found</h3>
            <p>Abhi tak koi bhi completed ya paid order nahi hai.</p>
          </div>
        ) : (
          <div className="payments-grid">
            {completedPayments.map((order) => (
              <div key={order._id} className="payment-card">
                <div className="card-top-info">
                  <span className="category-tag">{order.goods?.category || 'General Goods'}</span>
                  <span className="status-paid-tag">PAID ✓</span>
                </div>

                <div className="route-details-mini">
                  <p><strong>From:</strong> {order.pickup?.address || 'N/A'}</p>
                  <p><strong>To:</strong> {order.drop?.address || 'N/A'}</p>
                </div>

                <div className="card-footer-info">
                  <span>Shop Owner: <strong>{order.shop_owner_id?.name || 'N/A'}</strong></span>
                  <strong className="fare-amount">+₹{order.estimated_fare || order.final_fare || 0}</strong>
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
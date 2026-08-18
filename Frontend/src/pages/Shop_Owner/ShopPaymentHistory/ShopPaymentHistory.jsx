import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchShopPaymentHistoryApi } from '../../../api/shopOwnerAPI'; // 👈 Dedicated API function imported
import './ShopPaymentHistory.css';

const ShopPaymentHistory = () => {
  const navigate = useNavigate();
  const [completedPayments, setCompletedPayments] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // 🚀 Dedicated API function call
      const response = await fetchShopPaymentHistoryApi();

      const paymentList = response?.data || response?.payments || response || [];
      const validPayments = Array.isArray(paymentList) ? paymentList : [];

      setCompletedPayments(validPayments);

      // Total amount calculate karein
      const sum = validPayments.reduce((acc, curr) => {
        return acc + (Number(curr.estimated_fare) || Number(curr.amount) || 0);
      }, 0);
      
      setTotalSpent(sum);

    } catch (err) {
      console.error("Error fetching payment history:", err);
      setErrorMessage(err.message || 'Failed to load payment history.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shop-payment-history-wrapper">
      <nav className="shop-payment-nav">
        <button className="back-btn" onClick={() => navigate('/shop/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>💳 Payment & Transaction History</h2>
      </nav>

      <div className="shop-payment-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        {/* Summary Card */}
        <div className="earnings-summary-card">
          <div className="summary-icon">💸</div>
          <div className="summary-info">
            <span>Total Payments Made</span>
            <h2>₹{totalSpent}</h2>
            <p>{completedPayments.length} Total Transactions</p>
          </div>
        </div>

        <div className="history-section-header">
          <h3>Transaction History List</h3>
          <button className="refresh-btn" onClick={loadPaymentHistory}>Refresh 🔄</button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading payment history...</p>
          </div>
        ) : completedPayments.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Transactions Found</h3>
            <p>Abhi tak koi bhi payment history available nahi hai.</p>
          </div>
        ) : (
          <div className="payments-grid">
            {completedPayments.map((order) => {
              const amount = order.estimated_fare || order.amount || 0;
              const date = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              const loaderName = order.loader_id?.name || 'N/A';
              const loaderPhone = order.loader_id?.phone || 'N/A';
              const vehicleReg = order.vehicle_id?.registration_number || 'N/A';
              const vehicleType = order.vehicle_id?.vehicle_type || order.vehicle_type_requested || 'Vehicle';

              return (
                <div key={order._id} className="payment-card">
                  
                  {/* Top Bar */}
                  <div className="card-top-info">
                    <span className="category-tag">{order.goods?.category || 'General Goods'}</span>
                    <span className="status-paid-tag">
                      {order.payment_status ? order.payment_status.toUpperCase() : 'PAID'} ({order.payment_method ? order.payment_method.toUpperCase() : 'CASH'})
                    </span>
                  </div>

                  {/* Route Addresses */}
                  <div className="route-details-mini">
                    <p><strong>📍 From:</strong> {order.pickup?.address || 'N/A'}</p>
                    <p><strong>🏁 To:</strong> {order.drop?.address || 'N/A'}</p>
                  </div>

                  {/* Driver & Vehicle Info */}
                  <div className="card-driver-info">
                    <p style={{ margin: '0 0 4px 0' }}><strong>Driver:</strong> {loaderName} ({loaderPhone})</p>
                    <p style={{ margin: 0 }}><strong>Vehicle:</strong> {vehicleType.replace('_', ' ').toUpperCase()} ({vehicleReg})</p>
                  </div>

                  {/* Footer Meta & Amount */}
                  <div className="card-footer-info">
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Date: {date}</span>
                    <strong className="fare-amount">₹{amount}</strong>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPaymentHistory;
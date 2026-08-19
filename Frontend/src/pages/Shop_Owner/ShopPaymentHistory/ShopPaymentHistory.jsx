import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchShopPaymentHistoryApi } from '../../../api/shopOwnerAPI';
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
      const response = await fetchShopPaymentHistoryApi();

      const paymentList = response?.data || response?.payments || response || [];
      const validPayments = Array.isArray(paymentList) ? paymentList : [];

      setCompletedPayments(validPayments);

      const sum = validPayments.reduce((acc, curr) => {
        return acc + (Number(curr.estimated_fare) || Number(curr.amount) || 0);
      }, 0);
      
      setTotalSpent(sum);

    } catch (err) {
      console.error("Error fetching payment history:", err);
      setErrorMessage(err.message || 'Failed to retrieve transaction ledger records.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shop-payment-history-wrapper">
      
      {/* Navbar */}
      <nav className="shop-payment-nav">
        <div className="nav-brand-group">
          <button className="back-btn" onClick={() => navigate('/shop/dashboard')}>
            Back
          </button>
          <div className="nav-divider-vertical"></div>
          <span className="navbar-subtitle">Financial Ledger</span>
        </div>
        <h2 className="navbar-heading">Payment & Transaction History</h2>
      </nav>

      <div className="shop-payment-container">
        
        {errorMessage && (
          <div className="error-alert-box">
            <span className="error-dot"></span>
            {errorMessage}
          </div>
        )}

        {/* Summary Card */}
        <div className="earnings-summary-card">
          <div className="summary-info-stack">
            <span className="summary-label-text">Total Outbound Escrow & Payments</span>
            <h2 className="total-spent-heading">₹{totalSpent}</h2>
            <p className="summary-stat-text">{completedPayments.length} Total Settled Transactions</p>
          </div>
          <button className="refresh-feed-btn" onClick={loadPaymentHistory}>
            Refresh Ledger
          </button>
        </div>

        <div className="section-header-row">
          <h3 className="section-title-heading">Transaction History List</h3>
        </div>

        {isLoading ? (
          <div className="loading-state-box">
            <p>Loading transaction history records...</p>
          </div>
        ) : completedPayments.length === 0 ? (
          <div className="empty-state-box">
            <h4 className="empty-title">No Transaction Records Found</h4>
            <p className="empty-desc">No payment logs or completed freight reconciliations are currently available.</p>
          </div>
        ) : (
          <div className="payments-grid-list">
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
                <div key={order._id} className="payment-item-card">
                  
                  {/* Top Bar */}
                  <div className="card-top-row">
                    <span className="category-badge-pill">{order.goods?.category || 'General Freight'}</span>
                    <span className="status-reconciled-pill">
                      {order.payment_status ? order.payment_status.toUpperCase() : 'PAID'} ({order.payment_method ? order.payment_method.toUpperCase() : 'CASH'})
                    </span>
                  </div>

                  {/* Route Addresses */}
                  <div className="route-details-panel">
                    <div>
                      <span className="route-point-label pickup-color">ORIGIN POINT</span>
                      <p className="route-address-text">{order.pickup?.address || 'N/A'}</p>
                    </div>
                    <div className="route-point-divider"></div>
                    <div>
                      <span className="route-point-label drop-color">DESTINATION POINT</span>
                      <p className="route-address-text">{order.drop?.address || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Driver & Vehicle Info */}
                  <div className="driver-info-panel">
                    <div className="driver-info-row">
                      <span className="info-key">Assigned Operator:</span>
                      <strong className="info-val">{loaderName} ({loaderPhone})</strong>
                    </div>
                    <div className="driver-info-row">
                      <span className="info-key">Transport Asset:</span>
                      <strong className="info-val vehicle-caps">{typeof vehicleType === 'string' ? vehicleType.replace('_', ' ') : 'Vehicle'} ({vehicleReg})</strong>
                    </div>
                  </div>

                  {/* Footer Meta & Amount */}
                  <div className="card-meta-row">
                    <span className="timestamp-meta-text">Timestamp: {date}</span>
                    <strong className="fare-amount-val">₹{amount}</strong>
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
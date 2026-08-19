import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAcceptedOrdersApi } from '../../../api/api';
import './AcceptedOrders.css';

const AcceptedOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      navigate('/login');
      return;
    }

    if (user.role !== 'loader') {
      setErrorMessage('Access restricted to verified delivery partners.');
      setIsLoading(false);
      return;
    }

    loadAcceptedOrders();
  }, [navigate]);

  const loadAcceptedOrders = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchAcceptedOrdersApi();
      const orderList = response.data || response || [];
      
      // Filter out orders whose payment has already been cleared (is_paid === true)
      const activeDeliveries = orderList.filter(o => {
        const isActiveStatus = ['accepted', 'in_transit', 'arrived', 'delivered'].includes(o.status);
        const isNotPaid = o.is_paid === false || o.is_paid === undefined;
        return isActiveStatus && isNotPaid;
      });

      setOrders(activeDeliveries);
    } catch (error) {
      console.error("Error fetching accepted orders:", error);
      setErrorMessage(error.message || 'Failed to fetch your accepted orders.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="accepted-wrapper">
      
      {/* Navbar */}
      <nav className="accepted-nav">
        <button className="back-btn" onClick={() => navigate('/loader/dashboard')}>
          Back to Dashboard
        </button>
        <h2 className="nav-title">Active Deliveries Management</h2>
      </nav>

      <div className="accepted-container">
        
        {errorMessage && (
          <div className="error-alert">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <p>Loading active assignments...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No Active Assignments</h3>
            <p>You have no pending assignments awaiting financial clearance.</p>
            <button className="explore-btn" onClick={() => navigate('/orders')}>
              Explore Available Loads
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                
                <div className="order-card-header">
                  <span className="category-badge">
                    {order.goods?.category || 'General Goods'}
                  </span>
                  <span className="status-badge">
                    {order.status ? order.status.replace('_', ' ') : 'ACCEPTED'}
                  </span>
                </div>

                <div className="route-info">
                  <div className="route-point">
                    <span className="route-point-title pickup-title">PICKUP POINT</span>
                    <p className="route-address">{order.pickup?.address || 'Pickup Location'}</p>
                  </div>
                  <div className="route-divider">
                    <span className="route-point-title drop-title">DESTINATION POINT</span>
                    <p className="route-address">{order.drop?.address || 'Drop Location'}</p>
                  </div>
                </div>

                <div className="order-specs">
                  <span className="spec-item">Weight: <strong className="spec-value">{order.goods?.weight_kg || 0} KG</strong></span>
                  <span className="spec-item">Estimated Fare: <strong className="fare-value">₹{order.estimated_fare || 'N/A'}</strong></span>
                </div>

                <div>
                  <button 
                    className="details-btn"
                    onClick={() => navigate('/order-details', { state: { orderId: order._id, order } })}
                  >
                    View Details & Track Progress
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AcceptedOrders;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNearbyOrdersApi, getAllVehiclesApi, acceptOrderApi } from '../../../api/api';
import './ActiveLoads.css';

const ActiveLoads = () => {
  const navigate = useNavigate();
  const [loads, setLoads] = useState([]);
  const [loaderVehicle, setLoaderVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      navigate('/login');
      return;
    }

    if (user.role !== 'loader') {
      setErrorMessage('Only loaders can access this page.');
      setIsLoading(false);
      return;
    }

    loadPageData();
  }, [navigate]);

  const loadPageData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Fetch loader vehicle using separate API function
      const vehicleRes = await getAllVehiclesApi();
      const vehicleData = vehicleRes.data;

      if (!vehicleData) {
        setErrorMessage('You must register a vehicle before viewing or accepting orders.');
        setIsLoading(false);
        return;
      }
      setLoaderVehicle(vehicleData);
      

      // 2. Fetch nearby orders using separate API function
      const ordersRes = await fetchNearbyOrdersApi();
      setLoads(ordersRes.data || []);
    } catch (error) {
      console.error("Initialization error:", error);
      setErrorMessage(error.message || 'Failed to load data. Please ensure your vehicle is registered.');
    } finally {
      setIsLoading(false);
    }
  };
  console.log(loaderVehicle)
  const handleAcceptOrder = async (orderId) => {
    if (!loaderVehicle || !loaderVehicle[0]._id) {
      setErrorMessage('No vehicle found. You cannot accept orders without a registered vehicle.');
      return;
    }

    setAcceptingId(orderId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Calling separate API function for accepting order
      const response = await acceptOrderApi(orderId, loaderVehicle[0]._id);
      
      setSuccessMessage(response.message || 'Order accepted successfully!');
      setLoads(loads.filter(order => order._id !== orderId));
    } catch (error) {
      console.error("Error accepting order:", error);
      setErrorMessage(error.message || 'Failed to accept this order.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="active-loads-wrapper">
      
      <nav className="loads-navbar">
        <button className="back-btn" onClick={() => navigate('/loader/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>Nearby Active Orders 📦</h2>
      </nav>

      <div className="loads-container">
        
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}
        {successMessage && <div className="alert success-alert">{successMessage}</div>}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Scanning nearby orders matching your vehicle...</p>
          </div>
        ) : loads.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Active Orders Nearby</h3>
            <p>No matching delivery requests found within your range right now.</p>
          </div>
        ) : (
          <div className="loads-grid">
            {loads.map((order) => (
              <div key={order._id} className="load-card">
                
                <div className="load-card-header">
                  <span className="load-type-badge">{order.goods?.category || 'General Goods'}</span>
                  <span className="load-budget">₹{order.estimated_fare || 'N/A'}</span>
                </div>

                <div className="load-route">
                  <div className="route-point pickup">
                    <span className="dot-indicator green"></span>
                    <div>
                      <small>PICKUP</small>
                      <p>{order.pickup?.address || 'Pickup Location'}</p>
                    </div>
                  </div>

                  <div className="route-line"></div>

                  <div className="route-point drop">
                    <span className="dot-indicator red"></span>
                    <div>
                      <small>DROP-OFF</small>
                      <p>{order.drop?.address || 'Drop Location'}</p>
                    </div>
                  </div>
                </div>

                <div className="load-specs">
                  <div className="spec-item">
                    <span>Weight:</span>
                    <strong>{order.goods?.weight_kg || 0} KG</strong>
                  </div>
                  <div className="spec-item">
                    <span>Vehicle Needed:</span>
                    <strong>{order.vehicle_type_requested ? order.vehicle_type_requested.replace('_', ' ') : 'Any'}</strong>
                  </div>
                </div>

                <button 
                  className="accept-btn" 
                  onClick={() => handleAcceptOrder(order._id)}
                  disabled={acceptingId === order._id || !loaderVehicle}
                >
                  {acceptingId === order._id ? 'Verifying & Accepting...' : 'Accept Order 🚀'}
                </button>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ActiveLoads;
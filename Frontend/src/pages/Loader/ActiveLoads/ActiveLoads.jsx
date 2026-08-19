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
      setErrorMessage('Access restricted to verified delivery partners.');
      setIsLoading(false);
      return;
    }

    loadPageData();
  }, [navigate]);

  const loadPageData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const vehicleRes = await getAllVehiclesApi();
      const vehicleData = vehicleRes.data;

      if (!vehicleData) {
        setErrorMessage('Vehicle registration is required before reviewing available orders.');
        setIsLoading(false);
        return;
      }
      setLoaderVehicle(vehicleData);
      
      const ordersRes = await fetchNearbyOrdersApi();
      setLoads(ordersRes.data || []);
    } catch (error) {
      console.error("Initialization error:", error);
      setErrorMessage(error.message || 'Failed to load active load feeds.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (!loaderVehicle || !loaderVehicle[0]?._id) {
      setErrorMessage('No registered vehicle detected. Assignment refused.');
      return;
    }

    setAcceptingId(orderId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await acceptOrderApi(orderId, loaderVehicle[0]._id);
      
      setSuccessMessage(response.message || 'Order assignment confirmed successfully.');
      setLoads(loads.filter(order => order._id !== orderId));
    } catch (error) {
      console.error("Error accepting order:", error);
      setErrorMessage(error.message || 'Failed to accept this assignment.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="active-loads-wrapper">
      
      {/* Navbar */}
      <nav className="loads-navbar">
        <button 
          className="back-btn"
          onClick={() => navigate('/loader/dashboard')}
        >
          Back to Dashboard
        </button>
        <h2 className="navbar-title">Nearby Available Loads</h2>
      </nav>

      <div className="loads-container">
        
        {errorMessage && (
          <div className="error-alert">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="success-alert">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <p>Scanning matching requests in your zone...</p>
          </div>
        ) : loads.length === 0 ? (
          <div className="empty-state">
            <h3>No Available Loads Nearby</h3>
            <p>There are currently no matching delivery requests within range.</p>
          </div>
        ) : (
          <div className="loads-grid">
            {loads.map((order) => (
              <div key={order._id} className="load-card">
                
                <div className="load-card-header">
                  <span className="category-badge">
                    {order.goods?.category || 'General Goods'}
                  </span>
                  <span className="load-fare">
                    ₹{order.estimated_fare || 'N/A'}
                  </span>
                </div>

                <div className="route-info-box">
                  <div className="route-segment">
                    <span className="route-label pickup-label">PICKUP LOCATION</span>
                    <p className="route-text">{order.pickup?.address || 'Pickup Location'}</p>
                  </div>
                  <div className="route-divider">
                    <span className="route-label drop-label">DESTINATION LOCATION</span>
                    <p className="route-text">{order.drop?.address || 'Drop Location'}</p>
                  </div>
                </div>

                <div className="load-specs-footer">
                  <span className="spec-label">Weight: <strong className="spec-value">{order.goods?.weight_kg || 0} KG</strong></span>
                  <span className="spec-label">Vehicle Class: <strong className="spec-value vehicle-class">{order.vehicle_type_requested ? order.vehicle_type_requested.replace('_', ' ') : 'Any'}</strong></span>
                </div>

                <div>
                  <button 
                    onClick={() => handleAcceptOrder(order._id)}
                    disabled={acceptingId === order._id || !loaderVehicle}
                    className={`accept-assignment-btn ${acceptingId === order._id ? 'is-loading' : ''}`}
                  >
                    {acceptingId === order._id ? 'Processing Assignment...' : 'Accept Assignment'}
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

export default ActiveLoads;
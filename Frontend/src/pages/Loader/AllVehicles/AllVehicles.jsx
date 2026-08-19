import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllVehiclesApi, updateVehicleAvailabilityApi } from '../../../api/api';
import './AllVehicles.css';

const AllVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchAllVehicles();
  }, []);

  const fetchAllVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await getAllVehiclesApi();
      setVehicles(response.data || []);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to fetch vehicles.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (vehicleId, currentStatus) => {
    const newStatus = !currentStatus;
    setUpdatingId(vehicleId);
    setErrorMessage('');

    try {
      setVehicles(vehicles.map(v => v._id === vehicleId ? { ...v, is_available: newStatus } : v));
      await updateVehicleAvailabilityApi(vehicleId, newStatus);
    } catch (error) {
      console.error("Failed to update status", error);
      setVehicles(vehicles.map(v => v._id === vehicleId ? { ...v, is_available: currentStatus } : v));
      setErrorMessage('Failed to update vehicle availability status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http')) return photoUrl;
    const cleanPath = photoUrl.replace(/\\/g, "/").replace(/^\/+/, '');
    return `http://localhost:8000/${cleanPath}`;
  };

  return (
    <div className="vehicles-page-wrapper">
      <div className="vehicles-content-container">
        
        <div className="vehicles-nav-section">
          <button 
            onClick={() => navigate('/loader/dashboard')}
            className="back-btn"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="vehicles-title-box">
          <h2 className="page-heading">Fleet Management</h2>
          <p className="page-subheading">Review and manage registered platform transport assets.</p>
        </div>

        {errorMessage && (
          <div className="error-alert-box">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="loading-state-box">
            <p>Loading fleet records...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="empty-state-box">
            <p className="empty-text">No vehicles registered in the system database.</p>
          </div>
        ) : (
          <div className="vehicles-grid-list">
            {vehicles.map((vehicle) => {
              const fullImgUrl = getImageUrl(vehicle.vehicle_photo_url);

              return (
                <div key={vehicle._id} className="vehicle-item-card">
                  
                  <div className="vehicle-left-group">
                    <div className="vehicle-image-wrapper">
                      {fullImgUrl ? (
                        <img src={fullImgUrl} alt="Vehicle Asset" className="vehicle-actual-img" />
                      ) : (
                        <span className="vehicle-img-placeholder">ASSET</span>
                      )}
                    </div>

                    <div>
                      <span className="vehicle-type-category">
                        {vehicle.vehicle_type ? vehicle.vehicle_type.replace('_', ' ') : 'VEHICLE'}
                      </span>
                      <h3 className="vehicle-reg-number">{vehicle.registration_number}</h3>
                      <span className="vehicle-capacity-text">Capacity: <strong className="capacity-value">{vehicle.capacity_kg} KG</strong></span>
                    </div>
                  </div>

                  <div className="vehicle-right-group">
                    <span className={`document-status-pill ${vehicle.document_status === 'verified' ? 'status-verified' : 'status-pending'}`}>
                      {vehicle.document_status || 'pending'}
                    </span>

                    <div className="availability-control-box">
                      <span className={`availability-state-text ${vehicle.is_available ? 'state-available' : 'state-unavailable'}`}>
                        {vehicle.is_available ? 'Available' : 'Unavailable'}
                      </span>

                      <label className="toggle-switch-container">
                        <input 
                          type="checkbox" 
                          checked={vehicle.is_available} 
                          onChange={() => handleToggle(vehicle._id, vehicle.is_available)}
                          disabled={updatingId === vehicle._id}
                          className="toggle-checkbox-input"
                        />
                        <span className={`toggle-slider-round ${vehicle.is_available ? 'checked-bg' : ''}`}>
                          <span className={`toggle-slider-thumb ${vehicle.is_available ? 'checked-pos' : ''}`}></span>
                        </span>
                      </label>
                    </div>
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

export default AllVehicles;
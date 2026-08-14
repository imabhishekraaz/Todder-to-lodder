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

  // Toggle Availability Function
  const handleToggle = async (vehicleId, currentStatus) => {
    const newStatus = !currentStatus;
    setUpdatingId(vehicleId);

    try {
      // Optimistic UI update
      setVehicles(vehicles.map(v => v._id === vehicleId ? { ...v, is_available: newStatus } : v));

      // Backend API call
      await updateVehicleAvailabilityApi(vehicleId, newStatus);
    } catch (error) {
      console.error("Failed to update status", error);
      // Revert if failed
      setVehicles(vehicles.map(v => v._id === vehicleId ? { ...v, is_available: currentStatus } : v));
      alert('Failed to update vehicle availability.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Image URL fix karne ka helper function (Windows backslash aur local path fix)
  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http')) return photoUrl;
    
    // Backslashes ko forward slashes mein badalna aur leading slash hatana
    const cleanPath = photoUrl.replace(/\\/g, "/").replace(/^\/+/, '');
    return `http://localhost:8000/${cleanPath}`;
  };

  return (
    <div className="vehicles-wrapper">
      <div className="vehicles-container">
        
        {/* Top Header */}
        <div className="vehicles-header">
          <button className="back-button" onClick={() => navigate('/loader/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="title-section">
          <h2>All System Vehicles 🚚</h2>
          <p>Complete fleet details registered across the platform.</p>
        </div>

        {errorMessage && <div className="message-box error-box">{errorMessage}</div>}

        {/* Loading State */}
        {isLoading ? (
          <div className="loading-state">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          /* Empty State */
          <div className="empty-state">
            <p>No vehicles registered in the system yet.</p>
          </div>
        ) : (
          /* Vehicles List Grid/Cards */
          <div className="vehicles-list">
            {vehicles.map((vehicle) => {
              const fullImgUrl = getImageUrl(vehicle.vehicle_photo_url);

              return (
                <div key={vehicle._id} className="vehicle-card">
                  
                  {/* Vehicle Photo */}
                  <div className="vehicle-img-box">
                    {fullImgUrl ? (
                      <img src={fullImgUrl} alt="Vehicle" className="vehicle-img" />
                    ) : (
                      <div className="placeholder-img">🚛</div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="vehicle-info">
                    <div className="vehicle-type-badge">
                      {vehicle.vehicle_type ? vehicle.vehicle_type.replace('_', ' ').toUpperCase() : 'VEHICLE'}
                    </div>
                    
                    <h3 className="reg-number">{vehicle.registration_number}</h3>
                    <p className="capacity">Capacity: <strong>{vehicle.capacity_kg} KG</strong></p>
                    
                    <div className="status-badge-row">
                      <span className={`status-pill ${vehicle.document_status || 'pending'}`}>
                        {(vehicle.document_status || 'pending').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Availability Toggle Switch & Location */}
                  <div className="availability-box">
                    <span className={`availability-text ${vehicle.is_available ? 'online' : 'offline'}`}>
                      {vehicle.is_available ? 'Available' : 'Unavailable'}
                    </span>

                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={vehicle.is_available} 
                        onChange={() => handleToggle(vehicle._id, vehicle.is_available)}
                        disabled={updatingId === vehicle._id}
                      />
                      <span className="slider round"></span>
                    </label>

                    {/* <span className="location-info">
                      📍 [{vehicle.current_location?.coordinates?.[0]?.toFixed(2) || 0}, {vehicle.current_location?.coordinates?.[1]?.toFixed(2) || 0}]
                    </span> */}
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
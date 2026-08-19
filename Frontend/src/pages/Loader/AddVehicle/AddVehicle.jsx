import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addVehicleApi } from '../../../api/api'; 
import './AddVehicle.css';

const AddVehicle = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    vehicle_type: 'mini_truck',
    registration_number: '',
    capacity_kg: '',
    fare_per_km: '15'
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [coordinates, setCoordinates] = useState([0, 0]); 
  const [locationStatus, setLocationStatus] = useState('Fetching live position...');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates([position.coords.longitude, position.coords.latitude]);
          setLocationStatus('Live location synchronized successfully.');
        },
        (error) => {
          console.error("Location error:", error);
          setLocationStatus('Location access restricted. Falling back to default coordinates.');
        }
      );
    } else {
      setLocationStatus('Geolocation not supported by client browser.');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
      setErrorMessage('');
    } else {
      setErrorMessage('Please upload a valid image asset only.');
    }
  };

  const removePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const statusToApply = selectedFile ? 'verified' : 'pending';

      const submitData = new FormData();
      submitData.append('vehicle_type', formData.vehicle_type);
      submitData.append('registration_number', formData.registration_number);
      submitData.append('capacity_kg', Number(formData.capacity_kg));
      submitData.append('fare_per_km', Number(formData.fare_per_km));
      submitData.append('document_status', statusToApply);
      submitData.append('is_available', false);
      
      submitData.append('current_location', JSON.stringify({ 
        type: 'Point', 
        coordinates: coordinates 
      }));
      
      if (selectedFile) {
        submitData.append('vehicle_photo', selectedFile); 
      }
      
      await addVehicleApi(submitData);
      
      setSuccessMessage(`Vehicle registered successfully. Status: ${statusToApply.toUpperCase()}.`);
      
      setTimeout(() => {
        navigate('/loader/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error adding vehicle:', error);
      setErrorMessage(error.message || 'Failed to register vehicle credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-vehicle-wrapper">
      <div className="add-vehicle-container">
        
        <button 
          type="button" 
          onClick={() => navigate('/loader/dashboard')}
          className="back-btn"
        >
          Back to Dashboard
        </button>

        <div className="form-header-box">
          <h2 className="form-title">Vehicle Registration</h2>
          <p className="form-subtitle">Register your transport asset to unlock matching load assignments.</p>
        </div>

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

        <form onSubmit={handleSubmit} className="vehicle-registration-form">
          
          <div className="input-group">
            <label htmlFor="vehicle_type" className="input-label">Vehicle Classification</label>
            <select 
              id="vehicle_type" 
              name="vehicle_type" 
              value={formData.vehicle_type} 
              onChange={handleChange} 
              className="form-input-field select-field"
            >
              <option value="mini_truck">Mini Truck</option>
              <option value="tempo">Tempo</option>
              <option value="pickup">Pickup</option>
              <option value="e_cart">Electric Cart (E-Cart)</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="registration_number" className="input-label">Registration Number Plate</label>
            <input 
              type="text" 
              id="registration_number" 
              name="registration_number" 
              placeholder="e.g. MH 12 AB 1234" 
              value={formData.registration_number} 
              onChange={handleChange} 
              required 
              className="form-input-field"
            />
          </div>

          <div className="input-group">
            <label htmlFor="capacity_kg" className="input-label">Maximum Payload Capacity (KG)</label>
            <input 
              type="number" 
              id="capacity_kg" 
              name="capacity_kg" 
              placeholder="e.g. 500" 
              value={formData.capacity_kg} 
              onChange={handleChange} 
              required 
              className="form-input-field"
            />
          </div>

          <div className="input-group">
            <label htmlFor="fare_per_km" className="input-label">Tariff Rate Per Kilometer (₹)</label>
            <input 
              type="number" 
              id="fare_per_km" 
              name="fare_per_km" 
              placeholder="e.g. 15" 
              value={formData.fare_per_km} 
              onChange={handleChange} 
              required 
              className="form-input-field"
            />
          </div>

          <div className={`location-status-text ${coordinates[0] !== 0 ? 'synced' : 'pending'}`}>
            Status: {locationStatus}
          </div>

          <div className="input-group">
            <label className="input-label">Asset Visual Verification (Required for Fast-Track Verification)</label>
            
            {!previewUrl ? (
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`dropzone-box ${dragActive ? 'drag-active' : ''}`}
              >
                <p className="dropzone-main-text">Drag and drop vehicle photograph here</p>
                <span className="dropzone-link-text">Browse local storage</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden-file-input"
                />
              </div>
            ) : (
              <div className="preview-container-box">
                <div className="preview-info-wrapper">
                  <img src={previewUrl} alt="Asset Preview" className="preview-thumbnail" />
                  <div>
                    <span className="preview-file-name">{selectedFile?.name || 'asset_photograph.jpg'}</span>
                    <span className="preview-status-text">Ready for transmission</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={removePhoto} 
                  className="remove-photo-btn"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`submit-asset-btn ${isLoading ? 'is-loading' : ''}`}
          >
            {isLoading ? 'Registering Asset...' : 'Submit Vehicle Credentials'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
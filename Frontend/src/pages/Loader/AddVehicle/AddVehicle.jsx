import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addVehicleApi } from '../../../api/api'; 
import './AddVehicle.css';

const AddVehicle = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    vehicle_type: 'mini_truck',
    registration_number: '',
    capacity_kg: ''
  });
  
  // Photo upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- NEW: Location State ---
  const [coordinates, setCoordinates] = useState([0, 0]); // Default [lng, lat]
  const [locationStatus, setLocationStatus] = useState('Fetching live location...');

  // Component load hote hi location fetch karega
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // MongoDB expects [longitude, latitude]
          setCoordinates([position.coords.longitude, position.coords.latitude]);
          setLocationStatus('📍 Live location captured successfully');
        },
        (error) => {
          console.error("Location error:", error);
          setLocationStatus('⚠️ Location access denied. Using default (0,0).');
        }
      );
    } else {
      setLocationStatus('⚠️ Geolocation not supported by browser.');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // --- Drag and Drop Logic Start ---
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
      setErrorMessage('Please upload an image file only.');
    }
  };

  const removePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };
  // --- Drag and Drop Logic End ---

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const statusToApply = selectedFile ? 'verified' : 'pending';

      const submitData = new FormData();
      submitData.append('vehicle_type', formData.vehicle_type);
      submitData.append('registration_number', formData.registration_number);
      submitData.append('capacity_kg', Number(formData.capacity_kg));
      submitData.append('document_status', statusToApply);
      submitData.append('is_available', false);
      
      // --- NEW: Bhejte waqt real coordinates bhej rahe hain ---
      submitData.append('current_location', JSON.stringify({ 
        type: 'Point', 
        coordinates: coordinates 
      }));
      
      if (selectedFile) {
        submitData.append('vehicle_photo', selectedFile); 
      }
      
      await addVehicleApi(submitData);
      
      setSuccessMessage(`Vehicle added successfully! Status is ${statusToApply}.`);
      
      setTimeout(() => {
        navigate('/loader/loader/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error adding vehicle:', error);
      setErrorMessage(error.message || 'Failed to add vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-vehicle-wrapper">
      <div className="add-vehicle-card">
        
        <button type="button" className="back-button" onClick={() => navigate('/loader/dashboard')}>
          ← Back to Dashboard
        </button>

        <div className="form-header">
          <h2>Add Your Vehicle 🚚</h2>
          <p>Register your vehicle details to start getting delivery loads.</p>
        </div>

        {errorMessage && <div className="message-box error-box">{errorMessage}</div>}
        {successMessage && <div className="message-box success-box">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="vehicle-form">
          
          <div className="input-group">
            <label htmlFor="vehicle_type">Vehicle Type</label>
            <select id="vehicle_type" name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="form-control">
              <option value="mini_truck">Mini Truck</option>
              <option value="tempo">Tempo</option>
              <option value="pickup">Pickup</option>
              <option value="e_cart">E-Cart (Electric)</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="registration_number">Vehicle Number Plate</label>
            <input type="text" id="registration_number" name="registration_number" placeholder="e.g. MH 12 AB 1234" value={formData.registration_number} onChange={handleChange} required className="form-control" />
          </div>

          <div className="input-group">
            <label htmlFor="capacity_kg">Max Load Capacity (in KG)</label>
            <input type="number" id="capacity_kg" name="capacity_kg" placeholder="e.g. 500" value={formData.capacity_kg} onChange={handleChange} required className="form-control" />
          </div>

          {/* Location Status Indicator */}
          <div style={{ fontSize: '13px', color: coordinates[0] !== 0 ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
            {locationStatus}
          </div>

          {/* Premium Drag & Drop File Upload Section */}
          <div className="input-group">
            <label>Vehicle Photo (Required for Auto-Verify)</label>
            
            {!previewUrl ? (
              <div 
                className={`dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <div className="dropzone-content">
                  <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="dropzone-text">Drag & drop your vehicle photo</p>
                  <span className="dropzone-btn">Browse Files</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="image-preview-card">
                <div className="preview-image-wrapper">
                  <img src={previewUrl} alt="Vehicle Preview" className="preview-image" />
                </div>
                <div className="preview-details">
                  <span className="file-name">{selectedFile?.name || 'vehicle_photo.jpg'}</span>
                  <span className="file-status">Ready to upload</span>
                </div>
                <button type="button" className="remove-btn" onClick={removePhoto} title="Remove Photo">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="submit-vehicle-btn" disabled={isLoading}>
            {isLoading ? 'Adding Vehicle...' : 'Register Vehicle'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
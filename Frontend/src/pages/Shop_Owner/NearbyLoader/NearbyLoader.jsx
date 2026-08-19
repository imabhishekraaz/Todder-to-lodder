import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNearbyLoadersApi, createOrderApi, createRazorpayOrderApi } from '../../../api/shopOwnerAPI';
import './NearbyLoader.css';

const NearbyLoader = () => {
  const navigate = useNavigate();

  const shopOwner = JSON.parse(localStorage.getItem('user') || '{}');

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null); 
  const [verifyingPickup, setVerifyingPickup] = useState(false);
  const [verifiedPickupName, setVerifiedPickupName] = useState('');
  
  const [dropAddress, setDropAddress] = useState('');
  const [dropCoords, setDropCoords] = useState(null);     
  const [verifyingDrop, setVerifyingDrop] = useState(false);
  const [verifiedDropName, setVerifiedDropName] = useState('');
  
  const [goodsCategory, setGoodsCategory] = useState('General Goods');
  const [weightKg, setWeightKg] = useState(10);
  const [goodsPhoto, setGoodsPhoto] = useState(null); 
  const [photoPreview, setPhotoPreview] = useState(null); 

  const [vehicleType, setVehicleType] = useState('mini_truck');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [nearbyLoaders, setNearbyLoaders] = useState([]);
  const [selectedLoaderId, setSelectedLoaderId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedFarePerKm, setSelectedFarePerKm] = useState(0); 
  
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingLoaders, setLoadingLoaders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const calculateAccurateDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c * 1.3).toFixed(1)); 
  };

  const handleGetPickupGPS = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser client.");
      return;
    }

    setLoadingLocation(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPickupCoords([lng, lat]);
        setLoadingLocation(false);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const placeName = data.display_name || "Current GPS Location";
          setVerifiedPickupName(placeName);
          setPickupAddress(placeName);
        } catch (e) {
          setVerifiedPickupName("Current GPS Location");
          setPickupAddress("Current GPS Location");
        }

        fetchNearbyLoaders(lng, lat, vehicleType);
      },
      (error) => {
        setLoadingLocation(false);
        setErrorMessage("Unable to retrieve location telemetry. Please check GPS permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleVerifyPickupAddress = async () => {
    if (!pickupAddress.trim()) {
      setErrorMessage("Please enter an origin pickup address first.");
      return;
    }
    setVerifyingPickup(true);
    setErrorMessage('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupAddress)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPickupCoords([lng, lat]);
        setVerifiedPickupName(data[0].display_name);
        fetchNearbyLoaders(lng, lat, vehicleType);
      } else {
        setErrorMessage("Could not verify pickup address specifications.");
      }
    } catch (err) {
      setErrorMessage("Failed to verify pickup address coordinates.");
    } finally {
      setVerifyingPickup(false);
    }
  };

  const handleVerifyDropAddress = async () => {
    if (!dropAddress.trim()) {
      setErrorMessage("Please enter a destination drop-off address to verify.");
      return;
    }

    setVerifyingDrop(true);
    setErrorMessage('');

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropAddress)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setDropCoords([lng, lat]);
        setVerifiedDropName(data[0].display_name);
      } else {
        setErrorMessage("Could not verify destination address. Provide a specific landmark.");
      }
    } catch (err) {
      setErrorMessage("Failed to resolve destination drop address.");
    } finally {
      setVerifyingDrop(false);
    }
  };

  const fetchNearbyLoaders = async (lng, lat, selectedType) => {
    if (!lng || !lat) return;

    setLoadingLoaders(true);
    try {
      const response = await fetchNearbyLoadersApi(lng, lat, selectedType);
      setNearbyLoaders(response.data || []);
    } catch (err) {
      console.error("Error fetching nearby loaders:", err);
      setErrorMessage(err.response?.data?.message || 'Failed to scan nearby driver partners.');
      setNearbyLoaders([]);
    } finally {
      setLoadingLoaders(false);
    }
  };

  const handleVehicleTypeChange = (e) => {
    const newType = e.target.value;
    setVehicleType(newType);
    setSelectedVehicleId('');
    setSelectedLoaderId('');
    setSelectedFarePerKm(0);
    if (pickupCoords) {
      fetchNearbyLoaders(pickupCoords[0], pickupCoords[1], newType);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGoodsPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSelectLoader = (vehicle) => {
    setSelectedVehicleId(vehicle._id);
    const loaderIdValue = vehicle.loader_id?._id || vehicle.loader_id;
    setSelectedLoaderId(loaderIdValue);
    setSelectedFarePerKm(vehicle.fare_per_km || 0); 
  };

  const distanceKm = pickupCoords && dropCoords ? calculateAccurateDistanceKm(pickupCoords[1], pickupCoords[0], dropCoords[1], dropCoords[0]) : 0;
  
  const calculatedTotalFare = (selectedFarePerKm > 0 && distanceKm > 0) 
    ? Math.max(Math.round(distanceKm * selectedFarePerKm), 50) 
    : 0;

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!pickupCoords) {
      setErrorMessage("Please capture or verify your pickup location first.");
      return;
    }
    if (!dropCoords) {
      setErrorMessage("Please verify your drop-off destination first.");
      return;
    }
    if (!selectedLoaderId || !selectedVehicleId) {
      setErrorMessage("Please select an available driver partner from the active fleet.");
      return;
    }
    if (calculatedTotalFare <= 0) {
      setErrorMessage("Invalid calculated tariff fare. Please review route distance.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const buildFormDataPayload = (paymentInfo = null) => {
        const formData = new FormData();
        formData.append('pickup[address]', verifiedPickupName || pickupAddress);
        formData.append('pickup[location][type]', 'Point');
        formData.append('pickup[location][coordinates][0]', pickupCoords[0]);
        formData.append('pickup[location][coordinates][1]', pickupCoords[1]);

        formData.append('drop[address]', verifiedDropName || dropAddress);
        formData.append('drop[location][type]', 'Point');
        formData.append('drop[location][coordinates][0]', dropCoords[0]);
        formData.append('drop[location][coordinates][1]', dropCoords[1]);

        formData.append('goods[category]', goodsCategory);
        formData.append('goods[weight_kg]', Number(weightKg));
        if (goodsPhoto) {
          formData.append('goods_photo', goodsPhoto); 
        }

        formData.append('vehicle_type_requested', vehicleType);
        formData.append('vehicle_id', selectedVehicleId);
        formData.append('loader_id', selectedLoaderId);
        formData.append('estimated_fare', calculatedTotalFare);
        formData.append('payment_method', paymentInfo ? 'upi' : paymentMethod);
        formData.append('payment_status', paymentInfo ? 'paid' : 'pending');
        if (paymentInfo) {
          formData.append('payment_details[razorpay_payment_id]', paymentInfo.razorpay_payment_id);
          formData.append('payment_details[razorpay_order_id]', paymentInfo.razorpay_order_id);
          formData.append('payment_details[razorpay_signature]', paymentInfo.razorpay_signature);
          formData.append('payment_details[status]', 'success');
        }
        formData.append('status', 'requested');
        return formData;
      };

      if (paymentMethod === 'cash') {
        await createOrderApi(buildFormDataPayload());
        navigate('/shop/dashboard');
        return;
      }

      const rzpResponse = await createRazorpayOrderApi({ amount: calculatedTotalFare });
      const razorpayOrder = rzpResponse?.order || rzpResponse?.data?.order || rzpResponse;

      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error('Failed to establish secure Razorpay transaction session.');
      }

      if (!window.Razorpay) {
        throw new Error('Payment gateway SDK failed to load. Check network configuration.');
      }

      const options = {
        key: 'rzp_test_TPJSjPgBUk1LNG',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'GoLoader Enterprise',
        description: 'Secure Online Freight Escrow Settlement',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            const paymentDetails = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            };

            await createOrderApi(buildFormDataPayload(paymentDetails));
            navigate('/shop/dashboard');
          } catch (err) {
            console.error("Error saving order after payment:", err);
            setErrorMessage(err.message || 'Payment authorized, but requisition archival failed.');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: shopOwner.name || 'Merchant Partner',
          contact: shopOwner.phone || '9876543210'
        },
        theme: {
          color: '#0f172a'
        }
      };

      const rzpModal = new window.Razorpay(options);
      rzpModal.on('payment.failed', function (response) {
        console.error("Payment Failed:", response.error);
        setErrorMessage(`Authorization Failed: ${response.error.description}`);
        setIsSubmitting(false);
      });

      setIsSubmitting(false);
      rzpModal.open();

    } catch (err) {
      console.error("Order creation failed:", err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to dispatch requisition.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="nearby-loader-wrapper">
      
      {/* Navbar */}
      <nav className="nearby-loader-navbar">
        <div className="nav-brand-group">
          <button className="back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
          <div className="nav-divider-vertical"></div>
          <span className="navbar-subtitle">Direct Dispatch Console</span>
        </div>
        <h2 className="navbar-heading">Dispatch Requisition to Fleet</h2>
      </nav>

      <div className="nearby-loader-container">
        
        {errorMessage && (
          <div className="error-alert-box">
            <span className="error-dot"></span>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleOrderSubmit} className="nearby-loader-form">
          
          {/* Pickup Section */}
          <div className="form-section-box">
            <h3 className="section-title">1. Origin Facility (Pickup)</h3>
            <div className="input-row-group">
              <input 
                type="text" 
                placeholder="Enter pickup address or use device GPS telemetry..." 
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                required
                className="form-input-control"
              />
              <button type="button" className="action-sub-btn gps-action-btn" onClick={handleGetPickupGPS} disabled={loadingLocation}>
                {loadingLocation ? 'Locating...' : 'Use GPS'}
              </button>
              <button type="button" className="action-sub-btn verify-action-btn" onClick={handleVerifyPickupAddress} disabled={verifyingPickup}>
                {verifyingPickup ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            {verifiedPickupName && (
              <span className="verification-status-text synced">
                Verified Origin: {verifiedPickupName}
              </span>
            )}
          </div>

          {/* Drop Section */}
          <div className="form-section-box">
            <h3 className="section-title">2. Destination Facility (Drop-off)</h3>
            <div className="input-row-group">
              <input 
                type="text" 
                placeholder="Enter destination address or specific landmark..." 
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                required
                className="form-input-control"
              />
              <button 
                type="button" 
                className={`action-sub-btn verify-action-btn ${dropCoords ? 'btn-verified' : ''}`}
                onClick={handleVerifyDropAddress} 
                disabled={verifyingDrop}
              >
                {verifyingDrop ? 'Verifying...' : (dropCoords ? 'Coordinates Locked' : 'Verify Address')}
              </button>
            </div>
            {verifiedDropName && (
              <span className="verification-status-text synced">
                Verified Destination: {verifiedDropName}
              </span>
            )}
          </div>

          {/* Goods Specification & Photo Upload */}
          <div className="form-section-box">
            <h3 className="section-title">3. Cargo Specifications & Documentation</h3>
            
            <div className="form-grid-layout">
              <div className="input-group-box">
                <label className="input-label-title">Goods Category</label>
                <select 
                  value={goodsCategory} 
                  onChange={(e) => setGoodsCategory(e.target.value)} 
                  className="form-input-control select-field"
                >
                  <option value="General Goods">General Freight</option>
                  <option value="Electronics & Appliances">Electronics & Appliances</option>
                  <option value="Furniture & Decor">Furniture & Decor</option>
                  <option value="Groceries & Vegetables">Groceries & Perishables</option>
                  <option value="Hardware & Construction">Hardware & Construction Materials</option>
                  <option value="Clothing & Textile">Textiles & Apparel</option>
                  <option value="Fragile Items">Fragile Consignments</option>
                </select>
              </div>

              <div className="input-group-box">
                <label className="input-label-title">Gross Weight (KG)</label>
                <input 
                  type="number" 
                  value={weightKg} 
                  onChange={(e) => setWeightKg(e.target.value)} 
                  required 
                  className="form-input-control"
                />
              </div>

              <div className="input-group-box">
                <label className="input-label-title">Transport Class Required</label>
                <select value={vehicleType} onChange={handleVehicleTypeChange} className="form-input-control select-field">
                  <option value="mini_truck">Mini Truck</option>
                  <option value="tempo">Tempo Unit</option>
                  <option value="pickup">Pickup Truck</option>
                  <option value="e_cart">Electric Cart</option>
                </select>
              </div>
            </div>

            <div className="upload-group-box">
              <label className="input-label-title">Cargo Visual Documentation (Optional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange}
                className="file-input-control"
              />
              {photoPreview && (
                <div className="photo-preview-wrapper">
                  <img src={photoPreview} alt="Goods Asset Preview" className="preview-thumb-img" />
                </div>
              )}
            </div>
          </div>

          {/* Nearby Loaders Selection */}
          <div className="form-section-box fleet-selector-box">
            <h3 className="section-title">4. Select Fleet Operator</h3>
            {!pickupCoords ? (
              <div className="notice-banner-box pending-notice">
                Please verify your origin pickup location above to scan active driver partners within range.
              </div>
            ) : loadingLoaders ? (
              <div className="scanning-state-box">
                Scanning telemetry network for available units...
              </div>
            ) : nearbyLoaders.length === 0 ? (
              <div className="notice-banner-box error-notice">
                No active transport units registered for this vehicle class within the 10km telemetry perimeter.
              </div>
            ) : (
              <div className="vehicles-grid-list">
                {nearbyLoaders.map((vehicle) => {
                  const isSelected = selectedVehicleId === vehicle._id;
                  const loaderName = vehicle.loader_id?.name || 'Driver Partner';
                  const loaderPhone = vehicle.loader_id?.phone || 'N/A';

                  return (
                    <div 
                      key={vehicle._id} 
                      onClick={() => handleSelectLoader(vehicle)}
                      className={`fleet-operator-card ${isSelected ? 'card-selected' : ''}`}
                    >
                      <div className="operator-details-stack">
                        <strong className="operator-vehicle-title">{vehicle.vehicle_type.replace('_', ' ').toUpperCase()}</strong>
                        <span className="operator-plate-text">Registration: {vehicle.registration_number}</span>
                        <span className="operator-contact-text">Operator: {loaderName} ({loaderPhone})</span>
                      </div>
                      <div className="operator-pricing-stack">
                        <span className="operator-fare-rate">₹{vehicle.fare_per_km} / KM</span>
                        <input 
                          type="radio" 
                          checked={isSelected} 
                          onChange={() => handleSelectLoader(vehicle)} 
                          className="operator-radio-input"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fare Breakdown Box */}
          {pickupCoords && dropCoords && selectedVehicleId && selectedFarePerKm > 0 && (
            <div className="fare-breakdown-card">
              <h4 className="fare-card-heading">Telemetry Route & Fare Breakdown</h4>
              <div className="fare-row-item">
                <span>Estimated Road Transit Distance:</span>
                <strong>{distanceKm} KM</strong>
              </div>
              <div className="fare-row-item">
                <span>Selected Operator Tariff Rate:</span>
                <strong>₹{selectedFarePerKm} / KM</strong>
              </div>
              <div className="fare-divider-line"></div>
              <div className="fare-row-item total-fare-row">
                <span>Total Estimated Requisition Fare:</span>
                <span className="total-fare-value">₹{calculatedTotalFare}</span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="form-section-box">
            <h3 className="section-title">5. Settlement Protocol</h3>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-input-control select-field payment-dropdown">
              <option value="cash">Deferred Cash Settlement (COD)</option>
              <option value="upi">Online Escrow Settlement (Razorpay UPI)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="form-submit-panel">
            <button 
              type="submit" 
              disabled={isSubmitting || !selectedLoaderId || !dropCoords} 
              className={`submit-requisition-btn ${isSubmitting ? 'is-loading' : ''}`}
            >
              {isSubmitting ? 'Processing Dispatch...' : paymentMethod === 'upi' ? 'Authorize Escrow & Broadcast Requisition' : 'Broadcast Requisition (Cash Settlement)'}
            </button>
            <span className="submit-security-note">Encrypted direct operator dispatch & telemetry verification</span>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NearbyLoader;
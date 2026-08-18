import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNearbyLoadersApi, createOrderApi, createRazorpayOrderApi } from '../../../api/shopOwnerAPI';
import './NearbyLoader.css';

const NearbyLoader = () => {
  const navigate = useNavigate();

  const shopOwner = JSON.parse(localStorage.getItem('user') || '{}');

  // Form States
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null); // [lng, lat]
  const [verifyingPickup, setVerifyingPickup] = useState(false);
  const [verifiedPickupName, setVerifiedPickupName] = useState('');
  
  const [dropAddress, setDropAddress] = useState('');
  const [dropCoords, setDropCoords] = useState(null);     // [lng, lat]
  const [verifyingDrop, setVerifyingDrop] = useState(false);
  const [verifiedDropName, setVerifiedDropName] = useState('');
  
  // Goods & Photo States
  const [goodsCategory, setGoodsCategory] = useState('General Goods');
  const [weightKg, setWeightKg] = useState(10);
  const [goodsPhoto, setGoodsPhoto] = useState(null); 
  const [photoPreview, setPhotoPreview] = useState(null); 

  const [vehicleType, setVehicleType] = useState('mini_truck');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Nearby Loaders States
  const [nearbyLoaders, setNearbyLoaders] = useState([]);
  const [selectedLoaderId, setSelectedLoaderId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedFarePerKm, setSelectedFarePerKm] = useState(0); 
  
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingLoaders, setLoadingLoaders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Component load par Razorpay script load karna
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Accurate Road Distance calculation
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

  // 1. Get Live GPS Coordinates for Pickup
  const handleGetPickupGPS = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser");
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
        setErrorMessage("Unable to retrieve your location. Please check GPS permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Manual Pickup Verify
  const handleVerifyPickupAddress = async () => {
    if (!pickupAddress.trim()) {
      setErrorMessage("Please enter a pickup address first.");
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
        setErrorMessage("Could not verify pickup address.");
      }
    } catch (err) {
      setErrorMessage("Failed to verify pickup address.");
    } finally {
      setVerifyingPickup(false);
    }
  };

  // 2. Verify Drop Address
  const handleVerifyDropAddress = async () => {
    if (!dropAddress.trim()) {
      setErrorMessage("Please enter a drop address first to verify.");
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
        setErrorMessage("Could not verify drop address. Please provide a more specific location/landmark.");
      }
    } catch (err) {
      setErrorMessage("Failed to verify drop address.");
    } finally {
      setVerifyingDrop(false);
    }
  };

  // 3. Fetch Nearby Loaders
  const fetchNearbyLoaders = async (lng, lat, selectedType) => {
    if (!lng || !lat) return;

    setLoadingLoaders(true);
    try {
      const response = await fetchNearbyLoadersApi(lng, lat, selectedType);
      setNearbyLoaders(response.data || []);
    } catch (err) {
      console.error("Error fetching nearby loaders:", err);
      setErrorMessage(err.response?.data?.message || 'Failed to fetch nearby loaders.');
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

  // Handle Photo Selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGoodsPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 4. Select Loader & Vehicle
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

  // 5. Submit Order Handler (Supports Cash & Razorpay UPI)
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!pickupCoords) {
      setErrorMessage("Please fetch or verify your pickup location first!");
      return;
    }
    if (!dropCoords) {
      setErrorMessage("Please verify your drop-off address first!");
      return;
    }
    if (!selectedLoaderId || !selectedVehicleId) {
      setErrorMessage("Please select an available loader from the list below to send the request.");
      return;
    }
    if (calculatedTotalFare <= 0) {
      setErrorMessage("Invalid calculated fare. Please check distance and loader rates.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Common Payload Generator for FormData
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

      // ─── A. CASH FLOW ───
      if (paymentMethod === 'cash') {
        await createOrderApi(buildFormDataPayload());
        navigate('/shop/dashboard');
        return;
      }

      // ─── B. RAZORPAY UPI FLOW ───
      const rzpResponse = await createRazorpayOrderApi({ amount: calculatedTotalFare });
      const razorpayOrder = rzpResponse?.order || rzpResponse?.data?.order || rzpResponse;

      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error('Failed to create Razorpay order from backend.');
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection or disable ad-blockers.');
      }

      const options = {
        key: 'rzp_test_TPJSjPgBUk1LNG',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'LoadShare Delivery',
        description: 'Online Payment for Delivery Order',
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
            setErrorMessage(err.message || 'Payment successful, but failed to save order.');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: shopOwner.name || 'Shop Owner',
          contact: shopOwner.phone || '9876543210'
        },
        theme: {
          color: '#059669'
        }
      };

      const rzpModal = new window.Razorpay(options);
      rzpModal.on('payment.failed', function (response) {
        console.error("Payment Failed:", response.error);
        setErrorMessage(`Payment Failed: ${response.error.description}`);
        setIsSubmitting(false);
      });

      setIsSubmitting(false);
      rzpModal.open(); // 🚀 Razorpay Modal Open

    } catch (err) {
      console.error("Order creation failed:", err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create order.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="nearby-loader-wrapper">
      <nav className="nearby-loader-navbar">
        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
        <h2>Send Request to Nearby Loader</h2>
      </nav>

      <div className="nearby-loader-container">
        {errorMessage && <div className="alert error-alert" style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{errorMessage}</div>}

        <form onSubmit={handleOrderSubmit} className="nearby-loader-form">
          
          {/* Pickup Section */}
          <div className="form-section">
            <h4>1. Pickup Location</h4>
            <div className="input-group" style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Enter pickup address or use GPS..." 
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                required
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <button type="button" className="gps-btn" onClick={handleGetPickupGPS} disabled={loadingLocation}>
                {loadingLocation ? 'Locating...' : 'Use GPS'}
              </button>
              <button type="button" className="gps-btn" style={{ background: '#4f46e5' }} onClick={handleVerifyPickupAddress} disabled={verifyingPickup}>
                {verifyingPickup ? '...' : 'Verify'}
              </button>
            </div>
            {verifiedPickupName && (
              <small style={{ color: '#059669', display: 'block', marginTop: '6px', fontWeight: '600' }}>
                Verified Pickup: {verifiedPickupName}
              </small>
            )}
          </div>

          {/* Drop Section */}
          <div className="form-section">
            <h4>2. Drop-off Location</h4>
            <div className="input-group" style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Enter drop-off destination address..." 
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                required
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <button 
                type="button" 
                className="gps-btn" 
                style={{ background: dropCoords ? '#059669' : '#2563eb' }} 
                onClick={handleVerifyDropAddress} 
                disabled={verifyingDrop}
              >
                {verifyingDrop ? 'Verifying...' : (dropCoords ? 'Verified' : 'Verify Address')}
              </button>
            </div>
            {verifiedDropName && (
              <small style={{ color: '#059669', display: 'block', marginTop: '6px', fontWeight: '600' }}>
                Verified Drop: {verifiedDropName}
              </small>
            )}
          </div>

          {/* Goods Specification & Photo Upload */}
          <div className="form-section">
            <h4>3. Goods Category, Weight & Photo</h4>
            
            <div className="specs-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Goods Category</label>
                <select 
                  value={goodsCategory} 
                  onChange={(e) => setGoodsCategory(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}
                >
                  <option value="General Goods">General Goods</option>
                  <option value="Electronics & Appliances">Electronics & Appliances</option>
                  <option value="Furniture & Decor">Furniture & Decor</option>
                  <option value="Groceries & Vegetables">Groceries & Vegetables</option>
                  <option value="Hardware & Construction">Hardware & Construction</option>
                  <option value="Clothing & Textile">Clothing & Textile</option>
                  <option value="Fragile Items">Fragile Items</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Weight (KG)</label>
                <input 
                  type="number" 
                  value={weightKg} 
                  onChange={(e) => setWeightKg(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Upload Goods Photo (Optional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
              />
              {photoPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img src={photoPreview} alt="Goods Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Vehicle Type Required</label>
              <select value={vehicleType} onChange={handleVehicleTypeChange} className="payment-select" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="mini_truck">Mini Truck</option>
                <option value="tempo">Tempo</option>
                <option value="pickup">Pickup</option>
                <option value="e_cart">E-Cart</option>
              </select>
            </div>
          </div>

          {/* Nearby Loaders Selection */}
          <div className="form-section nearby-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
            <h4>4. Select a Loader to Send Request</h4>
            {!pickupCoords ? (
              <p className="hint-text" style={{ color: '#d97706', fontSize: '13px', background: '#fef3c7', padding: '10px', borderRadius: '6px' }}>
                Please verify your pickup location above to see active loaders.
              </p>
            ) : loadingLoaders ? (
              <p>Searching for nearby loaders...</p>
            ) : nearbyLoaders.length === 0 ? (
              <p style={{ color: '#ef4444', fontSize: '14px' }}>No active loaders found for this vehicle type within 10km.</p>
            ) : (
              <div className="vehicles-grid" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {nearbyLoaders.map((vehicle) => {
                  const isSelected = selectedVehicleId === vehicle._id;
                  const loaderName = vehicle.loader_id?.name || 'Delivery Partner';
                  const loaderPhone = vehicle.loader_id?.phone || 'N/A';

                  return (
                    <div 
                      key={vehicle._id} 
                      className={`vehicle-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectLoader(vehicle)}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '14px', border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1', 
                        borderRadius: '8px', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'white' 
                      }}
                    >
                      <div className="vehicle-info">
                        <strong>{vehicle.vehicle_type.replace('_', ' ').toUpperCase()}</strong> ({vehicle.registration_number})
                        <br />
                        <small style={{ color: '#475569' }}>Driver: {loaderName} ({loaderPhone})</small>
                      </div>
                      <div className="vehicle-pricing" style={{ textAlign: 'right' }}>
                        <span className="price-tag" style={{ color: '#059669', fontWeight: 'bold', fontSize: '16px' }}>Rs.{vehicle.fare_per_km} / KM</span>
                        <br />
                        <input 
                          type="radio" 
                          checked={isSelected} 
                          onChange={() => handleSelectLoader(vehicle)} 
                          style={{ marginTop: '4px' }}
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
            <div className="fare-box-section" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
              <h4 style={{ color: '#065f46', marginBottom: '8px' }}>Trip Estimate & Fare Breakdown</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#047857', marginBottom: '4px' }}>
                <span>Estimated Road Distance:</span>
                <strong>{distanceKm} KM</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#047857', marginBottom: '4px' }}>
                <span>Selected Loader Rate:</span>
                <strong>Rs.{selectedFarePerKm} / KM</strong>
              </div>
              <hr style={{ border: '0', borderTop: '1px solid #a7f3d0', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#065f46', fontWeight: 'bold' }}>
                <span>Total Estimated Fare:</span>
                <span>Rs.{calculatedTotalFare}</span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="form-section" style={{ marginTop: '20px' }}>
            <h4>5. Payment Method</h4>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="payment-select" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="cash">Cash on Delivery / Pickup (CASH)</option>
              <option value="upi">UPI / Online Payment (Razorpay)</option>
            </select>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-order-btn" disabled={isSubmitting || !selectedLoaderId || !dropCoords} style={{ width: '100%', background: '#059669', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
            {isSubmitting ? 'Processing...' : paymentMethod === 'upi' ? 'Pay Online & Send Request' : 'Send Request to Loader'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default NearbyLoader;
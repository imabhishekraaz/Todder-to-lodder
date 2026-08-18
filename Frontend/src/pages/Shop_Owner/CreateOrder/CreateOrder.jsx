import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrderApi, createRazorpayOrderApi } from '../../../api/shopOwnerAPI';
import './CreateOrder.css';

const CreateOrder = () => {
  const navigate = useNavigate();

  const shopOwner = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    pickupAddress: shopOwner.address || shopOwner.shopName || '',
    dropAddress: '',
    goodsCategory: 'Groceries',
    weightKg: '',
    vehicleTypeRequested: 'tempo',
    estimatedFare: '',
    paymentMethod: 'upi'
  });

  const [pickupCoords, setPickupCoords] = useState(null); 
  const [dropCoords, setDropCoords] = useState(null); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pickupStatus, setPickupStatus] = useState('');
  const [dropStatus, setDropStatus] = useState('');

  useEffect(() => {
    // Razorpay checkout script dynamically inject karna
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    handleGetPickupGPS();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getCoordinatesFromAddress = async (addressText) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        return [lon, lat]; 
      }
      return null;
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  const handleGetPickupGPS = () => {
    if (!navigator.geolocation) {
      setPickupStatus('Geolocation is not supported by your browser.');
      return;
    }

    setPickupStatus('Fetching pickup GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPickupCoords([lng, lat]);
        setPickupStatus('Pickup GPS Captured Successfully.');
      },
      (error) => {
        console.error("Geolocation error:", error);
        setPickupStatus('Failed to fetch pickup GPS.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleVerifyDropAddress = async () => {
    if (!formData.dropAddress) {
      setDropStatus('Please enter a drop-off address first.');
      return;
    }

    setDropStatus('Verifying drop address & fetching coordinates...');
    const coords = await getCoordinatesFromAddress(formData.dropAddress);
    
    if (coords) {
      setDropCoords(coords);
      setDropStatus('Drop-off Location Verified & GPS Saved.');
    } else {
      setDropStatus('Could not locate address. Please provide a clearer landmark.');
      setDropCoords([0, 0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!pickupCoords) {
        throw new Error('Pickup GPS coordinates not found. Please click "Refresh Pickup GPS".');
      }
      if (!formData.estimatedFare || Number(formData.estimatedFare) <= 0) {
        throw new Error('Please enter a valid estimated fare.');
      }

      let finalDropCoords = dropCoords;
      if (!finalDropCoords && formData.dropAddress) {
        finalDropCoords = await getCoordinatesFromAddress(formData.dropAddress);
      }

      const dropLocationData = {
        type: 'Point',
        coordinates: finalDropCoords || [0, 0] 
      };

      // 🚀 FIXED: Payload function jisme Cash ke liye payment_status 'pending' rahega
      const buildPayload = (paymentInfo = null) => ({
        pickup: {
          address: formData.pickupAddress,
          location: { type: 'Point', coordinates: pickupCoords }
        },
        drop: {
          address: formData.dropAddress,
          location: dropLocationData
        },
        goods: {
          category: formData.goodsCategory,
          weight_kg: Number(formData.weightKg)
        },
        vehicle_type_requested: formData.vehicleTypeRequested,
        estimated_fare: Number(formData.estimatedFare),
        payment_method: paymentInfo ? 'upi' : formData.paymentMethod,
        // Agar paymentInfo (Razorpay) hai tabhi 'paid', warna cash/other ke liye strictly 'pending'
        payment_status: paymentInfo ? 'paid' : 'pending',
        payment_details: paymentInfo || null
      });

      // 1. Agar payment method Cash hai
      if (formData.paymentMethod === 'cash') {
        await createOrderApi(buildPayload(null)); // explicitly null bhej rahe hain taaki status 'pending' ho
        navigate('/shop/dashboard');
        return;
      }

      // 2. Agar payment method UPI hai (Razorpay Flow)
      console.log("Initiating Razorpay Order for amount:", formData.estimatedFare);
      const rzpResponse = await createRazorpayOrderApi({ amount: Number(formData.estimatedFare) });
      console.log("Razorpay Response:", rzpResponse);

      const razorpayOrder = rzpResponse?.order || rzpResponse?.data?.order || rzpResponse;

      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error('Failed to generate Razorpay order ID from backend.');
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection or disable ad-blockers.');
      }

      const options = {
        key: 'rzp_test_TPJSjPgBUk1LNG', // Apni Test Key yahan ensure kar lein
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
              razorpay_signature: response.razorpay_signature,
              status: 'success'
            };

            // Payment successful hone ke baad order save hoga with 'paid' status
            await createOrderApi(buildPayload(paymentDetails));
            navigate('/shop/dashboard');
          } catch (err) {
            console.error("Error saving order after payment:", err);
            setErrorMessage(err.message || 'Payment successful, but failed to save order.');
            setIsLoading(false);
          }
        },
        prefill: {
          name: shopOwner.name || 'Shop Owner',
          contact: shopOwner.phone || '9876543210'
        },
        theme: {
          color: '#0f172a'
        }
      };

      const rzpModal = new window.Razorpay(options);
      
      rzpModal.on('payment.failed', function (response) {
        console.error("Payment Failed:", response.error);
        setErrorMessage(`Payment Failed: ${response.error.description}`);
        setIsLoading(false);
      });

      setIsLoading(false);
      rzpModal.open(); // 🚀 Yeh Razorpay popup modal open karega

    } catch (error) {
      console.error("Submit Error:", error);
      setErrorMessage(error.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  return (
    <div className="create-order-wrapper">
      <nav className="create-navbar">
        <button className="back-btn" onClick={() => navigate('/shop/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>Post New Order</h2>
      </nav>

      <div className="create-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        <form className="create-form" onSubmit={handleSubmit}>
          
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Pickup Details (Your Shop Location)</h3>
              <button 
                type="button" 
                onClick={handleGetPickupGPS}
                style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Refresh Pickup GPS
              </button>
            </div>
            <small style={{ color: pickupCoords ? '#16a34a' : '#d97706', fontWeight: '600', display: 'block', marginTop: '4px' }}>
              {pickupStatus}
            </small>

            <div className="input-group" style={{ marginTop: '10px' }}>
              <label>Pickup Address</label>
              <input 
                type="text" 
                name="pickupAddress" 
                placeholder="e.g., Near Main Market, Shop No. 12" 
                value={formData.pickupAddress} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Drop-off Details (Destination)</h3>
              <button 
                type="button" 
                onClick={handleVerifyDropAddress}
                style={{ background: '#fef3c7', color: '#b45309', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Verify & Get GPS
              </button>
            </div>
            <small style={{ color: dropCoords ? '#16a34a' : '#d97706', fontWeight: '600', display: 'block', marginTop: '4px' }}>
              {dropStatus}
            </small>

            <div className="input-group" style={{ marginTop: '10px' }}>
              <label>Drop-off Address / Landmark</label>
              <input 
                type="text" 
                name="dropAddress" 
                placeholder="e.g., Industrial Area, Sector 4, Mathura" 
                value={formData.dropAddress} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Goods & Payment Options</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Goods Category</label>
                <select name="goodsCategory" value={formData.goodsCategory} onChange={handleChange}>
                  <option value="Groceries">Groceries</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="General Goods">General Goods</option>
                </select>
              </div>

              <div className="input-group">
                <label>Weight (KG)</label>
                <input type="number" name="weightKg" placeholder="e.g., 50" value={formData.weightKg} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label>Vehicle Requested</label>
                <select name="vehicleTypeRequested" value={formData.vehicleTypeRequested} onChange={handleChange}>
                  <option value="tempo">Tempo</option>
                  <option value="pickup_truck">Pickup Truck</option>
                  <option value="mini_truck">Mini Truck</option>
                </select>
              </div>

              <div className="input-group">
                <label>Estimated Fare (₹)</label>
                <input type="number" name="estimatedFare" placeholder="e.g., 450" value={formData.estimatedFare} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '15px' }}>
              <label>Select Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                <option value="upi">UPI / Online (Razorpay)</option>
                <option value="cash">Cash on Delivery / Pay Later</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-order-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : formData.paymentMethod === 'upi' ? 'Pay Online & Post Order' : 'Post Order with Cash'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
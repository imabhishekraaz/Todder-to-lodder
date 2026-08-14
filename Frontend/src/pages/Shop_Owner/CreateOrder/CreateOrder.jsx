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

  // Pickup GPS Coordinates (Browser se fetch honge)
  const [pickupCoords, setPickupCoords] = useState(null); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pickupStatus, setPickupStatus] = useState('');

  useEffect(() => {
    // 1. Razorpay Script Load Karein
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // 2. Page khulte hi automatic pickup GPS capture karne ki koshish karein
    handleGetPickupGPS();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Pickup Location ke GPS capture karne ka function
  const handleGetPickupGPS = () => {
    if (!navigator.geolocation) {
      setPickupStatus('❌ Geolocation is not supported by your browser.');
      return;
    }

    setPickupStatus('Fetching pickup GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPickupCoords([lng, lat]); // GeoJSON format: [Longitude, Latitude]
        setPickupStatus('📍 Pickup GPS Captured Successfully!');
      },
      (error) => {
        console.error("Geolocation error:", error);
        setPickupStatus('❌ Failed to fetch pickup GPS. Please allow location access.');
      },
      { enableHighAccuracy: true }
    );
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

      // Drop ke liye coordinates ki zaroorat nahi hai, isliye use [0, 0] ya empty rakha ja sakta hai
      const dropLocationData = {
        type: 'Point',
        coordinates: [0, 0] 
      };

      const buildPayload = (paymentInfo = null) => ({
        pickup: {
          address: formData.pickupAddress,
          location: { type: 'Point', coordinates: pickupCoords } // Pickup ke real GPS cordinates
        },
        drop: {
          address: formData.dropAddress,
          location: dropLocationData // Drop keval text address rahega
        },
        goods: {
          category: formData.goodsCategory,
          weight_kg: Number(formData.weightKg)
        },
        vehicle_type_requested: formData.vehicleTypeRequested,
        estimated_fare: Number(formData.estimatedFare),
        payment_method: formData.paymentMethod,
        payment_details: paymentInfo
      });

      // SCENARIO A: Cash on Delivery / Pay Later
      if (formData.paymentMethod === 'cash') {
        await createOrderApi(buildPayload());
        navigate('/shop/dashboard');
        return;
      }

      // SCENARIO B: Online Payment via Razorpay
      const rzpResponse = await createRazorpayOrderApi({ amount: formData.estimatedFare });
      const razorpayOrder = rzpResponse.order;

      const options = {
        key: 'rzp_test_TPJSjPgBUk1LNG',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'LoadShare Delivery',
        description: 'Online Payment for Delivery',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            const paymentDetails = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              status: 'success'
            };

            await createOrderApi(buildPayload(paymentDetails));
            navigate('/shop/dashboard');
          } catch (err) {
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
        setErrorMessage(`Payment Failed: ${response.error.description}`);
        setIsLoading(false);
      });
      rzpModal.open();
      setIsLoading(false);

    } catch (error) {
      console.error("Error:", error);
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
        <h2>Post New Order 📦</h2>
      </nav>

      <div className="create-container">
        {errorMessage && <div className="alert error-alert">{errorMessage}</div>}

        <form className="create-form" onSubmit={handleSubmit}>
          
          {/* Pickup Section (GPS Coordinates + Address) */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>📍 Pickup Details (Your Shop Location)</h3>
              <button 
                type="button" 
                onClick={handleGetPickupGPS}
                style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Refresh Pickup GPS 🔄
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

          {/* Drop-off Section (Only Text Address, No GPS) */}
          <div className="form-section">
            <h3>🎯 Drop-off Details (Destination)</h3>
            <div className="input-group">
              <label>Drop-off Address / Landmark</label>
              <input 
                type="text" 
                name="dropAddress" 
                placeholder="e.g., Industrial Area, Sector 4, Near Metro Station" 
                value={formData.dropAddress} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          {/* Goods & Payment Section */}
          <div className="form-section">
            <h3>📦 Goods & Payment Options</h3>
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
              <label>Select Payment Method 💳</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                <option value="upi">UPI / Online (Razorpay)</option>
                <option value="cash">Cash on Delivery / Pay Later</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-order-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : formData.paymentMethod === 'upi' ? 'Pay Online & Post Order 🚀' : 'Post Order with Cash 📝'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
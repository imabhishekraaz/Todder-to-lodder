import axios from 'axios';

// Create a base API instance
const API = axios.create({
  baseURL: 'http://localhost:8000/api', // Your backend base URL goes here
});

// Function to handle user login
export const loginUser = async (formData) => {
  try {
    // Axios automatically converts data to JSON format
    const response = await API.post('/users/login', formData);

    // Return the main response data from the backend
    return response.data;
  } catch (error) {
    // If the backend sends an error response (like 400 or 404)
    if (error.response && error.response.data) {
      throw error.response.data; // Throw the backend error message
    }
    // If the server is down or there is a network issue
    throw new Error('Server connection error. Please check if the backend is running.');
  }
};


// Function to handle user signup (registration)
export const registerUser = async (formData) => {
  try {
    // Make sure your backend has this route (e.g., /users/register)
    const response = await API.post('/users/signup', formData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Server connection error. Please check if the backend is running.');
  }
};


// api.js ke end mein yeh add karein

export const updateStatusApi = async (data) => {
  try {
    const token = localStorage.getItem('token');

    // Header mein token attach karke bhej rahe hain
    const response = await API.put('/users/update-status', data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    // Backend API ko PUT request bhej rahe hain

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Server connection error.');
  }
};

// Register the vehicle

export const addVehicleApi = async (vehicleData) => {
  try {
    // Local storage se token nikal rahe hain
    const token = localStorage.getItem('token');

    // Header mein token attach karke bhej rahe hain
    const response = await API.post('/vehicles/register', vehicleData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Server connection error.');
  }
};


// Saari vehicles fetch karne ke liye API function
export const getAllVehiclesApi = async () => {
  try {
    const token = localStorage.getItem('token');

    const response = await API.get('/vehicles/my-vehicles', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to fetch vehicles.');
  }
};

export const updateVehicleAvailabilityApi = async (vehicleId, is_available) => {
  try {
    const token = localStorage.getItem('token');

    // Yahan URL mein id bhej rahe hain jo backend req.params.id se match karega
    const response = await API.patch(`/vehicles/${vehicleId}/toggle-status`,
      { is_available },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to update availability.');
  }
};

export const getProfileApi = async () => {
  const token = localStorage.getItem('token');
  const response = await API.get('/users/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// --- Nearby Active Loads fetch karne ke liye API function ---
// --- Loader ke liye nearby orders fetch karne ki API function ---
export const fetchNearbyOrdersApi = async () => {
  try {
    const token = localStorage.getItem('token');

    // Backend route path apne main router (e.g., /orders/nearby) ke hisaab se check kar lein
    const response = await API.get('/orders/nearby', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data; // Yeh { success: true, count: ..., data: [...] } return karega
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to fetch nearby orders.');
  }
};

// Accept order API with vehicle_id in request body
export const acceptOrderApi = async (orderId, vehicleId) => {
  try {
    const token = localStorage.getItem('token');

    const response = await API.patch(`/orders/${orderId}/accept`, 
      { vehicle_id: vehicleId }, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to accept this order.');
  }
};

// --- Fetch accepted orders for the logged-in loader ---
export const fetchAcceptedOrdersApi = async () => {
  try {
    const token = localStorage.getItem('token');

    const response = await API.get('/orders/accept-order', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to fetch accepted orders.');
  }
};

// --- Fetch single order details by ID ---
export const fetchOrderDetailsApi = async (orderId) => {
  try {
    const token = localStorage.getItem('token');

    const response = await API.get(`/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to fetch order details.');
  }
};

// 3. Update Order Status API (e.g., Mark as Completed)
export const updateOrderStatusApi = async (orderId, newStatus) => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.put(`/orders/${orderId}/status`, 
      { status: newStatus }, 
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data; // { success: true, message: "...", data: order }
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to update order status.');
  }
};

// For the Loader
export const completeDeliveryApi = async (orderId, actionType) => {
  const token = localStorage.getItem('token');
  const response = await API.put(`/orders/${orderId}/complete-delivery`, 
    { action: actionType }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const rateLoaderApi = async (ratingData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.post('/orders/rate-loader', ratingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    // Backend se aane wala custom error message throw karein, warna default message
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to submit rating. Please try again.');
  }
};

export const updatePaymentStatusApi = async (orderId, paymentData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.put(`/orders/${orderId}/payment`, paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to update payment status. Please try again.');
  }
};

export const markOrderAsDeliveredApi = async (orderId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.put(`/orders/delivered/${orderId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to mark as delivered.');
  }
};

export const fetchLoaderPaymentHistoryApi = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log("🚀 API function called! Token:", token ? "Present" : "Missing");

    const response = await API.get('/payments/loader/payments', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("📦 RAW Response from Backend:", response);
    return response.data;
  } catch (error) {
    console.error("❌ API Catch Error:", error);
    throw error.response?.data || error;
  }
};

// 1. Fetch Loader Orders API (Aapka purana format)
export const fetchLoaderDirectOrdersApi = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.get('/orders/loader/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to fetch loader orders. Please try again.');
  }
};

export const rejectOrderApi = async (orderId, cancellationReason) => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.put(`/orders/reject/${orderId}`, { cancellation_reason: cancellationReason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to reject order. Please try again.');
  }
};


// Function to update loader location
export const updateLoaderLocationApi = async (locationData) => {
  try {
    const token = localStorage.getItem('token')
    // Axios automatically converts data to JSON format
    const response = await API.put('vehicles/loader/location', locationData, {
      headers : { Authorization : `Bearer ${token}`}
    });

    // Return the main response data from the backend
    return response.data;
  } catch (error) {
    // If the backend sends an error response (like 400 or 404)
    if (error.response && error.response.data) {
      throw error.response.data; // Throw the backend error message
    }
    // If the server is down or there is a network issue
    throw new Error('Server connection error. Please check if the backend is running.');
  }
};

export const fetchLoaderHistoryApi = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.get('/orders/loader-history', { // Yeh route aapke backend mein hona chahiye
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // Yeh { total_earnings, rating, data } return karega
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to fetch loader stats.');
  }
};
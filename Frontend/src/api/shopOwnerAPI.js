import axios from 'axios';

// Create a base API instance
const API = axios.create({
  baseURL: 'http://localhost:8000/api', // Your backend base URL goes here
});


export const fetchShopOrdersApi = async () => {
  try {
    const token = localStorage.getItem('token');

    const response = await API.get('/orders/my-orders', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to fetch your shop orders.');
  }
};

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

export const createRazorpayOrderApi = async (data) => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.post('/payments/create-razorpay-order', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to initiate online payment.');
  }
};

// --- Create Order API (Supports both Cash and UPI/Razorpay success details) ---
export const createOrderApi = async (orderData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await API.post('/orders/create', orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to post delivery order.');
  }
};

// Function to fetch shop owner's payment and order history
export const getPaymentHistoryApi = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const response = await API.get('/payments/history', {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error(error.message || 'Failed to fetch payment history.');
  }
};

// Function to update shop owner profile in backend
export const updateShopProfileApi = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found.');
    }

    const response = await API.put('/users/shop/profile', profileData, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error('Failed to update profile.');
  }
};

// Get Logged-in User Profile API
export const getUserProfileApi = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const response = await API.get('/users/profile', {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error(error.message || 'Failed to fetch user profile.');
  }
};
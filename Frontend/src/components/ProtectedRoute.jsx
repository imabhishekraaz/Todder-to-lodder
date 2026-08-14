import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role') || JSON.parse(localStorage.getItem('user') || '{}').role;

  // 1. Agar token nahi hai, toh login par bhej do
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Loader ke liye strict check
  if (allowedRole === 'loader' && userRole !== 'loader') {
    return <Navigate to="/login" replace />;
  }

  // 3. Shop Owner ke liye flexible check (sabhi possible variations handle kiye hain)
  if (allowedRole === 'shop') {
    const isShopOwner = ['shop', 'shop_owner', 'Shop', 'ShopOwner', 'shopowner'].includes(userRole);
    if (!isShopOwner) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
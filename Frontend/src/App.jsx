import { useState } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import Signup from './pages/signup/Signup'
import Dashboard from './pages/Loader/Dashboard/Dashboard'
import AddVehicle from './pages/Loader/AddVehicle/AddVehicle'
import AllVehicles from './pages/Loader/AllVehicles/AllVehicles'
import Profile from './pages/Loader/Profile/Profile'
import ActiveLoads from './pages/Loader/ActiveLoads/ActiveLoads'
import AcceptedOrders from './pages/Loader/AcceptedOrders/AcceptedOrders'
import OrderDetails from './pages/Loader/OrderDetails/OrderDetails'
import ShopDashboard from './pages/Shop_Owner/ShopDashboard/ShopDashboard'
import ShopOrderDetails from './pages/Shop_Owner/ShopOrderDetails/ShopOrderDetails'
import CreateOrder from './pages/Shop_Owner/CreateOrder/CreateOrder'

// Protected Route import
import ProtectedRoute from './components/ProtectedRoute'
import PaymentHistory from './pages/Shop_Owner/PaymentHistory/PaymentHistory'
import ShopProfile from './pages/Shop_Owner/ShopProfile/ShopProfile'
import LoaderHistoryOrder from './pages/Loader/LoaderHistoryOrder/LoaderHistoryOrder'
import LoaderCompleteOrder from './pages/Loader/LoaderCompleteOrder/LoaderCompleteOrder'
import NearbyLoader from './pages/Shop_Owner/NearbyLoader/NearbyLoader'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />

        {/* ================= LOADER ROUTES ================= */}
        <Route path='/loader/dashboard' element={<ProtectedRoute allowedRole="loader"><Dashboard /></ProtectedRoute>} />
        <Route path='/add-vehicle' element={<ProtectedRoute allowedRole="loader"><AddVehicle /></ProtectedRoute>} />
        <Route path='/my-vehicles' element={<ProtectedRoute allowedRole="loader"><AllVehicles /></ProtectedRoute>} />
        <Route path='/profile' element={<ProtectedRoute allowedRole="loader"><Profile /></ProtectedRoute>} />
        <Route path='/accept/orders' element={<ProtectedRoute allowedRole="loader"><AcceptedOrders /></ProtectedRoute>} />
        <Route path='/order-details' element={<ProtectedRoute allowedRole="loader"><OrderDetails /></ProtectedRoute>} />
        <Route path='/orders' element={<ProtectedRoute allowedRole="loader"><LoaderHistoryOrder /></ProtectedRoute>} />
        <Route path='/loader/complete-order' element={<ProtectedRoute allowedRole="loader"><LoaderCompleteOrder /></ProtectedRoute>} />
        <Route path='/loader/history' element={<ProtectedRoute allowedRole="loader"><PaymentHistory /></ProtectedRoute>} />


        {/* ================= SHOP OWNER ROUTES ================= */}
        <Route path='/shop/dashboard' element={<ProtectedRoute allowedRole="shop"><ShopDashboard /></ProtectedRoute>} />
        <Route path='/order/details' element={<ProtectedRoute allowedRole="shop"><ShopOrderDetails /></ProtectedRoute>} />
        {/* <Route path='/create/order' element={<ProtectedRoute allowedRole="shop"><CreateOrder /></ProtectedRoute>} /> */}
        <Route path='/history' element={<ProtectedRoute allowedRole="shop"><PaymentHistory /></ProtectedRoute>} />
        <Route path='/shop/profile' element={<ProtectedRoute allowedRole="shop"><ShopProfile /></ProtectedRoute>} />
        <Route path='/create/order' element={<ProtectedRoute allowedRole="shop"><NearbyLoader /></ProtectedRoute>} />

        {/* Fallback Route */}
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </>
  )
}

export default App
const express = require('express');
const orderRoute = express.Router();
const loaderController = require('./../controllers/loader.controller')

const { getFareEstimate, createOrder, acceptOrder, getAcceptedOrders, getShopOwnerOrders, updateOrderStatus, getLoaderEarningsAndHistory, updatePaymentStatus } = require('../controllers/order.controller');
const { authenticateUser } = require('../utils/auth.util');
const { getOrderDetails } = require('../controllers/user.controller');


// shop owner
orderRoute.get('/my-orders', authenticateUser, getShopOwnerOrders)
orderRoute.post('/create', authenticateUser, createOrder);
orderRoute.post('/rate-loader', authenticateUser, loaderController.rateLoader);
orderRoute.put('/:orderId/payment', authenticateUser, updatePaymentStatus);

// Loader Methods
orderRoute.get('/loader-history', authenticateUser, getLoaderEarningsAndHistory);
orderRoute.post('/estimate', authenticateUser, getFareEstimate);
// orderRoute.post('/create', authenticateUser, createOrder);
orderRoute.patch('/:orderId/accept', authenticateUser, acceptOrder);
orderRoute.get('/nearby', authenticateUser, loaderController.getNearbyOrders);
orderRoute.get('/accept-order', authenticateUser, getAcceptedOrders)
orderRoute.get('/:orderId', authenticateUser, getOrderDetails)
orderRoute.put('/:orderId/status', authenticateUser, updateOrderStatus);






module.exports = orderRoute;
const express = require('express');
const orderRoute = express.Router();
const loaderController = require('./../controllers/loader.controller')

const { getFareEstimate, createOrder, acceptOrder, getAcceptedOrders, getShopOwnerOrders, updateOrderStatus, getLoaderEarningsAndHistory, updatePaymentStatus, cancelOrder, getLoaderOrders, markAsDelivered } = require('../controllers/order.controller');
const { authenticateUser } = require('../utils/auth.util');
const { getOrderDetails } = require('../controllers/user.controller');
const upload = require('../middleware/upload.middleware');


// shop owner
orderRoute.get('/my-orders', authenticateUser, getShopOwnerOrders)
orderRoute.post('/create', authenticateUser,upload.single('goods_photo'), createOrder);
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
// for the shop owner
orderRoute.put('/:orderId/cancel', authenticateUser, cancelOrder)

// for the loader
orderRoute.put('/reject/:orderId', authenticateUser, cancelOrder)
orderRoute.put('/orders/delivered/:orderId', authenticateUser, markAsDelivered);


orderRoute.get('/loader/orders', authenticateUser, getLoaderOrders);






module.exports = orderRoute;
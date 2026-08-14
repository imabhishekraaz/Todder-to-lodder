const express = require('express');
const PaymentRouter = express.Router();
const { createRazorpayOrder, getShopPaymentHistory } = require('../controllers/payment.controller');
const { authenticateUser } = require('../utils/auth.util');

PaymentRouter.post('/create-razorpay-order', authenticateUser, createRazorpayOrder);
PaymentRouter.get('/history', authenticateUser, getShopPaymentHistory)

module.exports = PaymentRouter;
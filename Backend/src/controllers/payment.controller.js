const PaymentModel = require('../models/payment.model'); // Apne path ke hisab se import karein
const OrderModel = require('../models/order.model');

exports.createOrderWithPayment = async (req, res) => {
    try {
        const shopOwnerId = req.user.id;
        const { pickup, drop, goods, vehicle_type_requested, estimated_fare, payment_details } = req.body;

        // 1. Create the Order
        const newOrder = await OrderModel.create({
            shop_owner_id: shopOwnerId,
            pickup,
            drop,
            goods,
            vehicle_type_requested,
            estimated_fare,
            status: 'requested'
        });

        // 2. Create the Payment Record
        await PaymentModel.create({
            order_id: newOrder._id,
            amount: estimated_fare,
            method: 'razorpay',
            status: 'success',
            transaction_ref: payment_details.razorpay_payment_id,
            paid_at: new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Order posted and payment recorded successfully!",
            data: newOrder
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZ_API,         // Apni .env file wali Key ID
    key_secret: process.env.RAZ_SECRET  // Apni .env file wali Secret Key
});

exports.createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const options = {
            amount: Number(amount) * 100, // Rupees ko Paise mein convert karna
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Fetch payment and order history for the logged-in shop owner
exports.getShopPaymentHistory = async (req, res) => {
    try {
        const shopOwnerId = req.user.id || req.user._id;

        if (!shopOwnerId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized: Shop owner ID not found." 
            });
        }

        // Database se payments fetch karein aur sath hi associated order details populate karein
        const payments = await PaymentModel.find()
            .populate({
                path: 'order_id',
                match: { shop_owner_id: shopOwnerId }, // Sirf is shop owner ke orders
                select: 'pickup drop goods vehicle_type_requested estimated_fare status shop_owner_id'
            })
            .sort({ createdAt: -1 }); // Nayi history sabse upar

        // Dusre shop owners ke null orders ko filter out karein
        const validPayments = payments.filter(p => p.order_id !== null);

        return res.status(200).json({
            success: true,
            count: validPayments.length,
            data: validPayments
        });

    } catch (error) {
        console.error("Error fetching payment history:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
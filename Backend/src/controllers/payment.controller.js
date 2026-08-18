const PaymentModel = require('../models/payment.model');
const OrderModel = require('../models/order.model');

exports.createOrderWithPayment = async (req, res) => {
    try {
        const shopOwnerId = req.user.id;
        const { pickup, drop, goods, vehicle_type_requested, estimated_fare, payment_method, payment_status, payment_details } = req.body;

        // 1. Create the Order with Payment Status
        const newOrder = await OrderModel.create({
            shop_owner_id: shopOwnerId,
            pickup,
            drop,
            goods,
            vehicle_type_requested,
            estimated_fare,
            payment_method: payment_method || 'cash',
            payment_status: payment_status || 'pending',
            payment_details: payment_details || null,
            status: 'requested'
        });

        // 2. Agar Online Payment (Razorpay) hai, toh Payment Record bhi banayein
        if (payment_status === 'paid' && payment_details) {
            await PaymentModel.create({
                order_id: newOrder._id,
                amount: estimated_fare,
                method: 'razorpay',
                status: 'success',
                transaction_ref: payment_details.razorpay_payment_id,
                paid_at: new Date()
            });
        }

        return res.status(201).json({
            success: true,
            message: "Order posted successfully!",
            data: newOrder
        });

    } catch (error) {
        console.error("Create Order With Payment Error:", error);
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

        // 🚀 Shop owner ke saare paid ya online payment wale orders nikalna
        const paidOrders = await OrderModel.find({ 
            shop_owner_id: shopOwnerId,
            $or: [
                { payment_status: 'paid' },
                { payment_method: 'upi' }
            ]
        })
        .populate('loader_id', 'name phone')
        .populate('vehicle_id', 'registration_number vehicle_type')
        .sort({ createdAt: -1 }); // Nayi history sabse upar

        return res.status(200).json({
            success: true,
            count: paidOrders.length,
            data: paidOrders
        });

    } catch (error) {
        console.error("Error fetching shop payment history:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.getLoaderPaymentHistory = async (req, res) => {
    try {
        const loaderId = req.user?.id || req.user?._id;
        const role = req.user?.role;

        if (role !== 'loader') {
            return res.status(403).json({ success: false, message: "Access denied. Only loaders can view this." });
        }

        // 🚀 Database se sirf wahi orders nikalen jo 'delivered' aur 'paid' dono hain
        const paidOrders = await OrderModel.find({ 
            loader_id: loaderId,
            status: 'delivered',
            payment_status: 'paid'
        })
        .populate('shop_owner_id', 'name phone')
        .populate('vehicle_id', 'registration_number vehicle_type')
        .sort({ updatedAt: -1 }); // Sabse recent payment sabse upar

        // Total earnings ka sum calculate kar len
        const totalEarnings = paidOrders.reduce((sum, order) => sum + (order.estimated_fare || order.final_fare || 0), 0);

        return res.status(200).json({
            success: true,
            total_earnings: totalEarnings,
            count: paidOrders.length,
            data: paidOrders
        });

    } catch (error) {
        console.error("Get Loader Payment History Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
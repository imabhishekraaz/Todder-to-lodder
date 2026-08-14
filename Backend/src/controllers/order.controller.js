const { calculateFare } = require('../utils/fareCalculator');
const { calculateDistance } = require('../utils/distanceCalculator');
const OrderModel = require('../models/order.model');
const VehicleModel = require('.././models/vehicle.model')
const PaymentModel = require('../models/payment.model'); // Aapka Payment schema model
const {LoaderModel  } = require('../models/user.model')


exports.cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Security check: Sirf 'requested' status wale orders hi cancel ho sakte hain (jab tak loader accept na kare)
        if (order.status !== 'requested') {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot cancel order. It has already been accepted or is in progress." 
            });
        }

        // Status ko update karke 'cancelled' kar dein
        order.status = 'cancelled';
        
        // Status history mein bhi add kar sakte hain agar aapke project mein history maintain hoti hai
        if (order.status_history) {
            order.status_history.push({
                status: 'cancelled',
                timestamp: new Date()
            });
        }

        await order.save();

        return res.status(200).json({ 
            success: true, 
            message: "Order cancelled successfully", 
            data: order 
        });

    } catch (error) {
        console.error("Cancel Order Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.createOrder = async (req, res) => {
    try {
        const shopOwnerId = req.user.id; // Token se shop owner ki ID
        const { pickup, drop, goods, vehicle_type_requested, estimated_fare, payment_method, payment_details } = req.body;

        // Agar payment details (Razorpay response) aayi hai, toh status 'paid' aur method 'upi' hoga
        const paymentStatus = payment_details ? 'paid' : 'pending';
        const finalPaymentMethod = payment_details ? 'upi' : (payment_method || 'cash');

        const newOrder = new OrderModel({
            shop_owner_id: shopOwnerId,
            pickup,
            drop,
            goods,
            vehicle_type_requested,
            estimated_fare,
            payment_method: finalPaymentMethod,
            payment_status: paymentStatus,
            payment_details: payment_details || null,
            status: 'requested'
        });

        await newOrder.save();

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: newOrder
        });

    } catch (error) {
        console.error("Order Creation Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.acceptOrder = async (req, res) => {
    try {
        const loaderId = req.user.id;
        const role = req.user.role;
        const orderId = req.params.orderId;
        const { vehicle_id } = req.body; 

        if (role !== 'loader') {
            return res.status(403).json({ success: false, message: "Only loaders can accept orders" });
        }

        if (!vehicle_id) {
            return res.status(400).json({ success: false, message: "Please provide the vehicle_id you are using" });
        }

        // 1. Verify that the vehicle belongs to this loader
        const loaderVehicle = await VehicleModel.findOne({ _id: vehicle_id, loader_id: loaderId });
        if (!loaderVehicle) {
            return res.status(403).json({ success: false, message: "Yeh vehicle aapka nahi hai ya register nahi hai." });
        }

        // 2. Check if order exists and is still requested, then update
        const order = await OrderModel.findOneAndUpdate(
            { _id: orderId, status: 'requested' }, 
            {
                $set: { 
                    status: 'accepted', 
                    loader_id: loaderId, 
                    vehicle_id: vehicle_id 
                },
                $push: { 
                    status_history: { status: 'accepted', timestamp: new Date() } 
                }
            },
            { new: true } 
        );

        if (!order) {
            return res.status(409).json({ 
                success: false, 
                message: "Order has already been accepted by another loader or cancelled." 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Aapne order successfully accept kar liya hai!",
            data: order
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getFareEstimate = async (req, res) => {
    try {
        const { pickup_location, drop_location, vehicle_type, goods_category } = req.body;

        if (!pickup_location || !drop_location || !vehicle_type) {
            return res.status(400).json({ success: false, message: "Missing required fields for estimate" });
        }

        // TODO: Yahan Google Maps Distance Matrix API call hogi
        // Example logic: const distanceData = await getGoogleMapsDistance(pickup_location, drop_location);
        // const distance_km = distanceData.distanceValueInKm;

        // Abhi testing ke liye hum maan lete hain ki distance 12.5 km hai
        const distance_km = 12.5; 

        // Utility function call karke fare nikalna
        const estimated_fare = calculateFare(distance_km, vehicle_type, goods_category);

        return res.status(200).json({
            success: true,
            data: {
                distance_km: distance_km,
                vehicle_type: vehicle_type,
                estimated_fare: estimated_fare
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};



exports.getFareEstimate = async (req, res) => {
    try {
        // Frontend se coordinates aur details aayengi
        const { pickup_location, drop_location, vehicle_type, goods_category } = req.body;

        if (!pickup_location || !drop_location || !vehicle_type) {
            return res.status(400).json({ success: false, message: "Missing required fields for estimate" });
        }

        // 1. Asli distance nikalne ke liye Google Maps API call karein
        // pickup_location.coordinates = [lng, lat]
        const distance_km = await calculateDistance(
            pickup_location.coordinates, 
            drop_location.coordinates
        );

        // 2. Apne fare formula se price nikalein
        const estimated_fare = calculateFare(distance_km, vehicle_type, goods_category);

        return res.status(200).json({
            success: true,
            data: {
                distance_km: distance_km,
                vehicle_type: vehicle_type,
                estimated_fare: estimated_fare
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAcceptedOrders = async (req, res) => {
    try {
        const loaderId = req.user.id;
        const role = req.user.role;

        if (role !== 'loader') {
            return res.status(403).json({ success: false, message: "Only loaders can access this route" });
        }

        const acceptedOrders = await OrderModel.find({
            loader_id: loaderId,
            status: { $in: ['accepted', 'arrived', 'loaded', 'in_transit'] }
        })
        .populate('shop_owner_id', 'name phone email') // 🚀 Schema ke exact field name ke sath populate
        .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: acceptedOrders.length,
            data: acceptedOrders
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.getShopOwnerOrders = async (req, res) => {
    try {
        const shopOwnerId = req.user.id;

        // Fetch all orders created by this specific shop owner
        const orders = await OrderModel.find({ shop_owner_id: shopOwnerId })
            .populate('loader_id', 'name phone')
            .populate('vehicle_id', 'vehicle_type vehicle_number')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Order status update (e.g., Completed)

exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // 'completed', etc.
        const loaderId = req.user.id;

        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Ensure yahi loader assigned hai
        if (order.loader_id && order.loader_id.toString() !== loaderId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to update this order." });
        }

        // Agar order pehle hi completed hai, toh dubara earnings add na ho
        const isNewlyCompleted = status === 'delivered' && order.status !== 'delivered';

        order.status = status;
        order.status_history.push({ status, timestamp: new Date() });

        if (status === 'delivered') {
            order.final_fare = order.estimated_fare || 0;
        }

        await order.save();

        // 🚀 Agar order pehli baar complete hua hai, toh loader ki earnings mein amount add karein
        if (isNewlyCompleted) {
            const earnedAmount = order.estimated_fare || 0;
            
            // Loader model mein total earnings update karein 
            // (Note: Agar aapka model ka naam ya field alag ho jaise 'totalEarnings' ya 'earnings', toh use apne schema ke mutabiq check kar lein)
            await LoaderModel.findByIdAndUpdate(loaderId, {
                $inc: { total_earnings: earnedAmount, completed_orders_count: 1 } 
            });
        }

        return res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};




exports.getLoaderEarningsAndHistory = async (req, res) => {
    try {
        const loaderId = req.user.id;

        const loader = await LoaderModel.findById(loaderId); // Ya LoaderModel.findById(loaderId)
        
        // Delivered ya completed orders fetch karein
        const completedOrders = await OrderModel.find({ 
            loader_id: loaderId, 
            status: { $in: ['delivered', 'completed'] } 
        }).sort({ updatedAt: -1 });

        // 🚀 Total Earnings khud calculate karein (estimated_fare ya final_fare ka sum)
        const calculatedTotalEarnings = completedOrders.reduce((sum, order) => {
            return sum + (order.final_fare || order.estimated_fare || 0);
        }, 0);

        return res.status(200).json({
            success: true,
            total_earnings: calculatedTotalEarnings, // 🌟 Ab saare completed orders ka total fare yahan aayega
            rating: loader ? loader.rating || 5.0 : 5.0,
            data: completedOrders
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.updatePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { payment_status } = req.body; // 'paid'

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        order.payment_status = payment_status || 'paid';
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Payment status updated to paid successfully!",
            data: order
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
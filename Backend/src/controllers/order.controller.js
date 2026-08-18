const { calculateFare } = require('../utils/fareCalculator');
const { calculateDistance } = require('../utils/distanceCalculator');
const OrderModel = require('../models/order.model');
const VehicleModel = require('.././models/vehicle.model')
const PaymentModel = require('../models/payment.model'); // Aapka Payment schema model
const { LoaderModel } = require('../models/user.model')


exports.cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId || req.params.id;
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Security check: Agar order already accepted/in progress hai
        if (order.status !== 'requested' && order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel order. It has already been accepted or is in progress."
            });
        }

        // Check karein ki cancel kaun kar raha hai (Shop owner ya Loader)
        const userRole = req.user?.role; // 'shop_owner' ya 'loader'
        const cancellationReason = req.body.cancellation_reason || 'Cancelled by user';

        order.status = 'cancelled';
        order.cancelled_by = userRole === 'loader' ? 'loader' : 'shop_owner';
        order.cancellation_reason = cancellationReason;

        if (!order.status_history) {
            order.status_history = [];
        }
        order.status_history.push({
            status: 'cancelled',
            timestamp: new Date()
        });

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled/rejected successfully",
            data: order
        });

    } catch (error) {
        console.error("Cancel Order Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const {
            vehicle_type_requested,
            vehicle_id,
            loader_id,
            estimated_fare,
            payment_method,
            payment_status 
        } = req.body;

        const shopOwnerId = req.user.id || req.user._id;
        const photoPath = req.file ? req.file.path : '';

        // Safe parsing helper function for FormData
        const parseField = (field) => {
            if (!field) return null;
            if (typeof field === 'object') return field; 
            try {
                return JSON.parse(field);
            } catch (e) {
                return field;
            }
        };

        const pickupData = parseField(req.body.pickup);
        const dropData = parseField(req.body.drop);
        const goodsData = parseField(req.body.goods);
        const paymentDetailsData = parseField(req.body.payment_details); 

        // Validation
        if (!loader_id || !vehicle_id) {
            return res.status(400).json({ success: false, message: "Loader ID and Vehicle ID are required." });
        }

        const finalPaymentStatus = payment_status || (payment_method === 'upi' ? 'paid' : 'pending');
        
        // 🚀 LOGIC: Agar payment_status 'paid' hai (jaise UPI online payment), toh is_paid true hoga, warna false.
        const isPaidFlag = finalPaymentStatus === 'paid';

        const newOrder = new OrderModel({
            shop_owner_id: shopOwnerId,
            loader_id: loader_id,
            vehicle_id: vehicle_id,
            pickup: {
                address: pickupData?.address || req.body['pickup[address]'] || '',
                location: {
                    type: 'Point',
                    coordinates: pickupData?.location?.coordinates || [
                        parseFloat(req.body['pickup[location][coordinates][0]']) || 0,
                        parseFloat(req.body['pickup[location][coordinates][1]']) || 0
                    ]
                }
            },
            drop: {
                address: dropData?.address || req.body['drop[address]'] || '',
                location: {
                    type: 'Point',
                    coordinates: dropData?.location?.coordinates || [
                        parseFloat(req.body['drop[location][coordinates][0]']) || 0,
                        parseFloat(req.body['drop[location][coordinates][1]']) || 0
                    ]
                }
            },
            goods: {
                category: goodsData?.category || req.body['goods[category]'] || 'General Goods',
                weight_kg: Number(goodsData?.weight_kg || req.body['goods[weight_kg]'] || 10),
                photo_url: photoPath
            },
            vehicle_type_requested,
            estimated_fare: Number(estimated_fare) || 0,
            payment_method: payment_method || 'cash',
            payment_status: finalPaymentStatus,
            is_paid: isPaidFlag, // 🚀 Yahan is_paid automatically set ho jayega
            payment_details: paymentDetailsData || {
                razorpay_payment_id: req.body['payment_details[razorpay_payment_id]'] || '',
                razorpay_order_id: req.body['payment_details[razorpay_order_id]'] || '',
                razorpay_signature: req.body['payment_details[razorpay_signature]'] || '',
                status: req.body['payment_details[status]'] || 'success'
            },
            status: 'requested',
            status_history: [{ status: 'requested', timestamp: new Date() }]
        });

        await newOrder.save();

        console.log("✅ Order created successfully with ID:", newOrder._id, "| is_paid:", newOrder.is_paid);

        return res.status(201).json({
            success: true,
            message: "Order created successfully!",
            data: newOrder
        });

    } catch (error) {
        console.error("❌ Create Order Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.acceptOrder = async (req, res) => {
    try {
        const loaderId = req.user?.id || req.user?._id;
        const orderId = req.params.orderId;

        const order = await OrderModel.findOne({
            _id: orderId,
            loader_id: loaderId,
            $or: [{ status: 'requested' }, { status: 'pending' }]
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or already processed." });
        }

        // 🔍 Check karein ki order ke paas vehicle_id hai ya nahi
        if (!order.vehicle_id) {
            return res.status(400).json({
                success: false,
                message: "Vehicle ID is missing for this order. Please assign a vehicle."
            });
        }

        order.status = 'accepted';
        order.status_history.push({ status: 'accepted', timestamp: new Date() });
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order accepted successfully!",
            data: order
        });
    } catch (error) {
        console.error("Accept Order Error:", error);
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
        const orderId = req.params.orderId || req.params.id;
        const { status } = req.body; // Yahan status ya value aa rahi hai ('delivered' ya 'paid' etc.)

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // 🔍 Check karein ki kya update karna hai
        if (status === 'paid') {
            order.payment_status = 'paid'; // Payment status update karein
        } else if (['requested', 'accepted', 'arrived', 'loaded', 'in_transit', 'delivered', 'cancelled'].includes(status)) {
            order.status = status; // Main order status update karein
            
            if (!order.status_history) order.status_history = [];
            order.status_history.push({
                status: status,
                timestamp: new Date()
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid status value provided." });
        }

        await order.save();

        return res.status(200).json({ 
            success: true, 
            message: "Order updated successfully", 
            data: order 
        });

    } catch (error) {
        console.error("Update Status Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLoaderOrders = async (req, res) => {
    try {
        const loaderId = req.user?.id || req.user?._id;
        const role = req.user?.role;

        if (role !== 'loader') {
            return res.status(403).json({ success: false, message: "Access denied. Only loaders can view this." });
        }

        // 🚀 Optional: Aap chahein toh yahan query mein hi filter laga sakte hain 
        // taaki database se sirf wahi orders aayein jinki payment abhi baki hai ya jo requested hain.
        // Lekin agar aap frontend par filter kar rahe hain, toh sirf loader_id rakhna bhi theek hai.
        const orders = await OrderModel.find({ loader_id: loaderId })
            .populate('shop_owner_id', 'name phone')
            .populate('vehicle_id', 'registration_number vehicle_type')
            .sort({ createdAt: -1 }); // Naye orders sabse upar

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Get Loader Orders Error:", error);
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


// 4. Update Payment Status (COD / Cash confirmation)
// exports.updatePaymentStatus = async (req, res) => {
//     try {
//         const orderId = req.params.id || req.params.orderId;
//         const { payment_status } = req.body;

//         const order = await OrderModel.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         order.payment_status = payment_status || 'paid';
//         await order.save();

//         return res.status(200).json({
//             success: true,
//             message: "Payment status updated successfully",
//             data: order
//         });
//     } catch (error) {
//         console.error("Update Payment Error:", error);
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };
exports.updatePaymentStatus = async (req, res) => {
    try {
        const orderId = req.params.id || req.params.orderId;
        const { payment_status } = req.body;

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // 🚀 Payment status update karein
        order.payment_status = payment_status || 'paid';
        
        // 🚀 Yeh rahi wo main line jo loader ki active list se order instant hata degi
        if (order.payment_status === 'paid' || order.payment_status === 'success') {
            order.is_paid = true;
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            data: order
        });
    } catch (error) {
        console.error("Update Payment Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.markAsDelivered = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        order.status = 'delivered';
        if (!order.status_history) {
            order.status_history = [];
        }
        order.status_history.push({ status: 'delivered', timestamp: new Date() });

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order marked as delivered successfully!",
            data: order
        });
    } catch (error) {
        console.error("Mark Delivered Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Set the status for the Loader
exports.completeDeliveryAndPayment = async (req, res) => {
    try {
        const orderId = req.params.orderId || req.params.id;
        const { action } = req.body; // 'mark_delivered' ya 'confirm_cash'

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // 1. Agar loader "Mark as Delivered" kar raha hai
        if (action === 'mark_delivered') {
            order.status = 'delivered';
            
            if (!order.status_history) order.status_history = [];
            order.status_history.push({
                status: 'delivered',
                timestamp: new Date()
            });

            await order.save();
            return res.status(200).json({
                success: true,
                message: "Order marked as delivered successfully",
                data: order
            });
        }

        // 2. Agar loader "Confirm Cash Received & Complete" kar raha hai
        if (action === 'confirm_cash') {
            // 🛑 STRICT SECURITY CHECK: Check karein ki owner ne pay kiya hai ya nahi (is_paid === true)
            const isOnline = order.payment_method === 'upi' || order.payment_method === 'razorpay';
            const isOwnerPaid = isOnline || order.is_paid === true || order.payment_status === 'paid';

            if (!isOwnerPaid) {
                return res.status(400).json({
                    success: false,
                    message: "Action Blocked! Shop owner ne abhi tak cash payment confirm nahi ki hai."
                });
            }

            order.status = 'completed';
            order.payment_status = 'paid';
            order.is_paid = true; // Ensure flag is true

            if (!order.status_history) order.status_history = [];
            order.status_history.push({
                status: 'completed',
                timestamp: new Date()
            });

            await order.save();
            return res.status(200).json({
                success: true,
                message: "Cash received and order completed successfully",
                data: order
            });
        }

        return res.status(400).json({ success: false, message: "Invalid action provided." });

    } catch (error) {
        console.error("Complete Delivery Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Order Complete / Delivered karne ka controller
exports.completeOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await OrderModel.findById(orderId);

        // Sirf status update karein, payment nahi
        order.status = 'delivered';
        order.status_history.push({ status: 'delivered', timestamp: new Date() });

        await order.save();

        return res.status(200).json({ success: true, message: "Order marked as delivered." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Payment Confirm karne ka controller (Jab loader cash le le)
exports.confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await OrderModel.findById(orderId);

        // Payment status ko explicitly 'paid' karein
        order.payment_status = 'paid';
        await order.save();

        return res.status(200).json({ success: true, message: "Payment confirmed by loader!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
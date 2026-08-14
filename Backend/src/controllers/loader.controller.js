const OrderModel = require('./../models/order.model')
const vehicleModel = require('./../models/vehicle.model')


exports.updateLoaderLocation = async (req, res) => {
    try {
        const loaderId = req.user.id; // JWT token se loader ki ID
        const { coordinates } = req.body; // Frontend se aane wale [lng, lat]

        // 1. Validation check
        if (!coordinates || coordinates.length !== 2) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid coordinates provided." 
            });
        }

        // 2. updateMany use karein taaki loader ke SAARE vehicles ke coordinates update ho jayein
        const updateResult = await VehicleModel.updateMany(
            { loader_id: loaderId },
            { 
                $set: { 
                    "current_location.type": "Point",
                    "current_location.coordinates": coordinates
                } 
            }
        );

        // 3. Agar loader ke paas koi vehicle hi nahi hai
        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No vehicles found for this loader." 
            });
        }

        return res.status(200).json({
            success: true,
            message: `Successfully updated location for ${updateResult.modifiedCount} vehicle(s).`,
            updatedCount: updateResult.modifiedCount
        });

    } catch (error) {
        console.error("Multiple vehicles location update error:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


exports.getNearbyOrders = async (req, res) => {
    try {
        const loaderId = req.user.id;
        const role = req.user.role;

        // 1. Role Isolation: Only loaders can view nearby jobs
        if (role !== 'loader') {
            return res.status(403).json({ success: false, message: "Only loaders can access this route" });
        }

        // 2. Find the Loader's Vehicle to get their location and vehicle type
        const loaderVehicle = await vehicleModel.findOne({ loader_id: loaderId });
        console.log("Loader Vehicle Found:", loaderVehicle);

        if (!loaderVehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found. Please register a vehicle first." });
        }

        const loaderCoordinates = loaderVehicle.current_location?.coordinates;
        const loaderVehicleType = loaderVehicle.vehicle_type; // Loader ka vehicle type (jaise 'tempo')

        // 3. Find Nearby Orders matching the exact vehicle type requested
        const MAX_DISTANCE_METERS = 100000; // 100 km radius

        const availableOrders = await OrderModel.find({
            status: 'requested', 
            vehicle_type_requested: loaderVehicleType, // 🚀 Exact match loader vehicle type
            'pickup.location': {
                $near: {
                    $geometry: { 
                        type: 'Point', 
                        coordinates: loaderCoordinates 
                    },
                    $maxDistance: MAX_DISTANCE_METERS
                }
            }
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: availableOrders.length,
            data: availableOrders
        });

    } catch (error) {
        console.error("Error fetching nearby orders:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.rateLoader = async (req, res) => {
    try {
        const { orderId, loaderId, rating, review } = req.body;
        const shopOwnerId = req.user.id;

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Check karein ki order pehle hi rated toh nahi hai
        if (order.is_rated) {
            return res.status(400).json({ success: false, message: "Order has already been rated." });
        }


        // Order ko update karein
        order.is_rated = true;
        order.rating = Number(rating);
        order.review = review;
        await order.save();

        // Loader ki average rating update karein
        const LoaderModel = require('../models/order.model'); // Apna model path check kar lein
        const loader = await LoaderModel.findById(loaderId);
        if (loader) {
            const currentTotalRatings = loader.total_ratings || 0;
            const currentRatingSum = (loader.rating || 5.0) * currentTotalRatings;
            
            const newTotalRatings = currentTotalRatings + 1;
            const newAverageRating = (currentRatingSum + Number(rating)) / newTotalRatings;

            loader.rating = Number(newAverageRating.toFixed(1));
            loader.total_ratings = newTotalRatings;
            await loader.save();
        }

        return res.status(200).json({
            success: true,
            message: "Rating submitted successfully!"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
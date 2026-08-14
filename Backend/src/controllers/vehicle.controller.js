const VehicleModel = require('./../models/vehicle.model')

exports.registerVehicle = async (req, res) => {
    try {
        const loaderId = req.user.id;
        const role = req.user.role;

        // 1. Role validation
        if (role !== 'loader') {
            return res.status(403).json({ success: false, message: "Only loaders can register vehicles" });
        }

        // 2. Body se data nikalna
        const { 
            vehicle_type, 
            registration_number, 
            capacity_kg,
            current_location,  
            is_available,      
            document_status    
        } = req.body;

        // 3. Required fields validation
        if (!vehicle_type || !registration_number || !capacity_kg) {
            return res.status(400).json({ success: false, message: "Vehicle type, registration number, and capacity are required" });
        }

        // 4. Parse current_location (Kyunki FormData se string bankar aata hai)
        let parsedLocation = { type: 'Point', coordinates: [0, 0] };
        if (current_location) {
            try {
                parsedLocation = typeof current_location === 'string' ? JSON.parse(current_location) : current_location;
            } catch (e) {
                // Agar parse na ho toh default use karega
            }
        }

        // 5. Handle uploaded file (Multer se aane wali image ka path)
        let photoUrl = req.body.vehicle_photo_url || "";
        if (req.file) {
            // Windows ke backslashes (\) ko forward slash (/) mein badal rahe hain
            photoUrl = req.file.path.replace(/\\/g, "/"); 
        }

        // 6. Database mein saara data bhejna
        const newVehicle = await VehicleModel.create({
            loader_id: loaderId,
            vehicle_type,
            registration_number,
            capacity_kg,
            current_location: parsedLocation,
            is_available: is_available === 'true' || is_available === true,
            document_status: document_status || 'pending',
            vehicle_photo_url: photoUrl
        });

        // 7. Success response
        return res.status(201).json({
            success: true,
            message: "Vehicle registered successfully",
            data: newVehicle
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Registration number already exists" });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyVehicles = async (req, res) => {
    try {
        const loaderId = req.user.id;

        const vehicles = await VehicleModel.find({ loader_id: loaderId });

        return res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.toggleAvailability = async (req, res) => {
    try {
        const loaderId = req.user.id;
        const vehicleId = req.params.id;
        const { is_available } = req.body;

        if (typeof is_available !== 'boolean') {
            return res.status(400).json({ success: false, message: "is_available must be true or false" });
        }

        const updatedVehicle = await VehicleModel.findOneAndUpdate(
            { _id: vehicleId, loader_id: loaderId },
            { is_available: is_available },
            { new: true }
        );

        if (!updatedVehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found or you don't have permission" });
        }

        return res.status(200).json({
            success: true,
            message: `Vehicle availability set to ${is_available ? 'Live' : 'Offline'}`,
            data: updatedVehicle
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};




exports.findNearbyLoaders = async (req, res) => {
    try {
        // Frontend se coordinates aur requirement lenge (URL query params se)
        // Default radius ko 10km (10000 meters) set kar diya gaya hai
        const { lng, lat, vehicle_type, radius_meters = 10000 } = req.query;

        if (!lng || !lat || !vehicle_type) {
            return res.status(400).json({
                success: false,
                message: "Longitude, Latitude aur vehicle_type bhejna zaroori hai"
            });
        }

        // Aapka Geospatial Matching Engine 🚀
        const nearbyLoaders = await VehicleModel.find({
            is_available: true,                      // Loader online hona chahiye
            document_status: 'verified',             // ⚠️ Sirf verified loaders
            vehicle_type: vehicle_type,              // Order ke hisaab se correct vehicle (e.g. mini_truck)
            current_location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius_meters) // 10,000 meters = 10 km radius
                }
            }
        })
            .populate('loader_id', 'name phone profile_photo_url rating_avg') // Loader ki basic details frontend ko bhejein
            .limit(10); // Performance ke liye sirf top 10 nearest vehicles bhejein

        return res.status(200).json({
            success: true,
            count: nearbyLoaders.length,
            message: `Found ${nearbyLoaders.length} verified loaders nearby.`,
            data: nearbyLoaders
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};



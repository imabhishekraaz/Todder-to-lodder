const { ShopOwnerModel, LoaderModel, AdminModel } = require("../models/user.model");
const { generateToken } = require("../utils/auth.util");
const OrderModel = require('../models/order.model')
const { generateHashPassword, comparePassword } = require("../utils/password.util");

exports.signupUser = async (req, res) => {
    try {
        const userDetails = req.body;

        // Check request body
        if (!userDetails || Object.keys(userDetails).length === 0) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // hash the password
        const hashedPassword = await generateHashPassword(userDetails.password)
        userDetails.password = hashedPassword

        const { role } = userDetails;

        if (!role) {
            return res.status(400).json({ success: false, message: 'Role is required' });
        }

        let saveUser;

        switch (role) {
            case 'shop_owner':
                saveUser = await ShopOwnerModel.create(userDetails);
                break;
            case 'loader':
                saveUser = await LoaderModel.create(userDetails);
                break;
            case 'admin':
                saveUser = await AdminModel.create(userDetails);
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid role provided' });
        }
        const token = generateToken(saveUser)

        return res.status(201).json({
            success: true,
            token,
            message: `${role.replace('_', ' ')} account created successfully`,
            data: saveUser
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email or Phone number already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};



exports.loginUser = async (req, res) => {
    try {
        const { phone, password, role } = req.body;

        if (!phone || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                message: "Phone, password, and role are required" 
            });
        }

        let user;

        switch (role) {
            case 'shop_owner':
                user = await ShopOwnerModel.findOne({ phone });
                break;
            case 'loader':
                user = await LoaderModel.findOne({ phone });
                break;
            case 'admin':
                user = await AdminModel.findOne({ phone });
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid role provided" 
                });
        }

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found with this phone number" 
            });
        }

        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials (Wrong Password)" 
            });
        }

        // 5. Agar password match ho gaya, toh Token banayein
        const token = generateToken(user); 

        // 6. Response bhejein
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token: token,
            data: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role
            } 
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};



exports.updateOnlineStatus = async (req, res) => {
    try {
        const { userId, is_online, role } = req.body;

        // Sirf loader hi online/offline ho sakta hai
        if (role === 'loader') {
            const updatedUser = await LoaderModel.findByIdAndUpdate(
                userId, 
                { is_online: is_online },
                { new: true } // Yeh update hone ke baad naya data return karta hai
            );
            
            return res.status(200).json({ 
                success: true, 
                message: `Status updated to ${is_online ? 'Online' : 'Offline'}`,
                data: updatedUser
            });
        }

        return res.status(400).json({ 
            success: false, 
            message: "Only loaders can change online status" 
        });

    } catch (error) {
        console.error("Status Update Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        
        let user;
        if (role === 'shop_owner') user = await ShopOwnerModel.findById(userId);
        else if (role === 'loader') user = await LoaderModel.findById(userId);
        else if (role === 'admin') user = await AdminModel.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        // Find the order and populate related details
        const order = await OrderModel.findById(orderId)
            .populate('shop_owner_id', 'name phone')
            .populate('loader_id', 'name phone')
            .populate('vehicle_id', 'vehicle_type vehicle_number');

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found." 
            });
        }

        // 1. Authorization check for Loader: Ensure they are assigned to this order
        if (role === 'loader' && order.loader_id && order.loader_id._id.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: "You are not authorized to view this order." 
            });
        }

        // 2. Authorization check for Shop Owner: Ensure they created this order
        if (role === 'shop_owner' && order.shop_owner_id && order.shop_owner_id._id.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: "You are not authorized to view this order." 
            });
        }

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


const User = require('../models/user.model'); // Aapka User model

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id; // Auth middleware se mili user ID
        const { name, phone, shopName, address } = req.body;

        // User find karke update karein
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                name, 
                phone, 
                shopName: shopName || req.body.company_name, 
                address 
            },
            { new: true, runValidators: true } // Updated document return karega
        ).select('-password'); // Password hide rakhein

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
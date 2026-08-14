const mongoose = require('mongoose');
const { generateToken } = require('../utils/auth.util');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['shop_owner', 'loader', 'admin'],
        required: true
    },
    profile_photo_url: {
        type: String
    },
    is_verified: {
        type: Boolean,
        default: true
    },
    rating_avg: {
        type: Number,
        default: 0
    },
    is_online: {
        type: Boolean,
        default: false // By default offline rahega
    }
}, {
    timestamps: true
},
);
const ShopOwnerModel = mongoose.model('ShopOwner', UserSchema, 'shop_owners');
const LoaderModel = mongoose.model('Loader', UserSchema, 'loaders');
const AdminModel = mongoose.model('Admin', UserSchema, 'admins');

module.exports = {
    ShopOwnerModel,
    LoaderModel,
    AdminModel
};

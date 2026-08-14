const mongoose = require('mongoose');
const { Schema } = mongoose;  

const OrderSchema = new Schema({
    shop_owner_id: { type: Schema.Types.ObjectId, ref: 'ShopOwner', required: true },
    loader_id: { type: Schema.Types.ObjectId, ref: 'Loader', default: null },
    vehicle_id: { type: Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    
    pickup: {
        address: String,
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: [Number]  
        }
    },
    drop: {
        address: String,
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: [Number]
        }
    },
    goods: { category: String, weight_kg: Number, photo_url: String },
    vehicle_type_requested: { type: String, required: true },
    scheduled_at: { type: Date, default: null },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'arrived', 'loaded', 'in_transit', 'delivered', 'cancelled'],
        default: 'requested'
    },
    status_history: [{
        status: String, 
        timestamp: { type: Date, default: Date.now }
    }],
    estimated_fare: Number,
    final_fare: Number,
    
    // 🚀 Nayi Fields Add Ki Gayi Hain (Database Persistence ke liye)
    payment_status: { 
        type: String, 
        enum: ['pending', 'paid'], 
        default: 'pending' 
    },
    is_rated: { 
        type: Boolean, 
        default: false 
    },
    rating: { 
        type: Number, 
        default: 0 
    },
    review: { 
        type: String, 
        default: '' 
    },

    cancelled_by: {
        type: String, 
        enum: ['shop_owner', 'loader', null], 
        default: null
    },
    cancellation_reason: String,
    delivery_otp: String,
    delivery_photo_url: String,
}, { timestamps: true });

OrderSchema.index({ 'pickup.location': '2dsphere' });
OrderSchema.index({ 'drop.location': '2dsphere' });

const OrderModel = mongoose.model('Order', OrderSchema);

module.exports = OrderModel;
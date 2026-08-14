const mongoose = require('mongoose');

const OrderBidSchema = new mongoose.Schema({
    order_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true 
    },
    loader_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    shop_owner_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    proposed_fare: { 
        type: Number, 
        default: null 
    },
    eta_minutes: { 
        type: Number, 
        default: null 
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled_by_loader'],
        default: 'pending'
    }
}, { timestamps: true });

OrderBidSchema.index({ order_id: 1, loader_id: 1 }, { unique: true });

module.exports = mongoose.model('OrderBid', OrderBidSchema);
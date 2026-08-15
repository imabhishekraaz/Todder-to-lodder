const mongoose = require('mongoose');
const { Schema } = mongoose; 

const VehicleSchema = new Schema({
    loader_id: {
        type: Schema.Types.ObjectId,
        ref: 'Loader', 
        required: true
    },
    vehicle_type: {
        type: String,
        enum: ['mini_truck', 'tempo', 'pickup', 'e_cart'],
        required: true
    },
    registration_number: {
        type: String,
        required: true,
        unique: true
    },
    capacity_kg: {
        type: Number,
        required: true
    },
    //  Per KM fare field added
    fare_per_km: {
        type: Number,
        required: true,
        default: 15
    },
    vehicle_photo_url: {
        type: String
    },
    document_status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    is_available: {
        type: Boolean,
        default: false
    },
    current_location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]  
        }
    },
}, { timestamps: true });

VehicleSchema.index({ current_location: '2dsphere' });

const VehicleModel = mongoose.model('Vehicle', VehicleSchema);

module.exports = VehicleModel;
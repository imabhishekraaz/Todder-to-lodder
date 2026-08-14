const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'upi', 'card', 'wallet', 'razorpay'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  transaction_ref: String, // Yahan Razorpay payment_id save hogi
  paid_at: Date,
}, { timestamps: true });

const PaymentModel = mongoose.model('Payment', PaymentSchema);

module.exports = PaymentModel;
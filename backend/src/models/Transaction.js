const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId:     { type: String, required: true, unique: true },
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:              { type: String, enum: ['deposit', 'withdrawal', 'lease_payment', 'refund'], required: true },
  amount:            { type: Number, required: true, min: 0.01 },
  balanceBefore:     { type: Number, required: true },
  balanceAfter:      { type: Number, required: true },
  status:            { type: String, enum: ['successful', 'failed', 'flagged'], default: 'successful' },
  description:       { type: String },
  relatedLeaseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Lease' },
  relatedPaymentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'LeasePayment' },
  suspiciousFlag:    { type: Boolean, default: false },
  suspiciousReasons: [{ type: String }],
}, { timestamps: true });

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ suspiciousFlag: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

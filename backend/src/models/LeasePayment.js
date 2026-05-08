const mongoose = require('mongoose');

// One document per monthly installment
const leasePaymentSchema = new mongoose.Schema({
  leaseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Lease', required: true },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toolKitId:     { type: mongoose.Schema.Types.ObjectId, ref: 'ToolKit', required: true },

  installmentNo: { type: Number, required: true },   // 1 to 12
  dueDate:       { type: Date, required: true },      // e.g. 2026-06-01
  amount:        { type: Number, required: true },

  status:        { type: String, enum: ['upcoming', 'due', 'paid', 'overdue', 'waived'], default: 'upcoming' },

  // Filled when paid
  paidAt:        { type: Date },
  paidAmount:    { type: Number },
  paymentMethod: { type: String, enum: ['wallet', 'easypaisa', 'jazzcash', 'bank', 'cash'], default: 'wallet' },
  transactionRef:{ type: String },      // wallet transaction ID or Easypaisa ref
  walletTxId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },

  verifiedByAdmin: { type: Boolean, default: false },
  verifiedAt:      { type: Date },
  verifiedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  notes:         { type: String },
}, { timestamps: true });

leasePaymentSchema.index({ leaseId: 1, installmentNo: 1 }, { unique: true });
leasePaymentSchema.index({ userId: 1, status: 1 });
leasePaymentSchema.index({ dueDate: 1, status: 1 }); // for overdue cron/check

module.exports = mongoose.model('LeasePayment', leasePaymentSchema);

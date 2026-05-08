const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance:         { type: Number, default: 0, min: 0 },
  currency:        { type: String, default: 'PKR' },
  status:          { type: String, enum: ['active', 'frozen'], default: 'active' },
  totalDeposited:  { type: Number, default: 0 },
  totalSpent:      { type: Number, default: 0 },  // total deducted for lease payments
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);

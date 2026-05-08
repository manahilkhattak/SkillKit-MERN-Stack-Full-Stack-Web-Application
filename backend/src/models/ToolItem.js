const mongoose = require('mongoose');

// Individual physical kit — each has its own serial number, condition, and history
const toolItemSchema = new mongoose.Schema({
  toolKitId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ToolKit', required: true },
  serialNumber: { type: String, required: true, unique: true, trim: true },
  condition:    { type: String, enum: ['new', 'good', 'fair', 'poor'], default: 'new' },
  status:       {
    type: String,
    enum: ['available', 'on_lease', 'under_maintenance', 'retired'],
    default: 'available',
  },
  purchaseCost: { type: Number },               // what admin paid for this specific unit
  purchaseDate: { type: Date },
  notes:        { type: String, trim: true },   // admin notes (e.g. "front panel scratched")

  // Set when item goes on lease, cleared when returned
  currentLeaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lease', default: null },
  currentLesseeId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',  default: null },

  addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

toolItemSchema.index({ toolKitId: 1, status: 1 });

module.exports = mongoose.model('ToolItem', toolItemSchema);

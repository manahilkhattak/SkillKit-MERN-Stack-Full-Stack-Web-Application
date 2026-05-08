const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toolKitId:       { type: mongoose.Schema.Types.ObjectId, ref: 'ToolKit', required: true },

  // Personal details captured at application time
  address:         { type: String, required: true },
  institute:       { type: String, required: true },
  trade:           { type: String, required: true },
  gradDate:        { type: Date, required: true },

  // Uploaded documents
  cnicDocPath:     { type: String, required: true },
  certDocPath:     { type: String, required: true },

  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  reviewedAt:      { type: Date },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Set when approved — which specific physical item was assigned
  assignedItemId:  { type: mongoose.Schema.Types.ObjectId, ref: 'ToolItem', default: null },
}, { timestamps: true });

applicationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);

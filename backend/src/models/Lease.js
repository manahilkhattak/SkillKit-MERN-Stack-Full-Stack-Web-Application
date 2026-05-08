const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toolKitId:     { type: mongoose.Schema.Types.ObjectId, ref: 'ToolKit', required: true },
  toolItemId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ToolItem', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },

  startDate:     { type: Date, required: true },
  endDate:       { type: Date, required: true },
  monthlyRent:   { type: Number, required: true },
  totalMonths:   { type: Number, default: 12 },

  status: {
    type: String,
    enum: ['active', 'completed', 'defaulted', 'terminated'],
    default: 'active',
  },

  // Condition of item when handed over vs returned
  conditionOnDispatch: { type: String, enum: ['new','good','fair','poor'], default: 'good' },
  conditionOnReturn:   { type: String, enum: ['new','good','fair','poor'] },
  returnNotes:         { type: String },
  returnedAt:          { type: Date },
}, { timestamps: true });

leaseSchema.index({ userId: 1, status: 1 });
leaseSchema.index({ toolItemId: 1, status: 1 });

module.exports = mongoose.model('Lease', leaseSchema);

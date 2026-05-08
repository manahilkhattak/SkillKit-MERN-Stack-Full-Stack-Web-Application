const mongoose = require('mongoose');

// Master catalog entry — the "type" of kit (e.g. Plumbing Starter Kit)
// Individual physical kits are ToolItem documents
const toolKitSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  trade:           { type: String, required: true, trim: true }, // Plumbing, Electrical, Welding...
  description:     { type: String, trim: true },
  components:      [{ name: String, quantity: Number, unit: String }], // structured list
  monthlyRent:     { type: Number, required: true, min: 1 },
  replacementCost: { type: Number, required: true, min: 1 }, // total market value
  leaseDuration:   { type: Number, default: 12 },            // months
  imageUrl:        { type: String },
  isActive:        { type: Boolean, default: true },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual: count of available items of this kit type
toolKitSchema.virtual('availableCount', {
  ref: 'ToolItem',
  localField: '_id',
  foreignField: 'toolKitId',
  count: false,
});

module.exports = mongoose.model('ToolKit', toolKitSchema);

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:     { type: String, required: true }, // e.g. APPROVE_APPLICATION, BLOCK_USER
  targetType: { type: String },                 // 'user', 'toolitem', 'lease', 'application'
  targetId:   { type: mongoose.Schema.Types.ObjectId },
  details:    { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

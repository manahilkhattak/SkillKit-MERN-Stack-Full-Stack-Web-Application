const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['lessee', 'admin'], default: 'lessee' },
  status:       { type: String, enum: ['active', 'blocked'], default: 'active' },
  phone:        { type: String, trim: true },
  cnic:         { type: String, trim: true, unique: true, sparse: true },

  // NAVTTC-specific
  institute:    { type: String, trim: true },   // NAVTTC institute name
  trade:        { type: String, trim: true },   // e.g. Plumber, Electrician
  gradDate:     { type: Date },

  // Uploaded doc paths (stored on server, served via authenticated API)
  cnicDocPath:  { type: String },
  certDocPath:  { type: String },

  lastLogin:    { type: Date },
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.passwordHash;
  return o;
};

userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);

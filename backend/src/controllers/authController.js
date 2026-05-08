const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { ok, err } = require('../utils/response');
const { notify } = require('../utils/notify');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, cnic, institute, trade } = req.body;
    if (await User.findOne({ email }))
      return err(res, 'This email is already registered', 409, 'EMAIL_EXISTS');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, phone, cnic, institute, trade });
    await Wallet.create({ userId: user._id });
    await notify(user._id, 'Welcome to SkillKit!', 'Your account and wallet are ready. Apply for a starter kit to get started.', 'account');

    const token = signToken(user);
    return ok(res, { user, token }, 'Registration successful', 201);
  } catch (e) { next(e); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    const SAFE = 'Invalid email or password';
    if (!user || !await user.matchPassword(password))
      return err(res, SAFE, 401, 'INVALID_CREDENTIALS');
    user.lastLogin = new Date();
    await user.save();
    const token = signToken(user);
    return ok(res, { user, token }, 'Login successful');
  } catch (e) { next(e); }
};

// GET /api/auth/me
const getMe = async (req, res) => ok(res, { user: req.user });

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!await user.matchPassword(currentPassword))
      return err(res, 'Current password is incorrect', 400);
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return ok(res, {}, 'Password changed successfully');
  } catch (e) { next(e); }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'cnic', 'institute', 'trade'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    return ok(res, { user }, 'Profile updated');
  } catch (e) { next(e); }
};

module.exports = { register, login, getMe, changePassword, updateProfile };

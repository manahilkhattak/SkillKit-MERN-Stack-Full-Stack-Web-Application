const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Lease = require('../models/Lease');
const LeasePayment = require('../models/LeasePayment');
const Application = require('../models/Application');
const ToolKit = require('../models/ToolKit');
const ToolItem = require('../models/ToolItem');
const AuditLog = require('../models/AuditLog');
const { ok, err } = require('../utils/response');
const { notify } = require('../utils/notify');

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers, activeUsers, blockedUsers,
      pendingApps, activeLeases, overduePayments,
      availableItems, onLeaseItems, maintenanceItems,
      totalKitTypes, flaggedTx,
    ] = await Promise.all([
      User.countDocuments({ role: 'lessee' }),
      User.countDocuments({ role: 'lessee', status: 'active' }),
      User.countDocuments({ role: 'lessee', status: 'blocked' }),
      Application.countDocuments({ status: 'pending' }),
      Lease.countDocuments({ status: 'active' }),
      LeasePayment.countDocuments({ status: 'overdue' }),
      ToolItem.countDocuments({ status: 'available' }),
      ToolItem.countDocuments({ status: 'on_lease' }),
      ToolItem.countDocuments({ status: 'under_maintenance' }),
      ToolKit.countDocuments({ isActive: true }),
      Transaction.countDocuments({ suspiciousFlag: true }),
    ]);

    // Recent applications
    const recentApps = await Application.find({ status: 'pending' })
      .populate('userId', 'name phone')
      .populate('toolKitId', 'name trade')
      .sort({ createdAt: -1 }).limit(5);

    // Recent overdue payments
    const recentOverdue = await LeasePayment.find({ status: 'overdue' })
      .populate('userId', 'name phone')
      .populate('toolKitId', 'name')
      .sort({ dueDate: 1 }).limit(5);

    // Monthly revenue (last 6 months)
    const sixMoAgo = new Date(); sixMoAgo.setMonth(sixMoAgo.getMonth() - 6);
    const monthlyRevenue = await LeasePayment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: sixMoAgo } } },
      { $group: { _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } }, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    return ok(res, {
      stats: { totalUsers, activeUsers, blockedUsers, pendingApps, activeLeases, overduePayments, availableItems, onLeaseItems, maintenanceItems, totalKitTypes, flaggedTx },
      recentApps, recentOverdue, monthlyRevenue,
    });
  } catch (e) { next(e); }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const filter = { role: 'lessee' };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { cnic: { $regex: req.query.search, $options: 'i' } },
    ];
    const users = await User.find(filter).sort({ createdAt: -1 });
    return ok(res, { users, count: users.length });
  } catch (e) { next(e); }
};

// GET /api/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return err(res, 'User not found', 404);
    const [wallet, activeLease, allApplications] = await Promise.all([
      Wallet.findOne({ userId: user._id }),
      Lease.findOne({ userId: user._id, status: 'active' })
        .populate('toolKitId', 'name trade monthlyRent')
        .populate('toolItemId', 'serialNumber condition'),
      Application.find({ userId: user._id }).populate('toolKitId', 'name').sort({ createdAt: -1 }),
    ]);
    return ok(res, { user, wallet, activeLease, applications: allApplications });
  } catch (e) { next(e); }
};

// PATCH /api/admin/users/:id/block
const blockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'blocked' }, { new: true });
    if (!user) return err(res, 'User not found', 404);
    await notify(user._id, 'Account Blocked', 'Your account has been blocked. Contact your institute administrator.', 'account');
    await AuditLog.create({ actorId: req.user._id, action: 'BLOCK_USER', targetType: 'user', targetId: user._id, details: { reason: req.body.reason } });
    return ok(res, { user }, 'User blocked');
  } catch (e) { next(e); }
};

// PATCH /api/admin/users/:id/unblock
const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    if (!user) return err(res, 'User not found', 404);
    await notify(user._id, 'Account Unblocked', 'Your account has been restored. You can now access all features.', 'account');
    await AuditLog.create({ actorId: req.user._id, action: 'UNBLOCK_USER', targetType: 'user', targetId: user._id });
    return ok(res, { user }, 'User unblocked');
  } catch (e) { next(e); }
};

// GET /api/admin/reports/revenue
const getRevenueReport = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const since = new Date(); since.setMonth(since.getMonth() - months);

    const [revenue, byTrade, systemWalletTotal] = await Promise.all([
      LeasePayment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: since } } },
        { $group: { _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } }, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      LeasePayment.aggregate([
        { $match: { status: 'paid' } },
        { $lookup: { from: 'toolkits', localField: 'toolKitId', foreignField: '_id', as: 'kit' } },
        { $unwind: '$kit' },
        { $group: { _id: '$kit.trade', total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' }, deposited: { $sum: '$totalDeposited' } } }]),
    ]);

    return ok(res, { revenue, byTrade, systemWallet: systemWalletTotal[0] || {} });
  } catch (e) { next(e); }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('actorId', 'name email').sort({ createdAt: -1 }).limit(100);
    return ok(res, { logs });
  } catch (e) { next(e); }
};

module.exports = { getDashboard, getUsers, getUserById, blockUser, unblockUser, getRevenueReport, getAuditLogs };

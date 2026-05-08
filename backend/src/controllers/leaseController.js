const Lease = require('../models/Lease');
const LeasePayment = require('../models/LeasePayment');
const ToolItem = require('../models/ToolItem');
const AuditLog = require('../models/AuditLog');
const { ok, err } = require('../utils/response');
const { notify } = require('../utils/notify');

// GET /api/leases/mine  (lessee)
const getMyLease = async (req, res, next) => {
  try {
    const lease = await Lease.findOne({ userId: req.user._id, status: 'active' })
      .populate('toolKitId', 'name trade components monthlyRent leaseDuration replacementCost')
      .populate('toolItemId', 'serialNumber condition notes');
    if (!lease) return ok(res, { lease: null });

    const payments = await LeasePayment.find({ leaseId: lease._id }).sort({ installmentNo: 1 });
    return ok(res, { lease, payments });
  } catch (e) { next(e); }
};

// GET /api/leases/mine/history  (lessee — all past leases)
const getMyLeaseHistory = async (req, res, next) => {
  try {
    const leases = await Lease.find({ userId: req.user._id })
      .populate('toolKitId', 'name trade monthlyRent')
      .populate('toolItemId', 'serialNumber condition')
      .sort({ createdAt: -1 });
    return ok(res, { leases });
  } catch (e) { next(e); }
};

// GET /api/admin/leases  (admin)
const getAllLeases = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const leases = await Lease.find(filter)
      .populate('userId', 'name email phone cnic')
      .populate('toolKitId', 'name trade monthlyRent')
      .populate('toolItemId', 'serialNumber condition status')
      .sort({ createdAt: -1 });
    return ok(res, { leases, count: leases.length });
  } catch (e) { next(e); }
};

// GET /api/admin/leases/:id
const getLeaseById = async (req, res, next) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('userId', 'name email phone cnic institute trade')
      .populate('toolKitId', 'name trade components monthlyRent replacementCost')
      .populate('toolItemId', 'serialNumber condition notes purchaseCost');
    if (!lease) return err(res, 'Lease not found', 404);
    const payments = await LeasePayment.find({ leaseId: lease._id }).sort({ installmentNo: 1 });
    return ok(res, { lease, payments });
  } catch (e) { next(e); }
};

// GET /api/admin/leases/overdue  — leases with overdue payments
const getOverdueLeases = async (req, res, next) => {
  try {
    const overduePayments = await LeasePayment.find({ status: 'overdue' })
      .populate({ path: 'leaseId', populate: [
        { path: 'userId', select: 'name email phone' },
        { path: 'toolKitId', select: 'name trade' },
        { path: 'toolItemId', select: 'serialNumber' },
      ]});
    return ok(res, { overduePayments, count: overduePayments.length });
  } catch (e) { next(e); }
};

// PATCH /api/admin/leases/:id/terminate  — admin terminates a lease early
const terminateLease = async (req, res, next) => {
  try {
    const { reason, conditionOnReturn, returnNotes } = req.body;
    const lease = await Lease.findById(req.params.id);
    if (!lease) return err(res, 'Lease not found', 404);
    if (lease.status !== 'active') return err(res, 'Lease is not active', 400);

    lease.status = 'terminated';
    lease.returnedAt = new Date();
    lease.conditionOnReturn = conditionOnReturn;
    lease.returnNotes = returnNotes;
    await lease.save();

    // Free the item
    await ToolItem.findByIdAndUpdate(lease.toolItemId, {
      status: conditionOnReturn === 'poor' ? 'under_maintenance' : 'available',
      condition: conditionOnReturn,
      currentLeaseId: null, currentLesseeId: null,
    });

    // Cancel upcoming payments
    await LeasePayment.updateMany(
      { leaseId: lease._id, status: { $in: ['upcoming', 'due'] } },
      { status: 'waived' }
    );

    await AuditLog.create({ actorId: req.user._id, action: 'TERMINATE_LEASE', targetType: 'lease', targetId: lease._id, details: { reason, conditionOnReturn } });
    await notify(lease.userId, 'Lease Terminated', `Your lease has been terminated by the administrator. Reason: ${reason}`, 'lease');
    return ok(res, { lease }, 'Lease terminated');
  } catch (e) { next(e); }
};

// PATCH /api/admin/leases/:id/complete  — mark lease as completed (item returned)
const completeLease = async (req, res, next) => {
  try {
    const { conditionOnReturn, returnNotes } = req.body;
    const lease = await Lease.findById(req.params.id);
    if (!lease) return err(res, 'Lease not found', 404);
    if (lease.status !== 'active') return err(res, 'Lease is not active', 400);

    lease.status = 'completed';
    lease.returnedAt = new Date();
    lease.conditionOnReturn = conditionOnReturn;
    lease.returnNotes = returnNotes;
    await lease.save();

    await ToolItem.findByIdAndUpdate(lease.toolItemId, {
      status: conditionOnReturn === 'poor' ? 'under_maintenance' : 'available',
      condition: conditionOnReturn,
      currentLeaseId: null, currentLesseeId: null,
    });

    await AuditLog.create({ actorId: req.user._id, action: 'COMPLETE_LEASE', targetType: 'lease', targetId: lease._id });
    await notify(lease.userId, 'Lease Completed ✅', 'Your lease has been completed. Thank you for using SkillKit!', 'lease');
    return ok(res, { lease }, 'Lease marked as completed');
  } catch (e) { next(e); }
};

module.exports = { getMyLease, getMyLeaseHistory, getAllLeases, getLeaseById, getOverdueLeases, terminateLease, completeLease };

const Application = require('../models/Application');
const ToolKit = require('../models/ToolKit');
const ToolItem = require('../models/ToolItem');
const Lease = require('../models/Lease');
const AuditLog = require('../models/AuditLog');
const { ok, err } = require('../utils/response');
const { notify } = require('../utils/notify');
const { generatePaymentSchedule } = require('../utils/schedule');

// POST /api/applications  (lessee submits)
const submitApplication = async (req, res, next) => {
  try {
    const { toolKitId, address, institute, trade, gradDate } = req.body;
    const userId = req.user._id;

    // One active lease or pending application at a time
    const existing = await Application.findOne({ userId, status: 'pending' });
    const activeLease = await Lease.findOne({ userId, status: 'active' });
    if (existing) return err(res, 'You already have a pending application', 400, 'ALREADY_PENDING');
    if (activeLease) return err(res, 'You already have an active lease. You cannot apply for another.', 400, 'ALREADY_LEASING');

    // Kit must exist and have available items
    const kit = await ToolKit.findById(toolKitId);
    if (!kit || !kit.isActive) return err(res, 'This kit type is not available', 404);
    const availableItem = await ToolItem.findOne({ toolKitId, status: 'available' });
    if (!availableItem) return err(res, 'No units of this kit are currently available', 400, 'NO_UNITS');

    // Documents (uploaded via multer)
    if (!req.files?.cnicDoc?.[0] || !req.files?.certDoc?.[0])
      return err(res, 'Both CNIC and NAVTTC certificate documents are required', 400);

    const application = await Application.create({
      userId, toolKitId, address, institute, trade,
      gradDate: new Date(gradDate),
      cnicDocPath: req.files.cnicDoc[0].filename,
      certDocPath: req.files.certDoc[0].filename,
    });

    await notify(userId, 'Application Submitted', `Your application for "${kit.name}" has been received. Reference: #${application._id.toString().slice(-6).toUpperCase()}`, 'application', '/my-application');
    return ok(res, { application }, 'Application submitted successfully', 201);
  } catch (e) { next(e); }
};

// GET /api/applications/mine  (lessee views own)
const getMyApplication = async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate('toolKitId', 'name trade monthlyRent leaseDuration components')
      .populate('assignedItemId', 'serialNumber condition')
      .sort({ createdAt: -1 });
    return ok(res, { applications });
  } catch (e) { next(e); }
};

// GET /api/admin/applications  (admin views all)
const getAllApplications = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const applications = await Application.find(filter)
      .populate('userId', 'name email phone cnic')
      .populate('toolKitId', 'name trade monthlyRent')
      .populate('assignedItemId', 'serialNumber condition')
      .sort({ createdAt: -1 });
    return ok(res, { applications, count: applications.length });
  } catch (e) { next(e); }
};

// PATCH /api/admin/applications/:id/approve
const approveApplication = async (req, res, next) => {
  try {
    const { itemId, conditionOnDispatch } = req.body; // admin picks which specific item to assign
    const application = await Application.findById(req.params.id).populate('toolKitId');
    if (!application) return err(res, 'Application not found', 404);
    if (application.status !== 'pending') return err(res, 'Application already reviewed', 400);

    // Validate the item being assigned
    const item = itemId
      ? await ToolItem.findOne({ _id: itemId, toolKitId: application.toolKitId._id, status: 'available' })
      : await ToolItem.findOne({ toolKitId: application.toolKitId._id, status: 'available' });
    if (!item) return err(res, 'No available unit of this kit type found', 400, 'NO_UNITS');

    // Create the lease
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (application.toolKitId.leaseDuration || 12));

    const lease = await Lease.create({
      userId: application.userId,
      toolKitId: application.toolKitId._id,
      toolItemId: item._id,
      applicationId: application._id,
      startDate, endDate,
      monthlyRent: application.toolKitId.monthlyRent,
      totalMonths: application.toolKitId.leaseDuration || 12,
      conditionOnDispatch: conditionOnDispatch || item.condition,
    });

    // Generate all 12 payment installments
    await generatePaymentSchedule(lease);

    // Update application
    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    application.assignedItemId = item._id;
    await application.save();

    // Lock the item to this lease
    item.status = 'on_lease';
    item.currentLeaseId = lease._id;
    item.currentLesseeId = application.userId;
    await item.save();

    await AuditLog.create({ actorId: req.user._id, action: 'APPROVE_APPLICATION', targetType: 'application', targetId: application._id, details: { leaseId: lease._id, itemSerial: item.serialNumber } });
    await notify(application.userId, 'Application Approved! 🎉', `Your lease for "${application.toolKitId.name}" (Serial: ${item.serialNumber}) has been approved. Come collect your kit.`, 'application', '/my-lease');

    return ok(res, { application, lease, item }, 'Application approved and lease created');
  } catch (e) { next(e); }
};

// PATCH /api/admin/applications/:id/reject
const rejectApplication = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return err(res, 'Rejection reason is required', 400);
    const application = await Application.findById(req.params.id).populate('toolKitId', 'name');
    if (!application) return err(res, 'Application not found', 404);
    if (application.status !== 'pending') return err(res, 'Application already reviewed', 400);

    application.status = 'rejected';
    application.rejectionReason = reason;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    await application.save();

    await AuditLog.create({ actorId: req.user._id, action: 'REJECT_APPLICATION', targetType: 'application', targetId: application._id, details: { reason } });
    await notify(application.userId, 'Application Update', `Your application for "${application.toolKitId.name}" was not approved. Reason: ${reason}`, 'application', '/my-application');

    return ok(res, { application }, 'Application rejected');
  } catch (e) { next(e); }
};

module.exports = { submitApplication, getMyApplication, getAllApplications, approveApplication, rejectApplication };

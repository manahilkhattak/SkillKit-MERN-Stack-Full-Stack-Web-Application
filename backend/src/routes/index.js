const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { authenticate, requireAdmin, requireActive } = require('../middlewares/auth');
const { validate, validateId } = require('../middlewares/error');
const { loginLimiter, walletLimiter, upload } = require('../middlewares/misc');

const auth      = require('../controllers/authController');
const inv       = require('../controllers/inventoryController');
const appCtrl   = require('../controllers/applicationController');
const lease     = require('../controllers/leaseController');
const payment   = require('../controllers/paymentController');
const admin     = require('../controllers/adminController');
const notif     = require('../controllers/notificationController');

// Health
router.get('/health', (req, res) => res.json({ success: true, message: 'SkillKit API running', timestamp: new Date() }));

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/register', [
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
], validate, auth.register);

router.post('/auth/login', loginLimiter, [
  body('email').isEmail(), body('password').notEmpty(),
], validate, auth.login);

router.get('/auth/me', authenticate, auth.getMe);
router.put('/auth/profile', authenticate, auth.updateProfile);
router.put('/auth/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Min 8 characters'),
], validate, auth.changePassword);

// ── Inventory (public — lessees browse kits) ──────────────────
router.get('/kits', authenticate, inv.getKits);
router.get('/kits/:id', authenticate, validateId(), inv.getKit);

// ── Applications ──────────────────────────────────────────────
router.post('/applications', authenticate, requireActive, upload.fields([
  { name: 'cnicDoc', maxCount: 1 }, { name: 'certDoc', maxCount: 1 },
]), appCtrl.submitApplication);

router.get('/applications/mine', authenticate, appCtrl.getMyApplication);

// ── Leases (lessee) ───────────────────────────────────────────
router.get('/leases/mine', authenticate, lease.getMyLease);
router.get('/leases/mine/history', authenticate, lease.getMyLeaseHistory);

// ── Payments (lessee) ─────────────────────────────────────────
router.get('/wallet', authenticate, payment.getWallet);
router.get('/wallet/transactions', authenticate, payment.getWalletTransactions);
router.post('/wallet/deposit', walletLimiter, authenticate, requireActive, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
], validate, payment.deposit);
router.post('/wallet/withdraw', walletLimiter, authenticate, requireActive, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
], validate, payment.withdraw);
router.post('/payments/pay/:paymentId', authenticate, requireActive, validateId('paymentId'), payment.payInstallment);
router.get('/payments/mine', authenticate, payment.getMyPayments);

// ── Notifications ─────────────────────────────────────────────
router.get('/notifications', authenticate, notif.getNotifications);
router.patch('/notifications/read-all', authenticate, notif.markAllRead);
router.patch('/notifications/:id/read', authenticate, validateId(), notif.markRead);

// ── Admin: Inventory management ───────────────────────────────
router.post('/admin/kits', authenticate, requireAdmin, [
  body('name').notEmpty(), body('trade').notEmpty(),
  body('monthlyRent').isFloat({ min: 1 }),
  body('replacementCost').isFloat({ min: 1 }),
], validate, inv.createKit);
router.put('/admin/kits/:id', authenticate, requireAdmin, validateId(), inv.updateKit);
router.patch('/admin/kits/:id/toggle', authenticate, requireAdmin, validateId(), inv.toggleKit);

router.get('/admin/items', authenticate, requireAdmin, inv.getItems);
router.post('/admin/items', authenticate, requireAdmin, [
  body('toolKitId').notEmpty(), body('quantity').optional().isInt({ min: 1, max: 50 }),
], validate, inv.addItem);
router.patch('/admin/items/:id/status', authenticate, requireAdmin, validateId(), inv.updateItemStatus);
router.patch('/admin/items/:id/condition', authenticate, requireAdmin, validateId(), inv.updateItemCondition);

// ── Admin: Applications ───────────────────────────────────────
router.get('/admin/applications', authenticate, requireAdmin, appCtrl.getAllApplications);
router.patch('/admin/applications/:id/approve', authenticate, requireAdmin, validateId(), appCtrl.approveApplication);
router.patch('/admin/applications/:id/reject', authenticate, requireAdmin, validateId(), [
  body('reason').notEmpty().withMessage('Rejection reason required'),
], validate, appCtrl.rejectApplication);

// ── Admin: Leases ─────────────────────────────────────────────
router.get('/admin/leases', authenticate, requireAdmin, lease.getAllLeases);
router.get('/admin/leases/overdue', authenticate, requireAdmin, lease.getOverdueLeases);
router.get('/admin/leases/:id', authenticate, requireAdmin, validateId(), lease.getLeaseById);
router.patch('/admin/leases/:id/terminate', authenticate, requireAdmin, validateId(), lease.terminateLease);
router.patch('/admin/leases/:id/complete', authenticate, requireAdmin, validateId(), lease.completeLease);

// ── Admin: Payments ───────────────────────────────────────────
router.get('/admin/payments', authenticate, requireAdmin, payment.getAllPayments);
router.get('/admin/transactions/flagged', authenticate, requireAdmin, payment.getFlaggedTransactions);

// ── Admin: Users ──────────────────────────────────────────────
router.get('/admin/users', authenticate, requireAdmin, admin.getUsers);
router.get('/admin/users/:id', authenticate, requireAdmin, validateId(), admin.getUserById);
router.patch('/admin/users/:id/block', authenticate, requireAdmin, validateId(), admin.blockUser);
router.patch('/admin/users/:id/unblock', authenticate, requireAdmin, validateId(), admin.unblockUser);

// ── Admin: Dashboard & Reports ────────────────────────────────
router.get('/admin/dashboard', authenticate, requireAdmin, admin.getDashboard);
router.get('/admin/reports/revenue', authenticate, requireAdmin, admin.getRevenueReport);
router.get('/admin/audit-logs', authenticate, requireAdmin, admin.getAuditLogs);

module.exports = router;

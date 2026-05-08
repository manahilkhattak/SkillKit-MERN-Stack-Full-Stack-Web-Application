const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const LeasePayment = require('../models/LeasePayment');
const Lease = require('../models/Lease');
const { ok, err } = require('../utils/response');
const { generateTxId } = require('../utils/ids');
const { checkSuspicious } = require('../utils/suspicious');
const { notify } = require('../utils/notify');

// ── Wallet operations ────────────────────────────────────────

// GET /api/wallet
const getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return err(res, 'Wallet not found', 404);
    return ok(res, { wallet });
  } catch (e) { next(e); }
};

// POST /api/wallet/deposit
const deposit = async (req, res, next) => {
  try {
    const { amount, description } = req.body;
    if (req.user.status === 'blocked') return err(res, 'Account is blocked', 403, 'BLOCKED');

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.status === 'frozen') return err(res, 'Wallet unavailable', 400);

    const { isSuspicious, reasons } = await checkSuspicious(req.user._id, amount);
    const txId = generateTxId();

    const tx = await Transaction.create({
      transactionId: txId,
      userId: req.user._id,
      type: 'deposit',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: isSuspicious ? wallet.balance : wallet.balance + amount,
      status: isSuspicious ? 'flagged' : 'successful',
      description: description || 'Wallet deposit',
      suspiciousFlag: isSuspicious,
      suspiciousReasons: reasons,
    });

    if (!isSuspicious) {
      wallet.balance += amount;
      wallet.totalDeposited += amount;
      await wallet.save();
    }

    const msg = isSuspicious
      ? `Your deposit of PKR ${amount.toLocaleString()} has been flagged for review.`
      : `PKR ${amount.toLocaleString()} deposited. New balance: PKR ${wallet.balance.toLocaleString()}`;
    await notify(req.user._id, isSuspicious ? '⚠️ Deposit Flagged' : 'Deposit Successful', msg, 'wallet');

    return ok(res, { transaction: tx, balance: wallet.balance }, 'Deposit processed', 201);
  } catch (e) { next(e); }
};

// POST /api/wallet/withdraw
const withdraw = async (req, res, next) => {
  try {
    const { amount, description } = req.body;
    if (req.user.status === 'blocked') return err(res, 'Account is blocked', 403, 'BLOCKED');

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.status === 'frozen') return err(res, 'Wallet unavailable', 400);
    if (wallet.balance < amount) {
      await Transaction.create({
        transactionId: generateTxId(), userId: req.user._id, type: 'withdrawal',
        amount, balanceBefore: wallet.balance, balanceAfter: wallet.balance,
        status: 'failed', description: 'Insufficient balance',
      });
      return err(res, 'Insufficient wallet balance', 400, 'INSUFFICIENT_BALANCE');
    }

    const txId = generateTxId();
    wallet.balance -= amount;
    wallet.totalSpent += amount;
    await wallet.save();

    const tx = await Transaction.create({
      transactionId: txId, userId: req.user._id, type: 'withdrawal',
      amount, balanceBefore: wallet.balance + amount, balanceAfter: wallet.balance,
      status: 'successful', description: description || 'Wallet withdrawal',
    });

    await notify(req.user._id, 'Withdrawal Successful', `PKR ${amount.toLocaleString()} withdrawn. Balance: PKR ${wallet.balance.toLocaleString()}`, 'wallet');
    return ok(res, { transaction: tx, balance: wallet.balance }, 'Withdrawal processed', 201);
  } catch (e) { next(e); }
};

// ── Lease payment ────────────────────────────────────────────

// POST /api/payments/pay/:paymentId  (pay a lease installment from wallet)
const payInstallment = async (req, res, next) => {
  try {
    const payment = await LeasePayment.findById(req.params.paymentId)
      .populate('leaseId').populate('toolKitId', 'name');
    if (!payment) return err(res, 'Payment record not found', 404);
    if (!payment.userId.equals(req.user._id)) return err(res, 'Not your payment', 403);
    if (payment.status === 'paid') return err(res, 'This installment is already paid', 400);
    if (payment.leaseId.status !== 'active') return err(res, 'Lease is not active', 400);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < payment.amount)
      return err(res, `Insufficient balance. Need PKR ${payment.amount.toLocaleString()}, have PKR ${wallet.balance.toLocaleString()}`, 400, 'INSUFFICIENT_BALANCE');

    const txId = generateTxId();
    const balBefore = wallet.balance;

    wallet.balance -= payment.amount;
    wallet.totalSpent += payment.amount;
    await wallet.save();

    const tx = await Transaction.create({
      transactionId: txId, userId: req.user._id,
      type: 'lease_payment', amount: payment.amount,
      balanceBefore: balBefore, balanceAfter: wallet.balance,
      status: 'successful',
      description: `Lease payment — ${payment.toolKitId?.name} Installment #${payment.installmentNo}`,
      relatedLeaseId: payment.leaseId._id,
      relatedPaymentId: payment._id,
    });

    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.paidAmount = payment.amount;
    payment.paymentMethod = 'wallet';
    payment.transactionRef = txId;
    payment.walletTxId = tx._id;
    await payment.save();

    // Check if all payments done → auto-complete lease
    const remaining = await LeasePayment.countDocuments({ leaseId: payment.leaseId._id, status: { $in: ['upcoming', 'due', 'overdue'] } });
    if (remaining === 0) {
      await Lease.findByIdAndUpdate(payment.leaseId._id, { status: 'completed', returnedAt: new Date() });
      await notify(req.user._id, '🎉 Lease Complete!', 'All installments paid. Your lease is complete. Please return the tool kit to your institute.', 'lease');
    } else {
      await notify(req.user._id, 'Payment Successful ✅', `Installment #${payment.installmentNo} of PKR ${payment.amount.toLocaleString()} paid. ${remaining} remaining.`, 'payment');
    }

    return ok(res, { payment, transaction: tx, walletBalance: wallet.balance }, 'Installment paid successfully');
  } catch (e) { next(e); }
};

// GET /api/payments/mine  (lessee views all their payment records)
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await LeasePayment.find({ userId: req.user._id })
      .populate('toolKitId', 'name trade')
      .populate('leaseId', 'startDate endDate status')
      .sort({ dueDate: 1 });
    return ok(res, { payments });
  } catch (e) { next(e); }
};

// GET /api/admin/payments  (admin)
const getAllPayments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const payments = await LeasePayment.find(filter)
      .populate('userId', 'name email phone')
      .populate('toolKitId', 'name trade')
      .populate('leaseId', 'startDate endDate')
      .sort({ dueDate: -1 })
      .limit(200);
    return ok(res, { payments, count: payments.length });
  } catch (e) { next(e); }
};

// GET /api/wallet/transactions  (lessee wallet history)
const getWalletTransactions = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(100);
    return ok(res, { transactions });
  } catch (e) { next(e); }
};

// GET /api/admin/transactions/flagged
const getFlaggedTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ suspiciousFlag: true })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    return ok(res, { transactions, count: transactions.length });
  } catch (e) { next(e); }
};

module.exports = { getWallet, deposit, withdraw, payInstallment, getMyPayments, getAllPayments, getWalletTransactions, getFlaggedTransactions };

const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * 5 suspicious rules for SkillKit wallet operations
 */
const checkSuspicious = async (userId, amount) => {
  const reasons = [];
  const now = new Date();

  // Rule 1: Single deposit above PKR 200,000
  if (amount > 200000) {
    reasons.push(`Unusually large deposit: PKR ${amount.toLocaleString()} exceeds PKR 200,000 threshold`);
  }

  // Rule 2: More than 5 wallet operations in last 10 minutes
  const tenMinsAgo = new Date(now - 10 * 60 * 1000);
  const recentOps = await Transaction.countDocuments({
    userId, createdAt: { $gte: tenMinsAgo }, status: { $ne: 'failed' },
  });
  if (recentOps >= 5) {
    reasons.push(`Rapid wallet activity: ${recentOps + 1} operations within 10 minutes`);
  }

  // Rule 3: More than 3 failed transactions today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const failedToday = await Transaction.countDocuments({
    userId, status: 'failed', createdAt: { $gte: todayStart },
  });
  if (failedToday >= 3) {
    reasons.push(`Multiple failed attempts: ${failedToday} failed transactions today`);
  }

  // Rule 4: Same amount deposited 3+ times in last 24 hours
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const sameAmountCount = await Transaction.countDocuments({
    userId, amount, type: 'deposit',
    createdAt: { $gte: oneDayAgo }, status: { $ne: 'failed' },
  });
  if (sameAmountCount >= 2) {
    reasons.push(`Repeated deposit amount: PKR ${amount} deposited ${sameAmountCount + 1} times in 24 hours`);
  }

  // Rule 5: New user (< 7 days old) depositing more than PKR 50,000
  const user = await User.findById(userId).select('createdAt');
  if (user) {
    const daysSince = (now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSince < 7 && amount > 50000) {
      reasons.push(`New account high-value deposit: PKR ${amount.toLocaleString()} by account only ${Math.floor(daysSince)} day(s) old`);
    }
  }

  return { isSuspicious: reasons.length > 0, reasons };
};

module.exports = { checkSuspicious };

/**
 * Generates 12 LeasePayment documents when a lease is created.
 */
const LeasePayment = require('../models/LeasePayment');

const generatePaymentSchedule = async (lease) => {
  const payments = [];
  const start = new Date(lease.startDate);

  for (let i = 0; i < lease.totalMonths; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + i);

    const now = new Date();
    let status = 'upcoming';
    if (dueDate < now) status = 'overdue';
    else if (
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getFullYear() === now.getFullYear()
    ) status = 'due';

    payments.push({
      leaseId:       lease._id,
      userId:        lease.userId,
      toolKitId:     lease.toolKitId,
      installmentNo: i + 1,
      dueDate,
      amount:        lease.monthlyRent,
      status,
    });
  }

  await LeasePayment.insertMany(payments);
  return payments;
};

module.exports = { generatePaymentSchedule };

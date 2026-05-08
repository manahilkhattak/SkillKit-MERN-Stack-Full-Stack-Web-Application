const Notification = require('../models/Notification');
const { ok } = require('../utils/response');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unread = notifications.filter(n => !n.read).length;
    return ok(res, { notifications, unread });
  } catch (e) { next(e); }
};

const markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true });
    return ok(res, {}, 'Marked as read');
  } catch (e) { next(e); }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { read: true });
    return ok(res, {}, 'All marked as read');
  } catch (e) { next(e); }
};

module.exports = { getNotifications, markRead, markAllRead };

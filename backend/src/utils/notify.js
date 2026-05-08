const Notification = require('../models/Notification');

const notify = async (userId, title, message, type = 'system', link = null) => {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch (e) {
    console.error('Notification failed:', e.message);
  }
};

module.exports = { notify };

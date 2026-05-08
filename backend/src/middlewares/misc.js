const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Rate limiters ─────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 10, skipSuccessfulRequests: true,
  message: { success: false, code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again in 10 minutes.' },
});

const walletLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many wallet requests.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests.' },
});

// ── File upload (multer) ──────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const userId = req.user?._id || 'anon';
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}_${file.fieldname}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only JPEG, PNG, PDF allowed'), false);
};

const upload = multer({
  storage, fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

module.exports = { loginLimiter, walletLimiter, apiLimiter, upload };

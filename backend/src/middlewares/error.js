const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const errorHandler = (error, req, res, next) => {
  console.error(`[${req.method}] ${req.path}:`, error.message);
  const status = error.status || 500;
  res.status(status).json({
    success: false,
    code: error.code || 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error' : error.message,
  });
};

const notFound = (req, res) =>
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` });

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false, code: 'VALIDATION_ERROR', message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateId = (param = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[param]))
    return res.status(400).json({ success: false, code: 'INVALID_ID', message: `Invalid ID parameter: ${param}` });
  next();
};

module.exports = { errorHandler, notFound, validate, validateId };

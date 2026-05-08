const ok  = (res, data = {}, message = 'Success', code = 200) =>
  res.status(code).json({ success: true, message, ...data });

const err = (res, message = 'Error', code = 400, errorCode = 'ERROR') =>
  res.status(code).json({ success: false, code: errorCode, message });

module.exports = { ok, err };

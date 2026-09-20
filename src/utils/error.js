exports.success = (res, code, message, data = null, status = 200) => {
  return res.status(status).json({
    success: true,
    code,
    message,
    data,
  });
};

exports.failure = (res, code, message, error = null, status = 400) => {
  return res.status(status).json({
    success: false,
    code,
    message,
    error,
  });
};
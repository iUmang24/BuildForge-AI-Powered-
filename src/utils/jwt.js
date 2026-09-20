const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

exports.generateAccessToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES,
  });

  const decoded = jwt.decode(token);

  logger.info("[JWT][ACCESS] issued_at:", new Date(decoded.iat * 1000));
  logger.info("[JWT][ACCESS] expires_at:", new Date(decoded.exp * 1000));
  logger.info("[JWT][ACCESS] ttl_seconds:", decoded.exp - decoded.iat);

  return token;
};

exports.generateRefreshToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });

  const decoded = jwt.decode(token);

  logger.info("[JWT][REFRESH] issued_at:", new Date(decoded.iat * 1000));
  logger.info("[JWT][REFRESH] expires_at:", new Date(decoded.exp * 1000));
  logger.info("[JWT][REFRESH] ttl_seconds:", decoded.exp - decoded.iat);

  return token;
};

exports.verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};


/* ================= ADMIN TOKENS ================= */

exports.generateAdminAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ADMIN_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_ADMIN,
  });

exports.generateAdminRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ADMIN_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_ADMIN,
  });

exports.verifyAdminRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_ADMIN_REFRESH_SECRET);
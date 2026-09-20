const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { failure } = require("../utils/error");

module.exports = (req, res, next) => {
  logger.auth("Auth check:", req.method, req.originalUrl);

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn("Missing Authorization header");
    return failure(res, "AUTH01", "Access token missing", null, 401);
  }

  if (!authHeader.startsWith("Bearer ")) {
    logger.warn("Invalid Authorization format");
    return failure(res, "AUTH01", "Invalid token format", null, 401);
  }

  const token = authHeader.split(" ")[1];
  logger.debug("Token (partial):", token.slice(0, 15));

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    logger.auth("Authenticated student_id:", decoded.student_id);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error("Token verification failed:", err.message);
    return failure(res, "AUTH02", "Access token expired", null, 401);
  }
};

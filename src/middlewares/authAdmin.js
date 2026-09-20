const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { failure } = require("../utils/error");

module.exports = (req, res, next) => {
  logger.auth("Admin auth check:", req.method, req.originalUrl);

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn("Missing Authorization header (admin)");
    return failure(res, "AUTH01", "Access token missing", null, 401);
  }

  if (!authHeader.startsWith("Bearer ")) {
    logger.warn("Invalid Authorization format (admin)");
    return failure(res, "AUTH01", "Invalid token format", null, 401);
  }

  const token = authHeader.split(" ")[1];
  logger.debug("Admin token (partial):", token.slice(0, 15));

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ADMIN_ACCESS_SECRET
    );

    logger.auth("Authenticated admin_id:", decoded.admin_id);

    // 🔥 CRITICAL SECURITY CHECK
    if (!decoded.admin_id || !decoded.role) {
      return failure(res, "AUTH03", "Invalid admin token", null, 403);
    }

    // Optional: strict role enforcement
    if (decoded.role !== "super_admin" && decoded.role !== "admin") {
      return failure(res, "AUTH04", "Forbidden", null, 403);
    }

    req.admin = decoded; // 👈 IMPORTANT
    next();
  } catch (err) {
    logger.error("Admin token verification failed:", err.message);
    return failure(res, "AUTH02", "Access token expired", null, 401);
  }
};

const pool = require("../config/db");

let cachedValue = null;
let lastCheck = 0;

module.exports = async (req, res, next) => {
  try {
    // Always allow health
    if (req.path === "/health") return next();

    // 🔥 Always allow admin routes
    if (req.path.startsWith("/admin")) return next();

    const now = Date.now();

    if (!cachedValue || now - lastCheck > 30000) {
      const [[setting]] = await pool.query(
        `SELECT setting_value 
         FROM app_settings 
         WHERE setting_key='maintenance_mode'`
      );

      cachedValue = setting?.setting_value || "off";
      lastCheck = now;
    }

    if (cachedValue !== "on") {
      return next();
    }

    return res.status(503).json({
      success: false,
      code: "MAINTENANCE",
      message: "Platform under maintenance. Please try later."
    });

  } catch (err) {
    console.error("Maintenance middleware error:", err);
    next();
  }
};

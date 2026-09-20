const isProd = process.env.APP_ENV === "production";

exports.refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,              // ✅ HTTPS only in prod
  sameSite: isProd ? "none" : "lax", // ✅ cross-site prod, easy local dev
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

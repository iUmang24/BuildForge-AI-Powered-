const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { success, failure } = require("../utils/error");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwt");
const { verifyRefreshToken, generateAccessToken } = require("../utils/jwt");
const { refreshCookieOptions } = require("../utils/cookies");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return failure(res, "A01", "Email and password required", null, 400);
    }

    const [rows] = await pool.query(
      "SELECT id, password_hash FROM students WHERE email = ? AND is_active = 1",
      [email]
    );

    if (rows.length === 0) {
      return failure(res, "A02", "Invalid credentials", null, 401);
    }

    const student = rows[0];
    const match = await bcrypt.compare(password, student.password_hash);

    if (!match) {
      return failure(res, "A02", "Invalid credentials", null, 401);
    }

    const payload = { student_id: student.id };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 🔐 Store refresh token in HttpOnly cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true, // set false in local dev if needed
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, "A00", "Login successful", {
      accessToken,
      expiresIn: 300, // seconds
    });
  } catch (err) {
    return failure(res, "A99", "Login failed", err.message, 500);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;

    if (!token) {
      return failure(res, "AUTH03", "Refresh token missing", null, 401);
    }

    const decoded = verifyRefreshToken(token);

    const newAccessToken = generateAccessToken({
      student_id: decoded.student_id,
    });

    return success(res, "A04", "Token refreshed", {
      accessToken: newAccessToken,
      expiresIn: 300,
    });
  } catch (err) {
    return failure(res, "AUTH04", "Refresh token expired", null, 401);
  }
};

exports.logout = (req, res) => {
  res.clearCookie("refresh_token", refreshCookieOptions);
  return success(res, "A05", "Logged out successfully");
};

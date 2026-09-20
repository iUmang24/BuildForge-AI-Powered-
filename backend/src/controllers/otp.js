const { createOtp, verifyOtp } = require("../services/otpService");
const { sendEmailTemplate } = require("../services/emailService");
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { success, failure } = require("../utils/error");
const logger = require("../utils/logger");


// ================= SEND OTP =================

exports.sendOtp = async (req, res) => {
  try {

    const { email, type } = req.body;

    if (!email || !type)
      return failure(res, "O01", "Email & type required", null, 400);

    const otp = await createOtp(email, type);

    let templateKey = "";

    if (type === "verify") templateKey = "otp_verify";
    if (type === "reset") templateKey = "otp_reset";
    if (type === "login") templateKey = "otp_login";

    const emailResult = await sendEmailTemplate({
      to: email,
      templateKey,
      variables: {
        otp,
        expiry: 5
      }
    });

    // ❗ DO NOT BREAK FLOW
    if (!emailResult.success) {
      logger.error("Email failed but OTP created");
      return failure(res, "O98", "OTP generated but email failed", null, 500);
    }

    logger.info("OTP sent successfully");
    return success(res, "O00", "OTP sent");

  } catch (err) {
    logger.error("Error sending OTP:", err.message);
    return failure(res, "O99", err.message, null, 400);
  }
};


// ================= VERIFY EMAIL OTP =================

exports.verifyEmailOtp = async (req, res) => {

  try {

    const { email, otp } = req.body;

    const result = await verifyOtp(email, otp, "verify");

    if (!result.valid) {
      logger.error("Error verifying email:", result.message);
      return failure(res, "O02", result.message, null, 400);
    }

    // await pool.query(
    //   `UPDATE students SET email_verified=1 WHERE email=?`,
    //   [email]
    // );
    logger.info("Email verified successfully");
    return success(res, "O03", "Email verified");

  } catch (err) {
    logger.error("Server error:", err.message);
    return failure(res, "O99", "Server error", err.message, 500);
  }
};

// ================= VERIFY-RESET EMAIL OTP =================

exports.verifyResetOtp = async (req, res) => {

  const { email, otp } = req.body;

  const result = await verifyOtp(email, otp, "reset");

  if (!result.valid) {
    logger.error("Reset OTP error:", result.message);
    return failure(res, "O10", result.message, null, 400);
  }

  logger.info("OTP verified");
  return success(res, "O11", "OTP verified");
};

// ================= LOGIN OTP =================

exports.loginWithOtp = async (req, res) => {

  try {

    const { email, otp } = req.body;

    const result = await verifyOtp(email, otp, "login");

    if (!result.valid) {
      logger.error("error:", result.message);
      return failure(res, "O10", result.message, null, 400);
    }

    const [[student]] = await pool.query(
      `SELECT id FROM students WHERE email=? AND is_active=1`,
      [email]
    );

    if (!student) {
      logger.error("User not found:", result.message);
      return failure(res, "O11", "User not found", null, 404);
    }

    const payload = { student_id: student.id };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("refresh_token", refreshToken, refreshCookieOptions);

    logger.info("Login Success");
    return success(res, "O12", "Login success", {
      accessToken,
      expiresIn: 300
    });

  } catch (err) {
    logger.error("Server error:", err.message);
    return failure(res, "O99", "Server error", err.message, 500);
  }
};


// ================= RESET PASSWORD =================

exports.resetPassword = async (req, res) => {

  try {

    const { email, otp, password } = req.body;

    // const result = await verifyOtp(email, otp, "reset");

    // if (!result.valid)
    //   return failure(res, "O04", result.message, null, 400);

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE students SET password_hash=? WHERE email=?`,
      [hash, email]
    );

    logger.info("password updated");
    return success(res, "O05", "Password updated");

  } catch (err) {
    logger.error("Server error:", err.message);
    return failure(res, "O99", "Server error", err.message, 500);
  }
};

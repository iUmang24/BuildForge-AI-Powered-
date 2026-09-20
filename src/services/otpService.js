const bcrypt = require("bcrypt");
const pool = require("../config/db");

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = 60;

// ================= GENERATE OTP =================

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// ================= CREATE OTP =================

exports.createOtp = async (email, type) => {

  // 🔥 Prevent spam resend
  const [[existing]] = await pool.query(
    `
    SELECT created_at
    FROM email_otps
    WHERE email=? AND type=? AND is_used=0
    ORDER BY id DESC
    LIMIT 1
    `,
    [email, type]
  );

  if (existing) {

    const diffSeconds =
      (Date.now() - new Date(existing.created_at)) / 1000;

    if (diffSeconds < RESEND_COOLDOWN_SECONDS) {
      throw new Error("Please wait before requesting new OTP");
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  // 🔥 mark previous OTP used
  await pool.query(
    `UPDATE email_otps SET is_used=1 WHERE email=? AND type=?`,
    [email, type]
  );

  await pool.query(
    `
    INSERT INTO email_otps (email, otp_hash, type, expires_at)
    VALUES (?, ?, ?, ?)
    `,
    [email, otpHash, type, expiresAt]
  );

  return otp;
};


// ================= VERIFY OTP =================

exports.verifyOtp = async (email, otp, type) => {

  const [[record]] = await pool.query(
    `
    SELECT *
    FROM email_otps
    WHERE email=? AND type=? AND is_used=0
    ORDER BY id DESC
    LIMIT 1
    `,
    [email, type]
  );

  if (!record)
    return { valid:false, message:"OTP not found" };

  if (record.attempts >= MAX_ATTEMPTS)
    return { valid:false, message:"Too many attempts" };

  if (new Date() > new Date(record.expires_at))
    return { valid:false, message:"OTP expired" };

  const match = await bcrypt.compare(otp, record.otp_hash);

  if (!match) {

    await pool.query(
      `UPDATE email_otps SET attempts = attempts + 1 WHERE id=?`,
      [record.id]
    );

    return { valid:false, message:"Invalid OTP" };
  }

  await pool.query(
    `UPDATE email_otps SET is_used=1 WHERE id=?`,
    [record.id]
  );

  return { valid:true };
};


// ================= CLEANUP =================

exports.cleanupOtps = async () => {
  await pool.query(
    `DELETE FROM email_otps WHERE expires_at < NOW()`
  );
};

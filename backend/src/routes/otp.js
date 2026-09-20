const router = require("express").Router();
const otpController = require("../controllers/otp");

router.post("/send", otpController.sendOtp);
router.post("/verify-email", otpController.verifyEmailOtp);
router.post("/verify-reset", otpController.verifyResetOtp);
router.post("/login", otpController.loginWithOtp);
router.post("/reset-password", otpController.resetPassword);

module.exports = router;

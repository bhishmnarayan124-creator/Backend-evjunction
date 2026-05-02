const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  checkAdminExists,
  forgotPasswordSendOTP,
  forgotPasswordVerifyOTP,
  forgotPasswordReset,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.get("/admin-exists", checkAdminExists);
router.post("/forgot-password/send-otp", forgotPasswordSendOTP);
router.post("/forgot-password/verify-otp", forgotPasswordVerifyOTP);
router.post("/forgot-password/reset", forgotPasswordReset);

module.exports = router;
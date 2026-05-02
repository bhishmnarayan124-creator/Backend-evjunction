const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  checkAdminExists,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.get("/admin-exists", checkAdminExists);

module.exports = router;
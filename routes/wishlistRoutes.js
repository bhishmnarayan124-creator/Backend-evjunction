const express = require("express");

const {
  getWishlist,
  toggleCarWishlist,
  toggleHotelWishlist,
} = require("../controllers/wishlistController");

// ✅ IMPORTANT FIX (destructuring required)
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getWishlist);

router.post("/car/:id", protect, toggleCarWishlist);

router.post("/hotel/:id", protect, toggleHotelWishlist);

module.exports = router;
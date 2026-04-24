const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload")

const {
  getCars,
  getMyListings,
  getBrands,
  getCities,
  calculateBattery,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  inquiry,
  incrementViewCount
} = require("../controllers/carController");

const { protect } = require("../middleware/authMiddleware");

// ================= PUBLIC ROUTES =================

// ✔ GET ALL CARS (filters)
router.get("/", getCars);

// ✔ GET BRANDS
router.get("/brands", getBrands);
router.get("/cities", getCities);

// ✔ MY LISTINGS (⚠️ BEFORE :id)
router.get("/my-listings", protect, getMyListings);

// ✔ BATTERY HEALTH
router.post("/calculate-battery-health", calculateBattery);

router.patch("/:id/view", protect, incrementViewCount);

router.get("/:id", getCar);
// ================= PROTECTED ROUTES =================

// ✔ CREATE CAR
router.post("/", protect, upload.array("images", 5), createCar);

// ✔ UPDATE CAR
router.put("/:id", protect, updateCar);

// ✔ DELETE CAR
router.delete("/:id", protect, deleteCar);

// ✔ INQUIRY
router.post("/:id/inquiry", protect, inquiry);

module.exports = router;
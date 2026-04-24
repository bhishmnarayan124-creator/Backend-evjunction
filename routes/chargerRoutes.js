const express = require("express");
const router = express.Router();

const Charger = require("../models/Charger");

const {
  getChargers,
  getNearby,
  fetchExternal,
  getCharger,
  createCharger,
  updateCharger,
  deleteCharger,
  addReview,
  getReviews,
  getChargerTypes,
  getAmenities,
} = require("../controllers/chargerController");

const {
  protect,
  requireRole,
  ownerOrAdmin,
} = require("../middleware/authMiddleware");

/* =========================================================
   PUBLIC ROUTES
========================================================= */

// Get all chargers
router.get("/", getChargers);

// Nearby chargers (geo search)
router.get("/nearby", getNearby);

// Dynamic dropdown APIs
router.get("/types", getChargerTypes);
router.get("/amenities", getAmenities);

// Charger reviews (must come BEFORE /:id)
router.get("/:id/reviews", getReviews);

// Single charger details
router.get("/:id", getCharger);


/* =========================================================
   PROTECTED ROUTES (LOGIN REQUIRED)
========================================================= */

// Create charger (vendor / admin / logged user)
router.post("/", protect, createCharger);

// Update charger (only owner OR admin)
router.put(
  "/:id",
  protect,
  ownerOrAdmin(Charger),
  updateCharger
);

// Add review
router.post("/:id/reviews", protect, addReview);


/* =========================================================
   ADMIN ONLY ROUTES
========================================================= */

// Import chargers from OpenChargeMap API
router.get(
  "/external",
  protect,
  requireRole("admin"),
  fetchExternal
);

// Soft delete charger
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  deleteCharger
);

module.exports = router;
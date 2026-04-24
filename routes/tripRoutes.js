const express = require("express");
const router  = express.Router();
const { calculateTrip } = require("../controllers/tripController");

// POST /api/trip/calculate
router.post("/calculate", calculateTrip);

module.exports = router;
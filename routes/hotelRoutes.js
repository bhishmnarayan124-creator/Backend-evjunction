const express = require("express");
const router = express.Router();

const Hotel = require("../models/hotelModel");


/*
GET ALL APPROVED HOTELS
*/
router.get("/", async (req, res) => {
  try {

    const hotels = await Hotel.find({
      status: "approved"
    }).sort({ createdAt: -1 });

    res.json({ hotels });

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch hotels"
    });

  }
});


/*
GET SINGLE HOTEL DETAILS
*/
router.get("/:id", async (req, res) => {
  try {

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found"
      });
    }

    res.json({ hotel });

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch hotel"
    });

  }
});


/*
INCREMENT VIEW COUNT
*/
router.patch("/:id/view", async (req, res) => {
  try {

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $inc: { view_count: 1 } },
      { returnDocument: "after" }
    );

    res.json({ hotel });

  } catch (error) {

    res.status(500).json({
      message: "Failed to update view count"
    });

  }
});

module.exports = router;
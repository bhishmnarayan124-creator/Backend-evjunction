const Hotel = require("../models/hotelModel");
const { updateMonthlyStats } = require("../utils/updateMonthlyStats");
const { createNotification } = require("../utils/createNotification");


/* =========================================================
   CREATE HOTEL (vendor + admin only)
========================================================= */

exports.createHotel = async (req, res) => {
  try {

    /* ===============================
       ROLE CHECK
    =============================== */

    if (
      req.user.role !== "vendor" &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Only vendors or admins can add hotels"
      });
    }


    /* ===============================
       ARRAY FIELD PARSER
    =============================== */

    const parseArrayField = (field) => {
      if (!field) return [];

      try {
        return Array.isArray(field)
          ? field
          : JSON.parse(field);
      } catch {
        return [];
      }
    };


    const amenities = parseArrayField(req.body.amenities);
    const connector_types = parseArrayField(req.body.connector_types);
    const rooms = parseArrayField(req.body.rooms);
    const payment_methods = parseArrayField(req.body.payment_methods);
    const id_proof_accepted = parseArrayField(req.body.id_proof_accepted);
    const safety_features = parseArrayField(req.body.safety_features);


    /* ===============================
       ROOM IMAGES
    =============================== */

    let roomImages = {};

    Object.keys(req.files || {}).forEach((key) => {

      if (key.startsWith("room_image_")) {

        const roomType =
          key.replace("room_image_", "");

        roomImages[roomType] =
          req.files[key].map(
            file => `/uploads/${file.filename}`
          );

      }

    });


    /* ===============================
       MAIN IMAGES
    =============================== */

    const imagePaths =
      req.files?.images?.map(
        file => `/uploads/${file.filename}`
      ) || [];


    /* ===============================
       STATUS LOGIC
    =============================== */

    let status = "pending";

    // Admin adds → auto approve
    if (req.user.role === "admin") {
      status = "approved";
    }


    /* ===============================
       CREATE HOTEL
    =============================== */

    const hotel = await Hotel.create({

      ...req.body,

      owner: req.user._id,

      amenities,
      connector_types,
      rooms,

      images: imagePaths,
      room_images: roomImages,

      payment_methods,
      id_proof_accepted,
      safety_features,

      chargers_available:
        Number(req.body.chargers_available) || 0,

      charging_power_kw:
        Number(req.body.charging_power_kw) || 0,

      price_per_night:
        Number(req.body.price_per_night) || 0,

      price_weekend:
        Number(req.body.price_weekend) || 0,

      price_suite:
        Number(req.body.price_suite) || 0,

      tax_percentage:
        Number(req.body.tax_percentage) || 0,

      total_rooms:
        Number(req.body.total_rooms) || 0,

      rating:
        Number(req.body.rating) || 4.5,

      age_restriction:
        Number(
          req.body.min_age ||
          req.body.age_restriction
        ) || 18,

      primary_image_index:
        Number(req.body.primary_image_index) || 0,

      status
    });


    /* ===============================
       ADMIN NOTIFICATION
    =============================== */

    if (req.user.role === "vendor") {

      await createNotification({
        type: "hotel_pending",
        title: "New hotel pending approval",
        message: `${req.user.name} submitted a hotel`,
        user: req.user._id,
        forAdmin: true
      });

    }


    /* ===============================
       MONTHLY STATS UPDATE
    =============================== */

    if (req.user.role === "admin") {
      await updateMonthlyStats("hotels_added", 1);
    }


    res.status(201).json({
      message:
        status === "pending"
          ? "Hotel submitted for admin approval"
          : "Hotel created successfully",
      hotel
    });

  } catch (error) {

    console.error("CREATE HOTEL ERROR:", error.message);

    res.status(500).json({
      message: "Hotel creation failed"
    });

  }
};



/* =========================================================
   GET PENDING HOTELS (ADMIN PANEL)
========================================================= */

exports.getPendingHotels = async (req, res) => {

  try {

    const hotels =
      await Hotel.find({
        status: "pending"
      }).sort({ createdAt: -1 });

    res.json({ hotels });

  } catch {

    res.status(500).json({
      message: "Failed to fetch pending hotels"
    });

  }

};



/* =========================================================
   GET ALL HOTELS
========================================================= */

exports.getAllHotels = async (req, res) => {

  try {

    const hotels =
      await Hotel.find()
      .sort({ createdAt: -1 });

    res.json({ hotels });

  } catch {

    res.status(500).json({
      message: "Failed to fetch hotels"
    });

  }

};



/* =========================================================
   APPROVE HOTEL (ADMIN ONLY)
========================================================= */

exports.approveHotel = async (req, res) => {

  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can approve hotels"
      });
    }

    const hotel =
      await Hotel.findByIdAndUpdate(

        req.params.id,

        { status: "approved" },

        { new: true }

      );

    if (!hotel) {

      return res.status(404).json({
        message: "Hotel not found"
      });

    }

    await updateMonthlyStats(
      "hotels_approved",
      1
    );

    res.json({
      message:
        "Hotel approved successfully",
      hotel
    });

  } catch (error) {

    console.error(
      "APPROVE HOTEL ERROR:",
      error.message
    );

    res.status(500).json({
      message:
        "Hotel approval failed"
    });

  }

};



/* =========================================================
   REJECT HOTEL (ADMIN ONLY)
========================================================= */

exports.rejectHotel = async (req, res) => {

  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admin can reject hotels"
      });
    }

    const hotel =
      await Hotel.findByIdAndUpdate(

        req.params.id,

        { status: "rejected" },

        { new: true }

      );

    if (!hotel) {

      return res.status(404).json({
        message: "Hotel not found"
      });

    }

    res.json({
      message:
        "Hotel rejected successfully",
      hotel
    });

  } catch (error) {

    console.error(
      "REJECT HOTEL ERROR:",
      error.message
    );

    res.status(500).json({
      message:
        "Hotel rejection failed"
    });

  }

};



/* =========================================================
   DELETE HOTEL
========================================================= */

exports.deleteHotel = async (req, res) => {

  try {

    const hotel =
      await Hotel.findByIdAndDelete(
        req.params.id
      );

    if (!hotel) {

      return res.status(404).json({
        message: "Hotel not found"
      });

    }

    res.json({
      message:
        "Hotel deleted successfully"
    });

  } catch {

    res.status(500).json({
      message: "Delete failed"
    });

  }

};



/* =========================================================
   INCREMENT HOTEL VIEW
========================================================= */

exports.incrementHotelView =
  async (req, res) => {

  try {

    const hotel =
      await Hotel.findByIdAndUpdate(

        req.params.id,

        { $inc: { view_count: 1 } },

        { returnDocument: "after" }

      );

    if (!hotel) {

      return res.status(404).json({
        message: "Hotel not found"
      });

    }

    res.json(hotel);

  } catch {

    res.status(500).json({
      message: "View update failed"
    });

  }

};



/* =========================================================
   GET HOTEL BY ID
========================================================= */

exports.getHotelById =
  async (req, res) => {

  try {

    const hotel =
      await Hotel.findById(
        req.params.id
      );

    if (!hotel) {

      return res.status(404).json({
        message: "Hotel not found"
      });

    }

    res.json(hotel);

  } catch {

    res.status(500).json({
      message:
        "Failed to fetch hotel"
    });

  }

};
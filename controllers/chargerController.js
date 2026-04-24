const Charger = require("../models/Charger");
const ChargerReview = require("../models/ChargerReview");
const User = require("../models/User");
const axios = require("axios");
const Notification = require("../models/Notification");

/* =========================================================
   GET ALL CHARGERS (FILTER + GEO SEARCH)
========================================================= */

exports.getChargers = async (req, res) => {
  try {
    const {
      city,
      charger_type,
      status,
      latitude,
      longitude,
      radius_km = 50,
    } = req.query;

    let query = {
      isActive: true,
      approvalStatus: "approved",
    };

    if (city) query.city = new RegExp(city, "i");
    if (charger_type) query.charger_type = charger_type;
    if (status) query.status = status;

    let chargers;

    // GEO SEARCH (FAST)
    if (latitude && longitude) {
      chargers = await Charger.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [
                Number(longitude),
                Number(latitude),
              ],
            },
            $maxDistance: radius_km * 1000,
          },
        },
      });
    } else {
      chargers = await Charger.find(query).sort({
        createdAt: -1,
      });
    }

    res.json({
      success: true,
      count: chargers.length,
      chargers,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch chargers",
      error: err.message,
    });
  }
};

/* =========================================================
   GET NEARBY CHARGERS (STRICT GEO SEARCH)
========================================================= */

exports.getNearby = async (req, res) => {
  try {
    const lat = Number(req.query.latitude);
    const lng = Number(req.query.longitude);
    const radius_km =
      Number(req.query.radius_km) || 25;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude required",
      });
    }

    const chargers = await Charger.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius_km * 1000,
        },
      },
      isActive: true,
      approvalStatus: "approved",
    });

    res.json({
      success: true,
      count: chargers.length,
      chargers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch nearby chargers",
      error: error.message,
    });
  }
};

/* =========================================================
   IMPORT FROM OPENCHARGEMAP
========================================================= */

exports.fetchExternal = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message:
          "Latitude and longitude required",
      });
    }

    const response = await axios.get(
      "https://api.openchargemap.io/v3/poi",
      {
        params: {
          latitude,
          longitude,
          distance: 50,
          maxresults: 100,
        },
      }
    );

    let imported = 0;

    for (const s of response.data) {
      const externalId = String(s.ID);

      const exists = await Charger.findOne({
        externalId,
      });

      if (exists) continue;

      await Charger.create({
        name:
          s.AddressInfo?.Title || "EV Charger",
        latitude: s.AddressInfo?.Latitude,
        longitude:
          s.AddressInfo?.Longitude,
        address:
          s.AddressInfo?.AddressLine1 || "",
        city: s.AddressInfo?.Town || "",
        charger_type: "Type 2",
        power_kw: 50,
        externalId,
        source: "openchargemaps",
        approvalStatus: "approved",
        location: {
          type: "Point",
          coordinates: [
            s.AddressInfo?.Longitude,
            s.AddressInfo?.Latitude,
          ],
        },
      });

      imported++;
    }

    res.json({
      success: true,
      imported,
    });
  } catch (error) {
    res.status(500).json({
      message: "External import failed",
      error: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE CHARGER + INCREMENT VIEWS
========================================================= */

exports.getCharger = async (req, res) => {
  try {
    const charger = await Charger.findOne({
      _id: req.params.id,
      approvalStatus: "approved",
      isActive: true,
    });

    if (!charger) {
      return res.status(404).json({
        message: "Charger not found",
      });
    }

    charger.views += 1;
    await charger.save();

    res.json({
      success: true,
      charger,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch charger",
      error: error.message,
    });
  }
};

/* =========================================================
   CREATE CHARGER
========================================================= */

exports.createCharger = async (req, res) => {
  try {
    console.log("========== CREATE CHARGER START ==========");

    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    if (!req.body.latitude || !req.body.longitude) {
      console.log("❌ Missing latitude or longitude");
    }

    const data = {
      ...req.body,
      createdBy: req.user?._id,
      location: {
        type: "Point",
        coordinates: [
          Number(req.body.longitude),
          Number(req.body.latitude),
        ],
      },
    };

    console.log("FINAL DATA:", data);

    if (req.user.role === "admin") {
      console.log("✅ Admin detected → auto approve");

      data.approvalStatus = "approved";
      data.approvedBy = req.user._id;
      data.approvedAt = new Date();

    } else {
      console.log("⚠ Vendor detected → sending notification to admins");

      data.approvalStatus = "pending";

      const admins = await User.find({ role: "admin" });

      console.log("ADMINS FOUND:", admins.length);

      if (!admins.length) {
        console.log("❌ No admin found in DB");
      }

      const notifications = admins.map((admin) => ({
        userId: admin._id,
        type: "charger_pending",
        title: "New Charger Pending Approval",
        message: `${req.user?.name || "User"} submitted a charger`,
      }));
      console.log("NOTIFICATIONS:", notifications);

      await Notification.insertMany(notifications);

      console.log("✅ Notifications inserted");
    }

    const charger = await Charger.create(data);

    console.log("✅ Charger created:", charger._id);

    res.status(201).json({
      success: true,
      charger,
    });

  } catch (error) {
    console.log("❌ ERROR OCCURRED:");
    console.log(error);
    console.log("ERROR MESSAGE:", error.message);
    console.log("STACK:", error.stack);

    res.status(500).json({
      message: "Failed to create charger",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE CHARGER
========================================================= */

exports.updateCharger = async (req, res) => {
  try {
    let filter = { _id: req.params.id };

    // only owner can update if not admin
    if (req.user.role !== "admin") {
      filter.createdBy = req.user._id;
    }

    const charger = await Charger.findOneAndUpdate(
      filter,
      req.body,
      { new: true }
    );

    if (!charger) {
      return res.status(404).json({
        message: "Charger not found or not authorized",
      });
    }

    res.json({
      success: true,
      charger,
    });

  } catch (error) {
    res.status(500).json({
      message: "Update failed",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE CHARGER (SOFT DELETE)
========================================================= */

exports.deleteCharger = async (req, res) => {
  try {
    const charger =
      await Charger.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

    if (!charger) {
      return res.status(404).json({
        message: "Charger not found",
      });
    }

    res.json({
      success: true,
      message: "Charger removed",
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete failed",
      error: error.message,
    });
  }
};

/* =========================================================
   ADD REVIEW
========================================================= */

exports.addReview = async (req, res) => {
  const chargerId = req.params.id;

  const user = await User.findById(
    req.user.id
  );

  const exists =
    await ChargerReview.findOne({
      chargerId,
      userId: user._id,
    });

  if (exists) {
    return res.status(400).json({
      message:
        "You already reviewed this charger",
    });
  }

  const review =
    await ChargerReview.create({
      chargerId,
      userId: user._id,
      userName: user.name,
      rating: req.body.rating,
      comment: req.body.comment,
    });

  const reviews =
    await ChargerReview.find({ chargerId });

  const avg =
    reviews.reduce(
      (sum, r) => sum + r.rating,
      0
    ) / reviews.length;

  await Charger.findByIdAndUpdate(
    chargerId,
    {
      rating: avg,
      reviewCount: reviews.length,
    }
  );

  res.json(review);
};

/* =========================================================
   GET REVIEWS
========================================================= */

exports.getReviews = async (req, res) => {
  try {
    const reviews =
      await ChargerReview.find({
        chargerId: req.params.id,
      }).sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

/* =========================================================
   DYNAMIC CHARGER TYPES
========================================================= */

exports.getChargerTypes = (req, res) => {
  res.json([
    "DC Fast",
    "AC Level 2",
    "AC Level 1",
    "CCS",
    "CHAdeMO",
    "Type 2",
  ]);
};

/* =========================================================
   DYNAMIC AMENITIES
========================================================= */

exports.getAmenities = (req, res) => {
  res.json([
    "wifi",
    "parking",
    "cafe",
    "restaurant",
    "restroom",
    "shopping",
  ]);
};
const User = require("../models/User");
const Car = require("../models/Car");
const Charger = require("../models/Charger");
const ChargerReview = require("../models/ChargerReview");
const Hotel = require("../models/hotelModel");

const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const MonthlyStats = require("../models/MonthlyStats");
const { updateMonthlyStats } = require("../utils/updateMonthlyStats");


/* =========================================================
   DASHBOARD STATS
========================================================= */

exports.getStats = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();

    const totalVendors = await User.countDocuments({
      role: "vendor",
    });

    const totalChargers =
      await Charger.countDocuments({
        approvalStatus: "approved",
      });

    const pendingChargers =
      await Charger.countDocuments({
        approvalStatus: "pending",
      });

    const totalCars =
      await Car.countDocuments();

    const pending =
      await Car.countDocuments({
        status: "pending",
      });

    const approved =
      await Car.countDocuments({
        status: "approved",
      });

    const sold =
      await Car.countDocuments({
        status: "sold",
      });

    const totalHotels =
      await Hotel.countDocuments();

    const pendingHotels =
      await Hotel.countDocuments({
        status: "pending",
      });

    const approvedHotels =
      await Hotel.countDocuments({
        status: "approved",
      });

    res.json({
      users: {
        total: totalUsers,
        vendors: totalVendors,
        regular_users:
          totalUsers - totalVendors,
      },

      chargers: {
        total: totalChargers,
        pending: pendingChargers,
      },

      marketplace: {
        total_listings: totalCars,
        pending,
        approved,
        sold,
      },

      hotels: {
        total: totalHotels,
        pending: pendingHotels,
        approved: approvedHotels,
      },
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


/* =========================================================
   USERS LIST
========================================================= */

exports.getUsers = async (req, res) => {
  try {

    const { role, search } = req.query;

    let query = {};

    if (role) query.role = role;

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    const total =
      await User.countDocuments(query);

    res.json({ users, total });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


/* =========================================================
   UPDATE USER ROLE
========================================================= */

exports.updateUserRole = async (req, res) => {
  try {

    const { role } = req.body;

    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    await User.findByIdAndUpdate(
      req.params.id,
      { role }
    );

    res.json({
      message: "Role updated",
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


/* =========================================================
   UPDATE USER STATUS
========================================================= */

exports.updateUserStatus = async (req, res) => {
  try {

    const { isActive } = req.body;

    await User.findByIdAndUpdate(
      req.params.id,
      { isActive }
    );

    res.json({
      message: "Status updated",
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


/* =========================================================
   GET ALL CARS (pagination + filter)
========================================================= */

exports.getAllCars = async (req, res) => {
  try {

    const page =
      parseInt(req.query.page) || 1;

    const limit =
      parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const status = req.query.status;

    let query = {};

    if (status) query.status = status;

    const cars = await Car.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total =
      await Car.countDocuments(query);

    res.json({ cars, total });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


/* =========================================================
   PENDING CARS
========================================================= */

exports.getPendingCars = async (req, res) => {
  try {

    const cars = await Car.find({
      status: "pending",
    }).sort({ createdAt: 1 });

    res.json({ cars });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


/* =========================================================
   APPROVE CAR
========================================================= */

exports.approveCar = async (req, res) => {
  try {

    console.log("APPROVE CAR API HIT");

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!car) {
      console.log("CAR NOT FOUND");
      return res.status(404).json({
        message: "Car not found"
      });
    }
    console.log("CAR FOUND:", car.model);
    console.log("SELLER ID:", car.seller);
    // Notify seller if exists
    if (car.seller) {

      const notification = await Notification.create({
        type: "car_approved",
        title: "Car Approved",
        message: `Your ${car.brand} ${car.model} listing has been approved`,
        user: car.seller,
        relatedCar: car._id,
        forAdmin: false
      });

      console.log("NOTIFICATION CREATED:", notification._id);
      // 📊 Update monthly stats
      if (car.status === "approved") {
        await updateMonthlyStats("car_listings", 1);
      }

    } else {

      console.log("SELLER NOT FOUND → Notification NOT sent");

    }

    // Activity log
    if (req.user?._id) {
      const activity = await Activity.create({
        type: "approve",
        action: "approved car listing",
        target: car.model,
        admin: req.user._id
      });

      const io = req.app.get("io");

      io.to("admin_room").emit("new_activity", {
        _id: activity._id,
        type: activity.type,
        action: activity.action,
        target: activity.target,
        admin_name: req.user?.name || "Admin",
        created_at: activity.createdAt
      });
    }

    res.json({
      message: "Car approved successfully",
      car
    });

  } catch (err) {

    console.error("ApproveCar Error:", err);

    res.status(500).json({
      message: err.message
    });
  }
};


/* =========================================================
   REJECT CAR
========================================================= */

exports.rejectCar = async (req, res) => {
  try {

    const { reason } = req.body;

    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        message: "Car not found"
      });
    }

    if (car.status === "rejected") {
      return res.status(400).json({
        message: "Car already rejected"
      });
    }

    car.status = "rejected";
    car.rejectionReason = reason || "Not specified";

    await car.save();

    // Notify seller if exists
    if (car.seller) {
      await Notification.create({
        type: "car_rejected",
        title: "Car Rejected",
        message: `Your ${car.brand} ${car.model} listing was rejected`,
        user: car.seller,
        relatedCar: car._id,
        createdBy: req.user?._id || null,
        forAdmin: false
      });
    }

    // Activity log
    if (req.user?._id) {
      const activity = await Activity.create({
        type: "reject",
        action: "rejected car listing",
        target: car.model,
        admin: req.user._id
      });

      const io = req.app.get("io");

      io.to("admin_room").emit("new_activity", {
        _id: activity._id,
        type: activity.type,
        action: activity.action,
        target: activity.target,
        admin_name: req.user?.name || "Admin",
        created_at: activity.createdAt
      });


    }

    res.json({
      message: "Car rejected successfully",
      car
    });

  } catch (err) {

    console.error("RejectCar Error:", err);

    res.status(500).json({
      message: err.message
    });

  }
};

/* =========================================================
   DELETE CAR
========================================================= */

exports.deleteCar = async (req, res) => {
  try {

    console.log("DELETE CAR API HIT");
    console.log("REQ.USER:", req.user);
    console.log("ADMIN ID:", req.user?._id);

    const car = await Car.findByIdAndDelete(
      req.params.id
    );

    if (!car) {
      console.log("CAR NOT FOUND");
      return res.status(404).json({
        message: "Car not found"
      });
    }

    console.log("CAR DELETED:", car.model);

    // Notify seller (if exists)
    if (car.seller) {
      console.log("SENDING SELLER NOTIFICATION");

      await Notification.create({
        type: "car_rejected",
        title: "Car Listing Removed",
        message: `Your ${car.brand} ${car.model} listing was removed by admin`,
        user: car.seller,
        relatedCar: car._id,
        forAdmin: false
      });
    }

    // Activity log
    if (req.user?._id) {

      console.log("CREATING ACTIVITY LOG");

      try {

        const activity = await Activity.create({
          type: "delete",
          action: "deleted car listing",
          target: car.model,
          admin: req.user._id
        });


        const io = req.app.get("io");

        io.to("admin_room").emit("new_activity", {
          _id: activity._id,
          type: activity.type,
          action: activity.action,
          target: activity.target,
          admin_name: req.user?.name || "Admin",
          created_at: activity.createdAt
        });

        console.log("ACTIVITY SAVED:", activity);

      } catch (activityError) {

        console.log("ACTIVITY SAVE ERROR:", activityError.message);

      }

    } else {

      console.log("ADMIN ID MISSING → ACTIVITY NOT SAVED");

    }

    res.json({
      message: "Car deleted successfully"
    });

  } catch (err) {

    console.error("DeleteCar Error:", err);

    res.status(500).json({
      message: err.message
    });

  }
};


/* =========================================================
   GET CHARGERS
========================================================= */

exports.getChargers = async (req, res) => {
  try {

    const page =
      parseInt(req.query.page) || 1;

    const limit =
      parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const chargers = await Charger.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total =
      await Charger.countDocuments();

    res.json({
      chargers,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (err) {

    console.error("GetChargers Error:", err);

    res.status(500).json({
      message: err.message
    });

  }
};

/* =========================================================
   PENDING CHARGERS
========================================================= */

exports.getPendingChargers = async (req, res) => {
  try {

    const chargers = await Charger.find({
      approvalStatus: "pending",
      isActive: true
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: 1 });

    res.json({ chargers });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};



/* =========================================================
   DELETE CHARGER
========================================================= */

exports.deleteCharger = async (req, res) => {
  try {

    const id = req.params.id;

    // Delete charger
    const charger = await Charger.findByIdAndDelete(id);

    if (!charger) {
      return res.status(404).json({
        message: "Charger not found"
      });
    }

    // Delete related reviews
    await ChargerReview.deleteMany({
      chargerId: id
    });

    // Activity log (admin action tracking)
    if (req.user?._id) {
      const activity = await Activity.create({
        type: "delete",
        action: "deleted charger",
        target: charger.name || "charger",
        admin: req.user._id
      });


      const io = req.app.get("io");

      io.to("admin_room").emit("new_activity", {
        _id: activity._id,
        type: activity.type,
        action: activity.action,
        target: activity.target,
        admin_name: req.user?.name || "Admin",
        created_at: activity.createdAt
      });
    }

    res.json({
      message: "Charger and related reviews deleted successfully"
    });

  } catch (err) {

    console.error("DeleteCharger Error:", err);

    res.status(500).json({
      message: err.message
    });

  }
};


/* =========================================================
   APPROVE CHARGER
========================================================= */

exports.approveCharger = async (req, res) => {
  try {

    const charger = await Charger.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!charger) {
      return res.status(404).json({
        message: "Charger not found",
      });
    }

    // notify vendor
    if (charger.createdBy) {
      await Notification.create({
        type: "charger_approved",
        title: "Charger Approved",
        message: `${charger.name} has been approved`,
        user: charger.createdBy,
        forAdmin: false,
      });
    }

    res.json({
      message: "Charger approved successfully",
      charger,
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};

/* =========================================================
   REJECT CHARGER
========================================================= */

exports.rejectCharger = async (req, res) => {
  try {

    const { reason } = req.body;

    const charger = await Charger.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "rejected",
        rejectionReason: reason || "Not specified",
      },
      { new: true }
    );

    if (!charger) {
      return res.status(404).json({
        message: "Charger not found",
      });
    }

    // notify vendor
    if (charger.createdBy) {
      await Notification.create({
        type: "charger_rejected",
        title: "Charger Rejected",
        message: `${charger.name} was rejected by admin`,
        user: charger.createdBy,
        forAdmin: false,
      });
    }

    res.json({
      message: "Charger rejected successfully",
      charger,
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};

/* =========================================================
   HOTELS LIST
========================================================= */

exports.getAllHotels = async (req, res) => {
  try {

    const hotels = await Hotel.find()
      .sort({ createdAt: -1 });

    const total =
      await Hotel.countDocuments();

    res.json({ hotels, total });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


/* =========================================================
   APPROVE HOTEL
========================================================= */

exports.approveHotel = async (req, res) => {
  try {

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approved_at: new Date(),
        approved_by: req.user._id
      },
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    // Notify hotel owner (user notification)
    if (hotel.owner) {
      await Notification.create({
        type: "hotel_approved",
        title: "Hotel Approved",
        message: `${hotel.name} has been approved and is now live`,
        user: hotel.owner,
        forAdmin: false
      });
      // 📊 Update monthly stats
      if (hotel.owner && hotel.status === "approved") {
        await updateMonthlyStats("hotels_approved", 1);
      }
    }

    // Admin activity log
    if (req.user?._id) {
      const activity = await Activity.create({
        type: "approve",
        action: "approved hotel",
        target: hotel.name,
        admin: req.user._id
      });

      const io = req.app.get("io");

      io.to("admin_room").emit("new_activity", {
        _id: activity._id,
        type: activity.type,
        action: activity.action,
        target: activity.target,
        admin_name: req.user?.name || "Admin",
        created_at: activity.createdAt
      });
    }

    res.json({
      message: "Hotel approved successfully",
      hotel,
    });

  } catch (err) {

    console.error("ApproveHotel Error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   REJECT HOTEL
========================================================= */

exports.rejectHotel = async (req, res) => {
  try {

    const { reason } = req.body;

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejection_reason: reason || "Not specified",
      },
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    // Notify hotel owner (user notification)
    if (hotel.owner) {
      await Notification.create({
        type: "hotel_rejected",
        title: "Hotel Rejected",
        message: `${hotel.name} was rejected by admin`,
        user: hotel.owner,
        forAdmin: false
      });
    }

    // Admin activity log
    if (req.user?._id) {
      const activity = await Activity.create({
        type: "reject",
        action: "rejected hotel",
        target: hotel.name,
        admin: req.user._id
      });

      const io = req.app.get("io");

      io.to("admin_room").emit("new_activity", {
        _id: activity._id,
        type: activity.type,
        action: activity.action,
        target: activity.target,
        admin_name: req.user?.name || "Admin",
        created_at: activity.createdAt
      });
    }

    res.json({
      message: "Hotel rejected successfully",
      hotel,
    });

  } catch (err) {

    console.error("RejectHotel Error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   DELETE HOTEL
========================================================= */

exports.deleteHotel = async (req, res) => {
  try {

    const hotel = await Hotel.findByIdAndDelete(
      req.params.id
    );

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found"
      });
    }

    // Notify hotel owner
    if (hotel.owner) {
      await Notification.create({
        type: "hotel_rejected",
        title: "Hotel Removed",
        message: `${hotel.name} has been removed by admin`,
        user: hotel.owner,
        forAdmin: false
      });
    }

    // Activity log
    if (req.user?._id) {
      const activity = await Activity.create({
        type: "delete",
        action: "deleted hotel",
        target: hotel.name,
        admin: req.user._id
      });

      const io = req.app.get("io");

      io.to("admin_room").emit("new_activity", {
        _id: activity._id,
        type: activity.type,
        action: activity.action,
        target: activity.target,
        admin_name: req.user?.name || "Admin",
        created_at: activity.createdAt
      });
    }

    res.json({
      message: "Hotel deleted successfully"
    });

  } catch (err) {

    console.error("DeleteHotel Error:", err);

    res.status(500).json({
      message: err.message
    });

  }
};


/* =========================================================
   ACTIVITY LOGS
========================================================= */

exports.getActivityLogs = async (req, res) => {
  try {

    const logs = await Activity.find()
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    // frontend-compatible format
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      type: log.type,
      action: log.action,
      target: log.target,
      admin_name: log.admin?.name || "Admin",
      created_at: log.createdAt
    }));

    res.json({ logs: formattedLogs });

  } catch (err) {

    console.error("Activity Logs Error:", err);

    res.status(500).json({
      message: err.message,
    });

  }
};


/* =========================================================
   NOTIFICATIONS
========================================================= */

exports.getNotifications = async (req, res) => {
  try {

    const notifications = await Notification
      .find({ forAdmin: true })   // 👈 only admin notifications
      .populate("createdBy", "name email")
      .populate("relatedCar", "brand model")
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      forAdmin: true,
      is_read: false
    });

    res.json({
      notifications,
      unreadCount
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(
      req.params.id,
      { is_read: true }
    );

    res.json({ message: "Notification marked as read" });

  } catch (error) {
    res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
};


// MARK ALL READ
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { is_read: false, forAdmin: true },
      { is_read: true }
    );

    res.json({ message: "All notifications marked as read" });

  } catch (error) {
    res.status(500).json({
      message: "Failed to mark notifications",
    });
  }
};


/* =========================================================
   ANALYTICS SUMMARY
========================================================= */

exports.getAnalytics = async (req, res) => {
  try {

    /* ===============================
       BASIC COUNTS
    =============================== */

    const totalUsers =
      await User.countDocuments();

    const totalCars =
      await Car.countDocuments({
        status: "approved"
      });

    const totalChargers =
      await Charger.countDocuments({
        approvalStatus: "approved",
      });

    const totalHotels =
      await Hotel.countDocuments({
        status: "approved"
      });


    /* ===============================
       TOP CITIES (Cars + Hotels merged)
    =============================== */

    const carCities =
      await Car.aggregate([
        {
          $match: {
            city: { $exists: true, $ne: "" },
            status: "approved"
          }
        },
        {
          $group: {
            _id: "$city",
            count: { $sum: 1 }
          }
        }
      ]);

    const hotelCities =
      await Hotel.aggregate([
        {
          $match: {
            city: { $exists: true, $ne: "" },
            status: "approved"
          }
        },
        {
          $group: {
            _id: "$city",
            count: { $sum: 1 }
          }
        }
      ]);

    const mergedCities =
      [...carCities, ...hotelCities];

    const cityMap = {};

    mergedCities.forEach(c => {
      cityMap[c._id] =
        (cityMap[c._id] || 0) + c.count;
    });

    const sortedCities =
      Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const totalCityCount =
      sortedCities.reduce(
        (sum, c) => sum + c[1],
        0
      );

    const formattedCities =
      sortedCities.map(([city, count]) => [
        city,
        Math.round(
          (count / totalCityCount) * 100
        ) + "%",
        "bg-blue-500"
      ]);


    /* ===============================
       TOP EV BRANDS
    =============================== */

    const topBrandsRaw =
      await Car.aggregate([
        {
          $match: {
            brand: { $exists: true, $ne: "" },
            status: "approved"
          }
        },
        {
          $group: {
            _id: "$brand",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

    const totalBrandCount =
      topBrandsRaw.reduce(
        (sum, b) => sum + b.count,
        0
      );

    const topBrands =
      topBrandsRaw.map(b => [
        b._id,
        Math.round(
          (b.count / totalBrandCount) * 100
        ) + "%",
        "bg-purple-500"
      ]);


    /* ===============================
       CHARGER TYPE USAGE
    =============================== */

    const chargerUsageRaw =
      await Charger.aggregate([
        {
          $match: {
            charger_type: {
              $exists: true,
              $ne: ""
            }
          }
        },
        {
          $group: {
            _id: "$charger_type",
            count: { $sum: 1 }
          }
        }
      ]);

    const totalChargerUsage =
      chargerUsageRaw.reduce(
        (sum, c) => sum + c.count,
        0
      );

    const chargerTypeUsage =
      chargerUsageRaw.map(c => [
        c._id,
        totalChargerUsage
          ? Math.round(
            (c.count / totalChargerUsage) * 100
          ) + "%"
          : "0%",
        "bg-green-500"
      ]);

    /* ===============================
       RESPONSE
    =============================== */

    res.json({

      users: {
        total: totalUsers
      },

      marketplace: {
        total_listings: totalCars
      },

      chargers: {
        total: totalChargers
      },

      hotels: {
        total: totalHotels
      },

      revenue: 0,

      charger_sessions:
        totalChargers,

      top_cities:
        formattedCities,

      top_brands:
        topBrands,

      charger_type_usage:
        chargerTypeUsage

    });

  } catch (err) {

    console.error(
      "Analytics error:",
      err.message
    );

    res.status(500).json({
      message: err.message
    });

  }
};


/* =========================================================
   MONTHLY SUMMARY
========================================================= */

exports.getMonthlySummary = async (
  req,
  res
) => {
  try {

    const stats =
      await MonthlyStats.find()
        .sort({ year: -1, monthNumber: -1 });

    res.json(stats);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};


exports.getUnreadNotificationsCount = async (req, res) => {
  try {



    const count = await Notification.countDocuments({
      is_read: false,
      forAdmin: true
    });
    res.json({ unread: count });

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch unread count"
    });

  }
};
const mongoose = require("mongoose");
const Notification = require("../models/Notification");


/* =========================================================
   GET USER NOTIFICATIONS
========================================================= */

exports.getMyNotifications = async (req, res) => {
  try {

    // Convert JWT string ID into MongoDB ObjectId
    const userId = new mongoose.Types.ObjectId(
      req.user._id || req.user.id
    );

    console.log("FETCH USER ID:", userId);

    const notifications = await Notification.find({
      user: userId,
      forAdmin: false
    })
      .populate("relatedCar", "brand model")
      .sort({ createdAt: -1 });

    console.log("FOUND NOTIFICATIONS:", notifications.length);

    res.json({ notifications });

  } catch (err) {

    console.error("GET MY NOTIFICATIONS ERROR:", err);

    res.status(500).json({
      message: err.message
    });

  }
};


/* =========================================================
   MARK SINGLE NOTIFICATION READ
========================================================= */

exports.markNotificationRead = async (req, res) => {
  try {

    console.log("MARK READ:", req.params.id);

    await Notification.findByIdAndUpdate(
      req.params.id,
      { is_read: true }
    );

    res.json({
      message: "Notification marked as read"
    });

  } catch (err) {

    console.error("MARK SINGLE READ ERROR:", err);

    res.status(500).json({
      message: "Failed to mark notification as read"
    });

  }
};


/* =========================================================
   MARK ALL NOTIFICATIONS READ
========================================================= */

exports.markAllNotificationsRead = async (req, res) => {
  try {

    const userId = new mongoose.Types.ObjectId(
      req.user._id || req.user.id
    );

    console.log("MARK ALL READ FOR USER:", userId);

    await Notification.updateMany(
      {
        user: userId,
        is_read: false
      },
      {
        is_read: true
      }
    );

    res.json({
      message: "All notifications marked as read"
    });

  } catch (err) {

    console.error("MARK ALL READ ERROR:", err);

    res.status(500).json({
      message: "Failed to mark notifications"
    });

  }
};
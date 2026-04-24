const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");


/* ===============================
   USER NOTIFICATIONS
=============================== */

router.get(
  "/",
  protect,
  getMyNotifications
);

router.put(
  "/:id/read",
  protect,
  markNotificationRead
);

router.put(
  "/read-all",
  protect,
  markAllNotificationsRead
);


module.exports = router;
const express = require("express");
const router = express.Router();

const {
  getStats,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getPendingCars,
  approveCar,
  rejectCar,
  getChargers,
  deleteCharger,
  getAllCars,
  deleteCar,
  getActivityLogs,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationsCount,
  getAnalytics,
  getMonthlySummary,

  // ✅ ADD THESE NEW FUNCTIONS
  getPendingChargers,
  approveCharger,
  rejectCharger

} = require("../controllers/adminController");

const {
  createHotel,
  getPendingHotels,
  approveHotel,
  deleteHotel,
  getAllHotels,
  incrementHotelView,
  rejectHotel 
} = require("../controllers/adminHotelController");

const {
  protect,
  requireRole
} = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");


/* ===============================
   DASHBOARD
=============================== */

router.get(
  "/stats",
  protect,
  requireRole("admin"),
  getStats
);


/* ===============================
   USERS
=============================== */

router.get(
  "/users",
  protect,
  requireRole("admin"),
  getUsers
);

router.put(
  "/users/:id/role",
  protect,
  requireRole("admin"),
  updateUserRole
);

router.put(
  "/users/:id/status",
  protect,
  requireRole("admin"),
  updateUserStatus
);


/* ===============================
   CARS
=============================== */

router.get(
  "/cars",
  protect,
  requireRole("admin"),
  getAllCars
);

router.get(
  "/ev-cars/pending",
  protect,
  requireRole("admin"),
  getPendingCars
);

router.put(
  "/ev-cars/:id/approve",
  protect,
  requireRole("admin"),
  approveCar
);

router.put(
  "/ev-cars/:id/reject",
  protect,
  requireRole("admin"),
  rejectCar
);

router.delete(
  "/cars/:id",
  protect,
  requireRole("admin"),
  deleteCar
);


/* ===============================
   CHARGERS
=============================== */

router.get(
  "/chargers",
  protect,
  requireRole("admin"),
  getChargers
);

router.delete(
  "/chargers/:id",
  protect,
  requireRole("admin"),
  deleteCharger
);



router.get(
  "/chargers/pending",
  protect,
  requireRole("admin"),
  getPendingChargers
);

router.put(
  "/chargers/:id/approve",
  protect,
  requireRole("admin"),
  approveCharger
);

router.put(
  "/chargers/:id/reject",
  protect,
  requireRole("admin"),
  rejectCharger
);

/* ===============================
   HOTELS
=============================== */

router.post(
  "/hotels",
  protect,
  requireRole("admin"),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "room_image_0", maxCount: 1 },
    { name: "room_image_1", maxCount: 1 },
    { name: "room_image_2", maxCount: 1 },
    { name: "room_image_3", maxCount: 1 },
    { name: "room_image_4", maxCount: 1 }
  ]),
  createHotel
);

router.get(
  "/hotels",
  protect,
  requireRole("admin"),
  getAllHotels
);

router.get(
  "/hotels/pending",
  protect,
  requireRole("admin"),
  getPendingHotels
);

router.put(
  "/hotels/:id/approve",
  protect,
  requireRole("admin"),
  approveHotel
);

router.delete(
  "/hotels/:id",
  protect,
  requireRole("admin"),
  deleteHotel
);

router.put(
  "/hotels/:id/reject",
  protect,
  requireRole("admin"),
  rejectHotel
);

/* ===============================
   ACTIVITY LOGS
=============================== */

router.get(
  "/activity",
  protect,
  requireRole("admin"),
  getActivityLogs
);


/* ===============================
   NOTIFICATIONS
=============================== */

router.get(
  "/notifications",
  protect,
  requireRole("admin"),
  getNotifications
);


router.get(
  "/notifications/unread-count",
  protect,
  requireRole("admin"),
  getUnreadNotificationsCount
);

router.put(
  "/notifications/:id/read",
  protect,
  requireRole("admin"),
  markNotificationRead
);

router.put(
  "/notifications/read-all",
  protect,
  requireRole("admin"),
  markAllNotificationsRead
);


/* ===============================
   ANALYTICS
=============================== */

router.get(
  "/analytics",
  protect,
  requireRole("admin"),
  getAnalytics
);


/* ===============================
   MONTHLY SUMMARY
=============================== */

router.get(
  "/monthly-summary",
  protect,
  requireRole("admin"),
  getMonthlySummary
);


module.exports = router;
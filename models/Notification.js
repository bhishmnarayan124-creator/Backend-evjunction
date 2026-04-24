const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
            enum: [
        "register",
        "login",
        "listing",
        "approval",
        "system",
        "car_pending",
        "car_approved",
        "car_rejected",
        "hotel_pending",
        "hotel_approved",
        "hotel_rejected",
        "charger_pending",   // ✅ ADD THIS
        "charger_approved",  // ✅ ADD THIS
        "charger_rejected"   // ✅ ADD THIS
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // किस user ने action किया
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // किस user के लिए notification है
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // किस car से related notification है
    relatedCar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      default: null,
    },

    // admin-only notification flag
    forAdmin: {
      type: Boolean,
      default: false,
    },

    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // ✅ automatically stores date + time
  }
);

// ✅ Prevent mongoose overwrite error
module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
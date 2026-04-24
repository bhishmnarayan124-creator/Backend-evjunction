const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["approve", "reject", "delete", "edit", "add"]
    },

    action: {
      type: String,
      required: true
    },

    target: {
      type: String,
      default: ""
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Activity ||
  mongoose.model("Activity", activitySchema);
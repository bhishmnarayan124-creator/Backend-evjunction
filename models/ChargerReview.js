const mongoose = require("mongoose");

const chargerReviewSchema = new mongoose.Schema(
  {
    chargerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charger",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userName: { type: String, required: true },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ChargerReview", chargerReviewSchema);
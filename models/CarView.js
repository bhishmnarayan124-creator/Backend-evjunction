const mongoose = require("mongoose");

const carViewSchema = new mongoose.Schema(
{
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
},
{ timestamps: true }
);

// prevent duplicate view per user per car
carViewSchema.index({ car: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("CarView", carViewSchema);
const mongoose = require("mongoose");

const monthlyStatsSchema = new mongoose.Schema({

  month: {
    type: String,
    required: true
  },

  monthNumber: {
    type: Number,
    required: true
  },

  year: {
    type: Number,
    required: true
  },

  new_users: {
    type: Number,
    default: 0
  },

  user_logins: {
    type: Number,
    default: 0
  },

  car_listings: {
    type: Number,
    default: 0
  },

  charger_sessions: {
    type: Number,
    default: 0
  },

  hotels_added: {
    type: Number,
    default: 0
  },

  revenue: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

/*
 Prevent duplicate records for same month + year
 Example:
 Apr 2026 → only one record allowed
*/
monthlyStatsSchema.index(
  { month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "MonthlyStats",
  monthlyStatsSchema
);
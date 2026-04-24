const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    // BASIC INFO
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    trim: { type: String },

    price: { type: Number, required: true },

    vehicle_type: { type: String }, // Electric SUV
    drivetrain: { type: String }, // AWD / FWD / RWD
    owners: { type: Number },

    title_status: {
      type: String,
      enum: ["clean", "salvage", "rebuilt"],
      default: "clean",
    },

    // BATTERY
    battery_capacity_kwh: { type: Number, required: true },
    range_km: { type: Number, required: true },
    current_range_km: { type: Number },

    battery_health_score: { type: Number },
    battery_health_status: { type: String },

    max_charge_rate: { type: Number },
    max_ac_charge_rate: { type: Number },

    charge_port: { type: String },
    charge_time: { type: String },

    fast_charging_supported: { type: Boolean, default: true },

    warranty_remaining_months: { type: Number, default: 0 },

    // PERFORMANCE
    horsepower: { type: Number },
    torque: { type: String },
    zero_sixty: { type: Number },
    quarter_mile: { type: String },
    top_speed: { type: Number },

    // USAGE
    mileage_km: { type: Number, default: 0 },

    // LOCATION
    seller_location: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },

    // COLORS
    exterior_color: { type: String },
    interior_color: { type: String },


    // EXTERIOR EXTRA SPECS
    wheels: { type: String },
    roof: { type: String },
    length: { type: String },
    width: { type: String },
    height: { type: String },
    curb_weight: { type: String },

    // INTERIOR EXTRA SPECS
    upholstery: { type: String },
    infotainment: { type: String },
    rear_screen: { type: String },
    steering: { type: String },
    audio: { type: String },

    // GENERAL COLOR (legacy support)
    color: { type: String },

    // CONDITION
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair"],
      default: "good",
    },

    body_style: { type: String },
    doors: { type: Number },
    seating_capacity: { type: Number },
    is_verified: { type: Boolean, default: false },

    // DESCRIPTION
    description: { type: String },

    // FEATURES
    features: [{ type: String }],

    // IMAGES
    images: [{ type: String }],

    // IDENTIFICATION
    vin: { type: String },
    stock_number: { type: String },

    // SELLER INFO
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seller_name: { type: String, required: true },

    seller_type: {
      type: String,
      enum: ["user", "dealer"],
      default: "user",
    },

    seller_rating: { type: Number, default: 0 },
    seller_cars_listed: { type: Number, default: 0 },
    response_rate: { type: Number, default: 0 },
    avg_response: { type: String },

    // LISTING STATUS
    status: {
      type: String,
      enum: ["pending", "approved", "sold", "rejected"],
      default: "pending",
    },

    // ANALYTICS
    views: { type: Number, default: 0 },
    inquiry_count: { type: Number, default: 0 },

    rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },

    listed_days: { type: Number }, // auto-calculated in controller
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Car", carSchema);
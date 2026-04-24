const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  type: { type: String, required: true },
  size: String,
  bed: String,
  price: Number,
  max_guests: Number,
  features: [String],
});

const hotelSchema = new mongoose.Schema(
{
  // BASIC INFO
  name: String,
  hotel_type: String,
  star_category: String,
  rating: Number,
  review_count: {
    type: Number,
    default: 0
  },

  // LOCATION
  address: String,
  city: String,
  state: String,
  pincode: String,

  // CONTACT
  phone: String,
  email: String,

  // EV CHARGING
  chargers_available: Number,
  charger_type: String,
  charging_power_kw: Number,
  charging_cost: String,

  // CHECKIN / CHECKOUT
  check_in_time: String,
  check_out_time: String,
  early_checkin: String,
  late_checkout: String,
  age_restriction: {
    type: Number,
    default: 18
  },

  // AMENITIES
  amenities: [String],

  // POLICIES
  cancellation_policy: String,
  refund_policy: String,
  pet_policy: String,
  smoking_policy: String,
  visitor_policy: String,
  couple_policy: String,
  extra_bed_policy: String,
  child_policy: String,
  damage_policy: String,
  payment_methods: [String],
  id_proof_accepted: [String],
  safety_features: [String],

  // DESCRIPTION
  description: String,

  // ROOMS
  rooms: [roomSchema],

  connector_types: [String],

room_images: {
  type: Object,
  default: {}
},

price_per_night: Number,
price_weekend: Number,
price_suite: Number,
tax_percentage: Number,
total_rooms: Number,

  // IMAGES
  images: [String],
  primary_image_index: {
    type: Number,
    default: 0,
  },

  // STATUS
  view_count: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
},
{ timestamps: true }
);

module.exports = mongoose.model("Hotel", hotelSchema);
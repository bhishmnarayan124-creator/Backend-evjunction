const mongoose = require("mongoose");

const chargerSchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
    },
      
    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
    },

    /* LOCATION */
    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },

    /* CHARGER DETAILS */
    charger_type: {
      type: String,
      enum: [
        "DC Fast",
        "AC Level 2",
        "AC Level 1",
        "CCS",
        "CHAdeMO",
        "Type 2",
      ],
      default: "DC Fast",
    },

    connectors: [
      {
        type: String,
      },
    ],

    number_of_connectors: {
      type: Number,
      default: 2,
    },

    power_kw: {
      type: Number,
      default: 50,
    },

    /* STATUS */
    status: {
      type: String,
      enum: ["available", "occupied", "offline", "maintenance"],
      default: "available",
    },

    lastUpdatedStatusAt: {
      type: Date,
      default: Date.now,
    },

    /* PRICING */
    pricePerKwh: {
      type: Number,
      default: 0,
    },

    wait_time_min: {
      type: Number,
      default: 20,
    },

    /* NETWORK */
    operator: {
      type: String,
    },

    network_provider: {
      type: String,
    },

    /* AMENITIES */
    amenities: [
      {
        type: String,
      },
    ],

    nearby_hotel: {
      type: String,
    },

    /* CONTACT */
    contactPhone: {
      type: String,
    },

    open24Hours: {
      type: Boolean,
      default: true,
    },

    /* MEDIA */
    imageUrl: {
      type: String,
    },

    /* RATINGS */
    rating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    /* SOURCE */
    source: {
      type: String,
      enum: ["manual", "openchargemaps"],
      default: "manual",
    },

    externalId: {
      type: String,
    },

    /* OWNERSHIP */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/* GEO INDEX FOR NEARBY SEARCH */
chargerSchema.index({ location: "2dsphere" });

/* FAST FILTER INDEXES */
chargerSchema.index({ city: 1 });
chargerSchema.index({ charger_type: 1 });
chargerSchema.index({ status: 1 });

module.exports = mongoose.model("Charger", chargerSchema);
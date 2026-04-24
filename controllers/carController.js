const Car = require("../models/Car");
const User = require("../models/User");
const calculateBatteryHealth = require("../utils/batteryHealth");
const mongoose = require("mongoose");
const CarView = require("../models/CarView");
const Notification = require("../models/Notification");
// ================= GET ALL CARS =================
exports.getCars = async (req, res) => {
  try {
    const {
      brand,
      city,
      minPrice,
      maxPrice,
      min_year,
      max_year,
      min_range,
      condition,
      status = "approved",
      min_battery_health,
      fast_charging_supported,
      page = 1,
      limit = 12,
    } = req.query;

    let query = {};

    if (status) query.status = status;
    if (brand) query.brand = new RegExp(brand, "i");
    if (city) query.city = new RegExp(city, "i");
    if (condition) query.condition = condition;

    if (min_battery_health) {
      query.battery_health_score = {
        $gte: Number(min_battery_health),
      };
    }

    if (fast_charging_supported) {
      query.fast_charging_supported =
        fast_charging_supported === "true";
    }

    if (minPrice || maxPrice){
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (min_year || max_year) {
      query.year = {};
      if (min_year) query.year.$gte = Number(min_year);
      if (max_year) query.year.$lte = Number(max_year);
    }

    if (min_range) {
      query.range_km = { $gte: Number(min_range) };
    }

    const skip = (page - 1) * limit;

    const cars = await Car.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Car.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      cars,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET MY LISTINGS =================
exports.getMyListings = async (req, res) => {
  try {
    const cars = await Car.find({ seller: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET BRANDS =================
exports.getBrands = async (req, res) => {
  try {
    const brands = await Car.distinct("brand");
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ================= GET CITY =================
exports.getCities = async (req, res) => {
  try {

    const cities = await Car.distinct("city");

    res.json(cities);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ================= BATTERY =================
exports.calculateBattery = (req, res) => {
  try {
    const result = calculateBatteryHealth(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET SINGLE =================
exports.getCar = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Car ID" });
    }

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CREATE =================
exports.createCar = async (req, res) => {
  try {
    console.log("📦 BODY:", req.body);

    const user = await User.findById(req.user._id);

    // ✅ VALIDATION
    if (
      !req.body.brand ||
      !req.body.model ||
      !req.body.price ||
      !req.body.city ||
      !req.body.battery_capacity_kwh ||
      !req.body.range_km
    ) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    // ✅ SAFE NUMBER CONVERSION
    const battery_capacity_kwh = Number(req.body.battery_capacity_kwh);
    const range_km = Number(req.body.range_km);
    const mileage_km = Number(req.body.mileage_km || 0);
    const price = Number(req.body.price);

    if (
      isNaN(battery_capacity_kwh) ||
      isNaN(range_km) ||
      isNaN(price)
    ) {
      return res.status(400).json({
        message: "Invalid number values",
      });
    }

    let battery = null;

    

    // ✅ BATTERY CALCULATION
    if (req.body.current_range_km) {
      battery = calculateBatteryHealth({
        originalRangeKm: range_km,
        currentRangeKm: Number(req.body.current_range_km),
        vehicleAgeYears: new Date().getFullYear() - req.body.year,
        mileageKm: mileage_km,
      });
      console.log("Battery result:", battery); 
    }

    const imagePaths = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    let features = [];

      if (req.body.features) {
        try {
          // frontend sends JSON string → parse it
          features = JSON.parse(req.body.features);
        } catch (err) {
          // fallback if already array
          if (Array.isArray(req.body.features)) {
            features = req.body.features;
          }
        }
      }

    if (typeof features === "string") {
      features = features.split(",").map((f) => f.trim());
    }

    const listed_days = 0;

    const car = await Car.create({
      ...req.body,
      features,
      images: imagePaths,

      battery_capacity_kwh,
      range_km,
      mileage_km,
      price,

      seller: user._id,
      seller_name: user.name,
      seller_type: user.role === "dealer" ? "dealer" : "user",

      status: "pending",
      listed_days,

      battery_health_score:
      req.body.battery_health_score ?? battery?.healthScore,

      battery_health_status:
      req.body.battery_health_status ?? battery?.healthStatus,
    });

    // 🔔 Notify admin about pending approval
    await Notification.create({
      type: "car_pending",
      title: "New Car Pending Approval",
      message: `${user.name} submitted ${req.body.brand} ${req.body.model} for approval`,
      createdBy: user._id,
      relatedCar: car._id,
      forAdmin: true,
    });

    res.status(201).json(car);

  } catch (err) {
    console.error("🔥 CREATE CAR ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE =================
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (
      car.seller.toString() !== req.user._id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    Object.assign(car, req.body);
    await car.save();

    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE =================
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (
      car.seller.toString() !== req.user._id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await car.deleteOne();
    res.json({ message: "Car deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= INQUIRY =================
exports.inquiry = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    car.inquiry_count = (car.inquiry_count || 0) + 1;
    await car.save();

    res.json({ message: "Inquiry recorded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.incrementViewCount = async (req, res) => {
  try {

    const userId = req.user._id;
    const carId = req.params.id;

    // check if already viewed by this user
    const existingView = await CarView.findOne({
      user: userId,
      car: carId,
    });

    if (!existingView) {

      // save view record
      await CarView.create({
        user: userId,
        car: carId,
      });

      // increment actual counter
      await Car.findByIdAndUpdate(
        carId,
        { $inc: { views: 1 } }
      );
    }

    res.json({ success: true });

  } catch (error) {

    console.error("View error:", error);

    res.status(500).json({
      message: "View update failed"
    });

  }
};


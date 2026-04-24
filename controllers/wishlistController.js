const Wishlist = require("../models/Wishlist");

/* ================================
   GET USER WISHLIST
================================ */

const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate("cars")
      .populate("hotels");

    if (!wishlist) {
      wishlist = { cars: [], hotels: [] };
    }

    res.json(wishlist);

  } catch (error) {
    console.error("Wishlist fetch error:", error);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};


/* ================================
   TOGGLE CAR WISHLIST
================================ */

const toggleCarWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        cars: [],
        hotels: [],
      });
    }

    const exists = wishlist.cars.includes(req.params.id);

    if (exists) wishlist.cars.pull(req.params.id);
    else wishlist.cars.push(req.params.id);

    await wishlist.save();

    res.json({
      message: exists
        ? "Car removed from wishlist"
        : "Car added to wishlist",
      wishlist,
    });

  } catch (error) {
    console.error("Toggle car wishlist error:", error);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
};


/* ================================
   TOGGLE HOTEL WISHLIST
================================ */

const toggleHotelWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        cars: [],
        hotels: [],
      });
    }

    const exists = wishlist.hotels.includes(req.params.id);

    if (exists) wishlist.hotels.pull(req.params.id);
    else wishlist.hotels.push(req.params.id);

    await wishlist.save();

    res.json({
      message: exists
        ? "Hotel removed from wishlist"
        : "Hotel added to wishlist",
      wishlist,
    });

  } catch (error) {
    console.error("Toggle hotel wishlist error:", error);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
};


module.exports = {
  getWishlist,
  toggleCarWishlist,
  toggleHotelWishlist,
};
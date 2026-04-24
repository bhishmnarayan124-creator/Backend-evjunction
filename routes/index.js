const authRoutes = require("./authRoutes");
const carRoutes = require("./carRoutes"); // ✅ only this
const chargerRoutes = require("./chargerRoutes");
const adminRoutes = require("./adminRoutes");

module.exports = {
  authRoutes,
  carRoutes, // ✅ correct
  chargerRoutes,
  adminRoutes,
};
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// ================= VERIFY PASSWORD =================
const verifyPassword = async (plain, hashed) => {

  if (!plain || !hashed) {
    throw new Error("Password comparison failed");
  }

  return await bcrypt.compare(plain, hashed);

};


// ================= CREATE ACCESS TOKEN =================
const createAccessToken = (user) => {

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  if (!user || !user._id) {
    throw new Error("Invalid user object for token creation");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),   // ✅ standard JWT subject field
      role: user.role || "user",
      email: user.email || null,
      name: user.name || null, // ✅ FIX
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

};


module.exports = {
  verifyPassword,
  createAccessToken,
};
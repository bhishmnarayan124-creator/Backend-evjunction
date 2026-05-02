const User = require("../models/User");
const { verifyPassword, createAccessToken } = require("../utils/auth");
const { createNotification } = require("../utils/createNotification");
const { updateMonthlyStats } = require("../utils/updateMonthlyStats");
const crypto = require("crypto");
const sendSMS = require("../utils/sendSMS");


// ================= FORMAT USER =================
const formatUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  phone: user.phone || null,
  role: user.role,
  avatar: user.avatar || null,
  city: user.city || null,
  is_active: user.isActive,
  favorites_chargers: user.favoritesChargers || [],
  favorites_cars: user.favoritesCars || [],
  created_at: user.createdAt.toISOString(),
  updated_at: user.updatedAt.toISOString(),
});


// ================= REGISTER =================
exports.register = async (req, res) => {
  try {

    let { email, password, name, phone, city, role } = req.body || {};

    email = email?.toLowerCase().trim();

    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!emailRegex.test(email) || !password || !name) {
      return res.status(400).json({
        message: "Valid email, password and name required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // ✅ ROLE PROTECTION
    const adminExists = await User.exists({ role: "admin" });

    let allowedRoles = ["user", "vendor"];

    if (!adminExists) {
      allowedRoles.push("admin");
    }

    role = allowedRoles.includes(role) ? role : "user";

    // ✅ PASSWORD hashing schema handle karega (no manual hash)

    const user = await User.create({
      email,
      password,
      name,
      phone,
      city,
      role,
    });

    // 🔔 Notify admin
    await createNotification({
      type: "register",
      title: "New user registered",
      message: `${user.name} registered with email ${user.email}`,
      user: user._id,
      forAdmin: true,
    });

    try {
      await updateMonthlyStats("users_registered", 1);
    } catch (statsError) {
      console.error("Monthly stats update failed:", statsError.message);
    }

    const token = createAccessToken(user);

    res.status(201).json({
      access_token: token,
      token_type: "bearer",
      user: formatUser(user),
    });

  } catch (error) {

    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {

    let { email, password } = req.body || {};

    email = email?.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await verifyPassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated",
      });
    }

    user.last_login_at = new Date();
    await user.save();

    if (user.role !== "admin") {
      await createNotification({
        type: "login",
        title: "User login detected",
        message: `${user.name} logged in`,
        user: user._id,
        forAdmin: true,
      });
    }

    const token = createAccessToken(user);

    res.json({
      access_token: token,
      token_type: "bearer",
      user: formatUser(user),
    });

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};


// ================= GET ME =================
exports.getMe = async (req, res) => {
  try {

    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(formatUser(user));

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};


// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  try {

    const allowedFields = ["name", "phone", "city", "avatar"];

    const updates = {};

    Object.keys(req.body || {}).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update",
      });
    }

    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    );

    res.json(formatUser(user));

  } catch (error) {

    res.status(500).json({
      message: "Profile update failed",
      error: error.message,
    });
  }
};


// ================= CHECK ADMIN EXISTS =================
exports.checkAdminExists = async (req, res) => {
  try {

    const adminExists = await User.exists({ role: "admin" });

    res.json({
      adminExists: !!adminExists
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to check admin existence"
    });

  }
};


// ================= SEND RESET OTP =================
exports.forgotPasswordSendOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        message: "Email or phone required",
      });
    }

    const user = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase().trim() }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        message: "No phone number linked with account",
      });
    }

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    await sendSMS(user.phone, `Your OTP is ${otp}`);

    res.json({
      message: "OTP sent successfully",
    });

  } catch (error) {

    console.error("SEND OTP ERROR:", error);

    res.status(500).json({
      message: "Failed to send OTP",
    });

  }
};



// ================= VERIFY RESET OTP =================
exports.forgotPasswordVerifyOTP = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        message: "OTP required",
      });
    }

    const user = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      user.resetOTP !== otp ||
      user.resetOTPExpiry < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // create reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetOTP = null;
    user.resetOTPExpiry = null;

    await user.save();

    res.json({
      reset_token: resetToken,
      account: {
        name: user.name,
        masked_email:
          user.email.slice(0, 2) +
          "******" +
          user.email.slice(-4),
      },
    });

  } catch (error) {

    console.error("VERIFY OTP ERROR:", error);

    res.status(500).json({
      message: "OTP verification failed",
    });

  }
};


// ================= RESET PASSWORD =================
exports.forgotPasswordReset = async (req, res) => {
  try {
    const { reset_token, new_password, email, phone } = req.body;

    if (!new_password) {
      return res.status(400).json({
        message: "New password required",
      });
    }

    const user = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.password = new_password;

    await user.save();

    res.json({
      message: "Password reset successful",
    });

  } catch (error) {

    console.error("RESET PASSWORD ERROR:", error);

    res.status(500).json({
      message: "Password reset failed",
    });

  }
};
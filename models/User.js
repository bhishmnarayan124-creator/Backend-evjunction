const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
    },

    role: {
      type: String,
      enum: ["user", "vendor", "admin"], // ✅ FIXED
      default: "user",
    },

    avatar: {
      type: String,
    },

    city: {
      type: String,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    last_login_at: {
      type: Date, // ✅ ADDED
    },

    favoritesChargers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Charger",
      },
    ],

    favoritesCars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
      },
    ],

    resetPasswordToken: {
  type: String,
},

resetPasswordTokenExpiry: {
  type: Date,
},
  },
  {
    timestamps: true,
  }
);

// 🔐 HASH PASSWORD
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔒 REMOVE PASSWORD FROM RESPONSE
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const tripRoutes = require("./routes/tripRoutes");
const http = require("http");
const { Server } = require("socket.io");
const notificationRoutes = require("./routes/notificationRoutes");
// Load env
dotenv.config();

// Create app
const app = express();
const server = http.createServer(app);


// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") || "*",
    credentials: true,
  },
});

// Socket connection
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_admin", () => {
    socket.join("admin_room");
    console.log("Admin joined admin_room");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// expose globally
global.io = io;
app.set("io", io);


// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") || "*",
  credentials: true,
}));
app.use(morgan("dev"));

app.use("/uploads", express.static("uploads"));
// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Routes
const {
  authRoutes,
  carRoutes,
  chargerRoutes,
  adminRoutes,
} = require("./routes");

const hotelRoutes = require("./routes/hotelRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/ev-cars", carRoutes);
app.use("/api/chargers", chargerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/trip", tripRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/wishlist", wishlistRoutes);



// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "EVJunctions API",
  });
});

// Root
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to EVJunctions API",
    endpoints: {
      auth: "/api/auth",
      chargers: "/api/chargers",
      ev_cars: "/api/ev-cars",
      admin: "/api/admin",
    },
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
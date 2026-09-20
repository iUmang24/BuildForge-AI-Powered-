require("dotenv").config();
const pool = require("./config/db");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Routes
const studentRoutes = require("./routes/student");
const stateRoutes = require("./routes/state");
const universityRoutes = require("./routes/university");
const collegeRoutes = require("./routes/college");
const projectRoutes = require("./routes/project");
const otpRoutes = require("./routes/otp")
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");
const supportRoutes = require("./routes/support");
const maintenanceMiddleware = require("./middlewares/maintenence");


// Create app
const app = express();

// 🔥 REQUIRED FOR COOKIES BEHIND PROXY (AWS, Vercel, etc.)
app.set("trust proxy", 1);

// Middlewares

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://interntrack.vercel.app",
      "https://buildforge-fe.vercel.app",
      "https://test.buildforge.net.in",
      "https://www.buildforge.net.in",
      "https://buildforge.net.in",
    ], // frontend URL
    credentials: true,               // 🔥 REQUIRED
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check (optional but recommended)
app.get("/health", async(req, res) => {
  const [[setting]] = await pool.query(
    `SELECT setting_value FROM app_settings WHERE setting_key='maintenance_mode'`
  );

  if (setting?.setting_value === "on") {
    return res.status(503).json({
      code: "MAINTENANCE"
    });
  }
  res.status(200).json({ status: "OK" });
});

app.use(maintenanceMiddleware);

app.use((req, res, next) => {
  console.log(
    `📥 ${req.method} ${req.originalUrl} | Auth: ${
      req.headers.authorization ? "YES" : "NO"
    }`
  );
  next();
});



// Routes registration
app.use("/students", studentRoutes);
app.use("/states", stateRoutes);
app.use("/universities", universityRoutes);
app.use("/colleges", collegeRoutes);
app.use("/projects", projectRoutes);
app.use("/otp", otpRoutes);
app.use("/payments", paymentRoutes);
app.use("/support", supportRoutes);


// Admin
app.use("/admin", adminRoutes);



// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: "R02",
    message: "API route not found",
  });
});

module.exports = app;

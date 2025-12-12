// ===============================
// SERVER.JS — FINAL FOR RAILWAY
// ===============================

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { connect } = require("./db");
const Material = require("./models/Material");
const Tenaga = require("./models/Tenaga");
const Pekerjaan = require("./models/Pekerjaan");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// -------------------------------------------
// CONNECT TO MONGODB ON STARTUP (ONE TIME ONLY)
// -------------------------------------------
(async () => {
  try {
    await connect();
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
})();

// -------------------------------------------
// API: MATERIALS
// -------------------------------------------
app.get("/api/materials", async (req, res) => {
  try {
    const data = await Material.find({}).lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load materials" });
  }
});

// -------------------------------------------
// API: TENAGA
// -------------------------------------------
app.get("/api/tenaga", async (req, res) => {
  try {
    const data = await Tenaga.find({}).lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load tenaga" });
  }
});

// -------------------------------------------
// API: PEKERJAAN
// -------------------------------------------
app.get("/api/pekerjaan", async (req, res) => {
  try {
    const data = await Pekerjaan.find({}).lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load pekerjaan" });
  }
});

// -------------------------------------------
// START SERVER (RAILWAY USES DYNAMIC PORT)
// -------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Backend API running on port", PORT);
});

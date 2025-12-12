const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_replace_me";
const SALT_ROUNDS = 10;

// register (for initial setup — protect in production)
router.post("/register", async (req, res) => {
  try {
    const { username, password, role = "user" } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username & password required" });

    const exist = await User.findOne({ username }).lean();
    if (exist) return res.status(400).json({ message: "username exists" });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const u = new User({ username, passwordHash: hash, role });
    await u.save();
    res.json({ ok: true, id: u._id });
  } catch (err) {
    console.error("POST /api/auth/register err:", err);
    res.status(500).json({ message: "Failed to register" });
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username & password required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id.toString(), username: user.username, role: user.role } });
  } catch (err) {
    console.error("POST /api/auth/login err:", err);
    res.status(500).json({ message: "Login error" });
  }
});

// me
router.get("/me", authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

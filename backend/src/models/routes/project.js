const express = require("express");
const Project = require("../models/Project");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// POST /api/project  (save multi project) — requires auth
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, items = [], hasil = {} } = req.body;
    const p = new Project({ userId, name: name || "Proyek", items, hasil });
    await p.save();
    res.json({ ok: true, id: p._id });
  } catch (err) {
    console.error("POST /api/project err:", err);
    res.status(500).json({ message: "Failed to save project" });
  }
});

// GET /api/project/mine
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const list = await Project.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error("GET /api/project/mine err:", err);
    res.status(500).json({ message: "Failed to load projects" });
  }
});

// GET /api/project/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await Project.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(doc);
  } catch (err) {
    console.error("GET /api/project/:id err:", err);
    res.status(500).json({ message: "Failed to load project" });
  }
});

// DELETE /api/project/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await Project.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await doc.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/project/:id err:", err);
    res.status(500).json({ message: "Failed to delete" });
  }
});

module.exports = router;

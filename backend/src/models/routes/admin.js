const express = require("express");
const Material = require("../models/Material");
const Tenaga = require("../models/Tenaga");
const Pekerjaan = require("../models/Pekerjaan");
const Project = require("../models/Project");
const User = require("../models/User");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// MATERIALS CRUD
router.post("/materials", authMiddleware, requireAdmin, async (req,res)=>{ /* create */ });
router.put("/materials/:id", authMiddleware, requireAdmin, async (req,res)=>{ /* update */ });
router.delete("/materials/:id", authMiddleware, requireAdmin, async (req,res)=>{ /* delete */ });

// PEKERJAAN CRUD
// TENAGA CRUD
// USERS CRUD
// ADMIN PROJECTS (list all, delete)

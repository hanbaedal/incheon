"use strict";

const express = require("express");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const { requireStaff } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/admin/all",
  requireStaff,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.targetType) filter.targetType = req.query.targetType;
    if (req.query.q) {
      const q = String(req.query.q).trim();
      filter.$or = [
        { summary: new RegExp(q, "i") },
        { actorUsername: new RegExp(q, "i") },
        { actorName: new RegExp(q, "i") },
        { targetId: new RegExp(q, "i") },
      ];
    }
    const limit = Math.min(200, Math.max(20, parseInt(req.query.limit, 10) || 80));
    const items = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json({ items: items.map((x) => x.toJSONSafe()) });
  })
);

module.exports = router;

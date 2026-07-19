"use strict";

const express = require("express");
const Shroud = require("../models/Shroud");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await Shroud.find({ active: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ items: items.map((s) => s.toJSONSafe()) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await Shroud.find({}).sort({ sortOrder: 1, name: 1 });
    res.json({ items: items.map((s) => s.toJSONSafe()) });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: "상품명을 입력해 주세요." });
    const doc = await Shroud.create(req.body);
    res.status(201).json({ item: doc.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "name", "material", "weaveType", "yarnOrigin", "fabricOrigin",
      "price", "unit", "description", "imageId", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    const doc = await Shroud.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "수의 품목을 찾을 수 없습니다." });
    res.json({ item: doc.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await Shroud.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "수의 품목을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

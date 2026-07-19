"use strict";

const express = require("express");
const ServicePrice = require("../models/ServicePrice");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.orderable === "1") filter.orderable = true;
    const items = await ServicePrice.find(filter).sort({ sortOrder: 1, group: 1, name: 1 });
    res.json({ items: items.map((s) => s.toJSONSafe()) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await ServicePrice.find({}).sort({ sortOrder: 1, group: 1, name: 1 });
    res.json({ items: items.map((s) => s.toJSONSafe()) });
  })
);

router.post(
  "/admin/sync",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { upsertServicePrices } = require("../utils/ensureServicePrices");
    const result = await upsertServicePrices();
    const items = await ServicePrice.find({ active: true }).sort({ sortOrder: 1, group: 1, name: 1 });
    res.json({ ok: true, result, items: items.map((s) => s.toJSONSafe()) });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { group, name } = req.body || {};
    if (!group || !name) {
      return res.status(400).json({ error: "구분과 항목명을 입력해 주세요." });
    }
    const doc = await ServicePrice.create(req.body);
    res.status(201).json({ item: doc.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "group", "name", "unit", "price", "note", "settlementType",
      "orderable", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    const doc = await ServicePrice.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "서비스 요금 항목을 찾을 수 없습니다." });
    res.json({ item: doc.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await ServicePrice.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "서비스 요금 항목을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

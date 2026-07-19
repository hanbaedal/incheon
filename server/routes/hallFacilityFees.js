"use strict";

const express = require("express");
const HallFacilityFee = require("../models/HallFacilityFee");
const { upsertHallFacilityFees } = require("../utils/ensureHallFacilityFees");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

async function listFees(filter) {
  const count = await HallFacilityFee.countDocuments(filter);
  if (count === 0) await upsertHallFacilityFees();
  const items = await HallFacilityFee.find(filter).sort({ sortOrder: 1, group: 1 });
  return items.map((f) => f.toJSONSafe());
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.orderable === "1") filter.orderable = true;
    res.json({ items: await listFees(filter) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ items: await listFees({}) });
  })
);

router.post(
  "/admin/sync",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await upsertHallFacilityFees();
    const items = await HallFacilityFee.find({ active: true }).sort({ sortOrder: 1, group: 1 });
    res.json({ ok: true, result, items: items.map((f) => f.toJSONSafe()) });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { code, group } = req.body || {};
    if (!code || !group) return res.status(400).json({ error: "코드와 구분을 입력해 주세요." });
    const doc = await HallFacilityFee.create(req.body);
    res.status(201).json({ item: doc.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "code", "group", "name", "unit", "price", "note", "settlementType",
      "orderable", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    const doc = await HallFacilityFee.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "시설 사용료 항목을 찾을 수 없습니다." });
    res.json({ item: doc.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await HallFacilityFee.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "시설 사용료 항목을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

"use strict";

const express = require("express");
const HearseItem = require("../models/HearseItem");
const { HEARSE_CATEGORIES } = require("../constants/hearseCategories");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.hearseCategory) filter.hearseCategory = req.query.hearseCategory;
    const items = await HearseItem.find(filter).sort({ hearseCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((h) => h.toJSONSafe()) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.hearseCategory) filter.hearseCategory = req.query.hearseCategory;
    const items = await HearseItem.find(filter).sort({ hearseCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((h) => h.toJSONSafe()) });
  })
);

router.post(
  "/admin/sync-amc",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { upsertHearseItems } = require("../utils/ensureCatalog");
    const r = await upsertHearseItems();
    res.json({ ok: true, message: `운구·차량 ${r.total}건 동기화 (신규 ${r.created})`, ...r });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { hearseCategory, name } = req.body || {};
    if (!hearseCategory || !name) {
      return res.status(400).json({ error: "카테고리와 차량명을 입력해 주세요." });
    }
    if (!HEARSE_CATEGORIES.includes(hearseCategory)) {
      return res.status(400).json({ error: "유효하지 않은 운구·차량 카테고리입니다." });
    }
    const doc = await HearseItem.create(req.body);
    res.status(201).json({ item: doc.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "hearseCategory", "name", "spec", "description", "price", "unit",
      "imageId", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    if (update.hearseCategory && !HEARSE_CATEGORIES.includes(update.hearseCategory)) {
      return res.status(400).json({ error: "유효하지 않은 운구·차량 카테고리입니다." });
    }
    const doc = await HearseItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "운구·차량 품목을 찾을 수 없습니다." });
    res.json({ item: doc.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await HearseItem.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "운구·차량 품목을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

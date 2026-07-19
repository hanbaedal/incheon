"use strict";

const express = require("express");
const FlowerItem = require("../models/FlowerItem");
const { FLOWER_CATEGORIES } = require("../constants/flowerCategories");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.flowerCategory) filter.flowerCategory = req.query.flowerCategory;
    const items = await FlowerItem.find(filter).sort({ flowerCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((f) => f.toJSONSafe()) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.flowerCategory) filter.flowerCategory = req.query.flowerCategory;
    const items = await FlowerItem.find(filter).sort({ flowerCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((f) => f.toJSONSafe()) });
  })
);

router.post(
  "/admin/sync-amc",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { upsertFlowerItems } = require("../utils/ensureCatalog");
    const r = await upsertFlowerItems();
    res.json({ ok: true, message: `근조 화환 ${r.total}건 동기화 (신규 ${r.created})`, ...r });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { flowerCategory, name } = req.body || {};
    if (!flowerCategory || !name) {
      return res.status(400).json({ error: "카테고리와 품명을 입력해 주세요." });
    }
    if (!FLOWER_CATEGORIES.includes(flowerCategory)) {
      return res.status(400).json({ error: "유효하지 않은 화환 카테고리입니다." });
    }
    const doc = await FlowerItem.create(req.body);
    res.status(201).json({ item: doc.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "flowerCategory", "name", "spec", "description", "price", "unit",
      "imageId", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    if (update.flowerCategory && !FLOWER_CATEGORIES.includes(update.flowerCategory)) {
      return res.status(400).json({ error: "유효하지 않은 화환 카테고리입니다." });
    }
    const doc = await FlowerItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "화환 품목을 찾을 수 없습니다." });
    res.json({ item: doc.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await FlowerItem.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "화환 품목을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

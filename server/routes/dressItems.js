"use strict";

const express = require("express");
const DressItem = require("../models/DressItem");
const { DRESS_CATEGORIES } = require("../constants/dressCategories");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.dressCategory) filter.dressCategory = req.query.dressCategory;
    const items = await DressItem.find(filter).sort({ dressCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((d) => d.toJSONSafe()) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.dressCategory) filter.dressCategory = req.query.dressCategory;
    const items = await DressItem.find(filter).sort({ dressCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((d) => d.toJSONSafe()) });
  })
);

router.post(
  "/admin/sync-amc",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { upsertDressItems } = require("../utils/ensureCatalog");
    const r = await upsertDressItems();
    res.json({ ok: true, message: `상복 대여 ${r.total}건 동기화 (신규 ${r.created})`, ...r });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { dressCategory, name } = req.body || {};
    if (!dressCategory || !name) {
      return res.status(400).json({ error: "카테고리와 품목을 입력해 주세요." });
    }
    if (!DRESS_CATEGORIES.includes(dressCategory)) {
      return res.status(400).json({ error: "유효하지 않은 상복 카테고리입니다." });
    }
    const doc = await DressItem.create(req.body);
    res.status(201).json({ item: doc.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "dressCategory", "name", "spec", "description", "price", "unit",
      "imageId", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    if (update.dressCategory && !DRESS_CATEGORIES.includes(update.dressCategory)) {
      return res.status(400).json({ error: "유효하지 않은 상복 카테고리입니다." });
    }
    const doc = await DressItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "상복 품목을 찾을 수 없습니다." });
    res.json({ item: doc.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await DressItem.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "상복 품목을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

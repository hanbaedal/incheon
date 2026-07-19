"use strict";

const express = require("express");
const PhotoItem = require("../models/PhotoItem");
const { PHOTO_CATEGORIES } = require("../constants/photoCategories");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.photoCategory) filter.photoCategory = req.query.photoCategory;
    const items = await PhotoItem.find(filter).sort({ photoCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((p) => p.toJSONSafe()) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.photoCategory) filter.photoCategory = req.query.photoCategory;
    const items = await PhotoItem.find(filter).sort({ photoCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((p) => p.toJSONSafe()) });
  })
);

router.post(
  "/admin/sync-amc",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { upsertPhotoItems } = require("../utils/ensureCatalog");
    const r = await upsertPhotoItems();
    res.json({ ok: true, message: `영정 사진 ${r.total}건 동기화 (신규 ${r.created})`, ...r });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { photoCategory, name } = req.body || {};
    if (!photoCategory || !name) {
      return res.status(400).json({ error: "카테고리와 품명을 입력해 주세요." });
    }
    if (!PHOTO_CATEGORIES.includes(photoCategory)) {
      return res.status(400).json({ error: "유효하지 않은 사진 카테고리입니다." });
    }
    const doc = await PhotoItem.create(req.body);
    res.status(201).json({ item: doc.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "photoCategory", "name", "subGroup", "spec", "description", "price", "unit",
      "imageId", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    if (update.photoCategory && !PHOTO_CATEGORIES.includes(update.photoCategory)) {
      return res.status(400).json({ error: "유효하지 않은 사진 카테고리입니다." });
    }
    const doc = await PhotoItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "사진 품목을 찾을 수 없습니다." });
    res.json({ item: doc.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await PhotoItem.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "사진 품목을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

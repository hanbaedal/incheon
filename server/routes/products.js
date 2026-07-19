"use strict";

const express = require("express");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");
const { CAT_KEYS, CAT_LABELS } = require("../constants/categories");

const router = express.Router();

// 공개: 판매 중 상품 목록
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.catKey) filter.catKey = req.query.catKey;
    const items = await Product.find(filter).sort({ catKey: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((p) => p.toJSONSafe()) });
  })
);

// 공개: 카테고리 목록
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    res.json({
      items: CAT_KEYS.map((key) => ({ key, label: CAT_LABELS[key] || key })),
    });
  })
);

// 관리자: 전체 상품
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await Product.find({}).sort({ catKey: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((p) => p.toJSONSafe()) });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { category, catKey, name, price } = req.body || {};
    if (!category || !catKey || !name || price == null) {
      return res.status(400).json({ error: "분류, 카테고리, 상품명, 가격을 입력해 주세요." });
    }
    if (!CAT_KEYS.includes(catKey)) {
      return res.status(400).json({ error: "유효하지 않은 카테고리입니다." });
    }
    const p = await Product.create(req.body);
    res.status(201).json({ product: p.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "category", "catKey", "name", "description", "price", "unit",
      "image", "imageId", "settlementType", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    if (update.catKey && !CAT_KEYS.includes(update.catKey)) {
      return res.status(400).json({ error: "유효하지 않은 카테고리입니다." });
    }
    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    res.json({ product: p.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await Product.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

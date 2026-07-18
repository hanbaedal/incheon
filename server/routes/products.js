"use strict";

const express = require("express");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// 공개: 판매 중 상품 목록
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    const items = await Product.find(filter).sort({ category: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((p) => p.toJSONSafe()) });
  })
);

// 관리자: 전체 상품
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await Product.find({}).sort({ category: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((p) => p.toJSONSafe()) });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { category, name, price } = req.body || {};
    if (!category || !name || price == null) {
      return res.status(400).json({ error: "분류, 상품명, 가격을 입력해 주세요." });
    }
    const p = await Product.create(req.body);
    res.status(201).json({ product: p.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = ["category", "name", "description", "price", "unit", "image", "taxable", "active", "sortOrder"];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
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

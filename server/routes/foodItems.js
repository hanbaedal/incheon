"use strict";

const express = require("express");
const FoodItem = require("../models/FoodItem");
const { FOOD_CATEGORIES } = require("../constants/foodCategories");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.foodCategory) filter.foodCategory = req.query.foodCategory;
    const items = await FoodItem.find(filter).sort({ foodCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((f) => f.toJSONSafe()) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.foodCategory) filter.foodCategory = req.query.foodCategory;
    const items = await FoodItem.find(filter).sort({ foodCategory: 1, sortOrder: 1, name: 1 });
    res.json({ items: items.map((f) => f.toJSONSafe()) });
  })
);

router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { foodCategory, name } = req.body || {};
    if (!foodCategory || !name) {
      return res.status(400).json({ error: "카테고리와 품명을 입력해 주세요." });
    }
    if (!FOOD_CATEGORIES.includes(foodCategory)) {
      return res.status(400).json({ error: "유효하지 않은 음식 카테고리입니다." });
    }
    const doc = await FoodItem.create(req.body);
    res.status(201).json({ item: doc.toJSONSafe() });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = [
      "foodCategory", "name", "subGroup", "spec", "description", "price", "unit",
      "settlementType", "imageId", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    if (update.foodCategory && !FOOD_CATEGORIES.includes(update.foodCategory)) {
      return res.status(400).json({ error: "유효하지 않은 음식 카테고리입니다." });
    }
    const doc = await FoodItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: "음식 품목을 찾을 수 없습니다." });
    res.json({ item: doc.toJSONSafe() });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await FoodItem.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "음식 품목을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

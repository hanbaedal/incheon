"use strict";

const express = require("express");
const DressItem = require("../models/DressItem");
const { DRESS_ITEM_NAMES } = require("../constants/dressCategories");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

function sortDressItems(items) {
  const order = new Map(DRESS_ITEM_NAMES.map((n, i) => [n, i]));
  return items.slice().sort((a, b) => {
    const ao = order.has(a.name) ? order.get(a.name) : 999;
    const bo = order.has(b.name) ? order.get(b.name) : 999;
    if (ao !== bo) return ao - bo;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return String(a.spec).localeCompare(String(b.spec), "ko");
  });
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.name) filter.name = req.query.name;
    const items = sortDressItems(await DressItem.find(filter));
    res.json({ items: items.map((d) => d.toJSONSafe()) });
  })
);

router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.name) filter.name = req.query.name;
    const items = sortDressItems(await DressItem.find(filter));
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
    const { name, spec } = req.body || {};
    if (!name || spec == null || spec === "") {
      return res.status(400).json({ error: "품목과 치수를 입력해 주세요." });
    }
    if (!DRESS_ITEM_NAMES.includes(name)) {
      return res.status(400).json({ error: "유효하지 않은 상복 품목입니다." });
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
      "name", "spec", "description", "price", "unit",
      "imageId", "taxable", "active", "sortOrder",
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    if (update.name && !DRESS_ITEM_NAMES.includes(update.name)) {
      return res.status(400).json({ error: "유효하지 않은 상복 품목입니다." });
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

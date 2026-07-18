"use strict";

const express = require("express");
const Notice = require("../models/Notice");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// 공개: 목록 (고정글 우선, 최신순)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10", 10)));
    const filter = { published: true };
    const [items, total] = await Promise.all([
      Notice.find(filter)
        .sort({ pinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notice.countDocuments(filter),
    ]);
    res.json({
      items: items.map((n) => n.toJSONSafe()),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  })
);

// 관리자: 전체 목록 (미공개 포함)
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await Notice.find({}).sort({ pinned: -1, createdAt: -1 });
    res.json({ items: items.map((n) => n.toJSONSafe()) });
  })
);

// 공개: 상세 (조회수 증가)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.id, published: true },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!notice) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    res.json({ notice: notice.toJSONSafe() });
  })
);

// 관리자: 생성
router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { title, content, category, pinned, published } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: "제목과 내용을 입력해 주세요." });
    const notice = await Notice.create({
      title,
      content,
      category: category || "공지",
      pinned: !!pinned,
      published: published !== false,
      author: req.user.name || "관리자",
    });
    res.status(201).json({ notice: notice.toJSONSafe() });
  })
);

// 관리자: 수정
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const allowed = ["title", "content", "category", "pinned", "published"];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    const notice = await Notice.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!notice) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    res.json({ notice: notice.toJSONSafe() });
  })
);

// 관리자: 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await Notice.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

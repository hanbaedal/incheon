"use strict";

const express = require("express");
const Inquiry = require("../models/Inquiry");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// 공개: 목록 (비공개글은 제목 마스킹)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10", 10)));
    const [items, total] = await Promise.all([
      Inquiry.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Inquiry.countDocuments({}),
    ]);
    res.json({
      items: items.map((i) => i.toListJSON()),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  })
);

// 공개: 등록
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, phone, email, category, title, message, isPrivate, password } = req.body || {};
    if (!name || !title || !message) {
      return res.status(400).json({ error: "이름, 제목, 내용을 입력해 주세요." });
    }
    const inquiry = new Inquiry({
      name,
      phone: phone || "",
      email: email || "",
      category: category || "일반문의",
      title,
      message,
      isPrivate: !!isPrivate,
    });
    if (password) await inquiry.setPassword(password);
    await inquiry.save();
    res.status(201).json({ id: inquiry._id, ok: true });
  })
);

// 공개: 상세 조회 (비공개글은 비밀번호 필요 / 관리자는 무조건 열람)
router.post(
  "/:id/view",
  asyncHandler(async (req, res) => {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: "문의를 찾을 수 없습니다." });

    const isAdmin = req.user && req.user.role === "admin";
    if (inquiry.isPrivate && !isAdmin) {
      const ok = await inquiry.verifyPassword((req.body || {}).password);
      if (!ok) return res.status(403).json({ error: "비밀번호가 일치하지 않습니다." });
    }
    res.json({ inquiry: isAdmin ? inquiry.toAdminJSON() : inquiry.toDetailJSON() });
  })
);

// 관리자: 전체 목록(연락처 포함)
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = req.query.status;
    const filter = status ? { status } : {};
    const items = await Inquiry.find(filter).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toAdminJSON()) });
  })
);

// 관리자: 답변/상태 수정
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { answer, status } = req.body || {};
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: "문의를 찾을 수 없습니다." });
    if (typeof answer === "string") {
      inquiry.answer = answer;
      inquiry.answeredAt = new Date();
      if (!status) inquiry.status = "answered";
    }
    if (status) inquiry.status = status;
    await inquiry.save();
    res.json({ inquiry: inquiry.toAdminJSON() });
  })
);

// 관리자: 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await Inquiry.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "문의를 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

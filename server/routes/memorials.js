"use strict";

const express = require("express");
const Memorial = require("../models/Memorial");
const Hall = require("../models/Hall");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// 공개: 특정 빈소의 추모글 목록
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { hallId } = req.query;
    if (!hallId) return res.status(400).json({ error: "hallId 가 필요합니다." });
    const items = await Memorial.find({ hallId, hidden: false }).sort({ createdAt: -1 });
    res.json({ items: items.map((m) => m.toJSONSafe()) });
  })
);

// 관리자: 전체 추모글 (숨김 포함, 빈소 정보 병합)
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await Memorial.find({}).sort({ createdAt: -1 }).populate("hallId", "hallNumber deceasedName");
    res.json({
      items: items.map((m) => ({
        ...m.toJSONSafe(),
        hall: m.hallId ? { id: m.hallId._id, hallNumber: m.hallId.hallNumber, deceasedName: m.hallId.deceasedName } : null,
      })),
    });
  })
);

// 공개: 추모글 등록
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { hallId, author, relation, message, type, password } = req.body || {};
    if (!hallId || !author || !message) {
      return res.status(400).json({ error: "빈소, 작성자, 추모 내용을 입력해 주세요." });
    }
    const hall = await Hall.findById(hallId);
    if (!hall) return res.status(404).json({ error: "해당 빈소를 찾을 수 없습니다." });

    const memorial = new Memorial({
      hallId,
      author,
      relation: relation || "",
      message,
      type: type === "flower" ? "flower" : "condolence",
    });
    if (password) await memorial.setPassword(password);
    await memorial.save();
    res.status(201).json({ memorial: memorial.toJSONSafe() });
  })
);

// 공개: 작성자 비밀번호로 삭제 (또는 관리자)
router.post(
  "/:id/delete",
  asyncHandler(async (req, res) => {
    const memorial = await Memorial.findById(req.params.id);
    if (!memorial) return res.status(404).json({ error: "추모글을 찾을 수 없습니다." });

    const isAdmin = req.user && req.user.role === "admin";
    if (!isAdmin) {
      const ok = await memorial.verifyPassword((req.body || {}).password);
      if (!ok) return res.status(403).json({ error: "비밀번호가 일치하지 않습니다." });
    }
    await memorial.deleteOne();
    res.json({ ok: true });
  })
);

// 관리자: 숨김/표시 토글
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const memorial = await Memorial.findById(req.params.id);
    if (!memorial) return res.status(404).json({ error: "추모글을 찾을 수 없습니다." });
    if ("hidden" in (req.body || {})) memorial.hidden = !!req.body.hidden;
    await memorial.save();
    res.json({ memorial: memorial.toJSONSafe() });
  })
);

// 관리자: 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await Memorial.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "추모글을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

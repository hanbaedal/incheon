"use strict";

const express = require("express");
const Memorial = require("../models/Memorial");
const HallUsage = require("../models/HallUsage");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");
const { usageToHallSummary } = require("../utils/hallFormat");

const router = express.Router();

function resolveUsageId(query, body) {
  return query.hallUsageId || query.hallId || body.hallUsageId || body.hallId || null;
}

// 공개: 특정 빈소 이용의 추모글 목록
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const hallUsageId = resolveUsageId(req.query, {});
    if (!hallUsageId) return res.status(400).json({ error: "hallUsageId 가 필요합니다." });
    const items = await Memorial.find({ hallUsageId, hidden: false }).sort({ createdAt: -1 });
    res.json({ items: items.map((m) => m.toJSONSafe()) });
  })
);

// 관리자: 전체 추모글 (숨김 포함, 빈소 이용 정보 병합)
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await Memorial.find({})
      .sort({ createdAt: -1 })
      .populate({ path: "hallUsageId", populate: { path: "hallId" } });
    res.json({
      items: items.map((m) => ({
        ...m.toJSONSafe(),
        hall: usageToHallSummary(m.hallUsageId, m.hallUsageId && m.hallUsageId.hallId),
      })),
    });
  })
);

// 공개: 추모글 등록
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const hallUsageId = resolveUsageId({}, body);
    const { author, relation, message, type, password } = body;
    if (!hallUsageId || !author || !message) {
      return res.status(400).json({ error: "빈소, 작성자, 추모 내용을 입력해 주세요." });
    }
    const usage = await HallUsage.findById(hallUsageId);
    if (!usage || usage.status !== "active") {
      return res.status(404).json({ error: "해당 빈소를 찾을 수 없습니다." });
    }

    const memorial = new Memorial({
      hallUsageId,
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

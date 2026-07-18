"use strict";

const express = require("express");
const Hall = require("../models/Hall");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

function genFamilyCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// 공개: 빈소 현황 (민감정보 제외)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const halls = await Hall.find(filter).sort({ hallNumber: 1 });
    res.json({ items: halls.map((h) => h.toPublicJSON()) });
  })
);

// 공개: 빈소 검색 (고인명/상주명/호실)
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ items: [] });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const halls = await Hall.find({
      status: "in-use",
      $or: [{ deceasedName: rx }, { chiefMourner: rx }, { hallNumber: rx }],
    }).sort({ hallNumber: 1 });
    res.json({ items: halls.map((h) => h.toPublicJSON()) });
  })
);

// 관리자: 전체 목록 (familyCode 포함)
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const halls = await Hall.find({}).sort({ hallNumber: 1 });
    res.json({ items: halls.map((h) => h.toAdminJSON()) });
  })
);

// 관리자: 빈소 등록
router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.hallNumber) return res.status(400).json({ error: "호실명을 입력해 주세요." });
    const hall = new Hall(body);
    if (hall.status === "in-use" && !hall.familyCode) hall.familyCode = genFamilyCode();
    await hall.save();
    res.status(201).json({ hall: hall.toAdminJSON() });
  })
);

// 관리자: 빈소 수정
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const hall = await Hall.findById(req.params.id);
    if (!hall) return res.status(404).json({ error: "빈소를 찾을 수 없습니다." });

    const allowed = [
      "hallNumber", "deceasedName", "chiefMourner", "relationship", "age",
      "enshrinedAt", "funeralDate", "funeralTime", "burialSite", "status", "familyCode",
    ];
    for (const k of allowed) if (k in (req.body || {})) hall[k] = req.body[k];

    if (hall.status === "in-use" && !hall.familyCode) hall.familyCode = genFamilyCode();
    if (hall.status === "available") {
      // 발인 완료(비어있음) 처리 시 고인/상주 정보 및 코드 정리
      hall.familyCode = "";
    }
    await hall.save();
    res.json({ hall: hall.toAdminJSON() });
  })
);

// 관리자: 빈소 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await Hall.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "빈소를 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

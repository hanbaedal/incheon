"use strict";

const express = require("express");
const Hall = require("../models/Hall");
const HallRequest = require("../models/HallRequest");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin, requireFamily } = require("../middleware/auth");

const router = express.Router();

function genFamilyCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// 상주: 신청 가능한 빈소 목록
router.get(
  "/available",
  requireFamily,
  asyncHandler(async (req, res) => {
    const halls = await Hall.find({ status: "available" }).sort({ hallNumber: 1 });
    res.json({ items: halls.map((h) => h.toPublicJSON()) });
  })
);

// 상주: 빈소 신청
router.post(
  "/",
  requireFamily,
  asyncHandler(async (req, res) => {
    const { hallId } = req.body || {};
    if (!hallId) return res.status(400).json({ error: "신청할 빈소를 선택해 주세요." });

    const me = await User.findById(req.user.uid);
    if (!me) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    if (me.hallId) return res.status(400).json({ error: "이미 빈소가 배정되어 있습니다." });

    const pending = await HallRequest.findOne({ familyUserId: me._id, status: "pending" });
    if (pending) return res.status(400).json({ error: "이미 처리 대기 중인 빈소 신청이 있습니다." });

    const hall = await Hall.findById(hallId);
    if (!hall) return res.status(404).json({ error: "빈소를 찾을 수 없습니다." });
    if (hall.status !== "available") return res.status(400).json({ error: "선택한 빈소는 현재 사용할 수 없습니다." });

    const reqDoc = await HallRequest.create({ familyUserId: me._id, hallId: hall._id });
    res.status(201).json({ request: reqDoc.toJSONSafe() });
  })
);

// 상주: 내 빈소 신청 내역
router.get(
  "/mine",
  requireFamily,
  asyncHandler(async (req, res) => {
    const items = await HallRequest.find({ familyUserId: req.user.uid })
      .sort({ createdAt: -1 })
      .populate("hallId", "hallNumber deceasedName status");
    res.json({
      items: items.map((r) => ({
        ...r.toJSONSafe(),
        hall: r.hallId
          ? { id: r.hallId._id, hallNumber: r.hallId.hallNumber, deceasedName: r.hallId.deceasedName, status: r.hallId.status }
          : null,
      })),
    });
  })
);

// 관리자: 전체 빈소 신청
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await HallRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("familyUserId", "name username phone")
      .populate("hallId", "hallNumber deceasedName status");
    res.json({
      items: items.map((r) => ({
        ...r.toJSONSafe(),
        family: r.familyUserId
          ? { id: r.familyUserId._id, name: r.familyUserId.name, username: r.familyUserId.username, phone: r.familyUserId.phone }
          : null,
        hall: r.hallId
          ? { id: r.hallId._id, hallNumber: r.hallId.hallNumber, deceasedName: r.hallId.deceasedName, status: r.hallId.status }
          : null,
      })),
    });
  })
);

// 관리자: 빈소 신청 승인/거절
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, note } = req.body || {};
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "승인(approved) 또는 거절(rejected)만 가능합니다." });
    }

    const reqDoc = await HallRequest.findById(req.params.id)
      .populate("familyUserId")
      .populate("hallId");
    if (!reqDoc) return res.status(404).json({ error: "빈소 신청을 찾을 수 없습니다." });
    if (reqDoc.status !== "pending") return res.status(400).json({ error: "이미 처리된 신청입니다." });

    if (status === "approved") {
      const hall = reqDoc.hallId;
      const family = reqDoc.familyUserId;
      if (!hall || !family) return res.status(400).json({ error: "신청 정보가 올바르지 않습니다." });
      if (hall.status !== "available") return res.status(400).json({ error: "해당 빈소는 더 이상 비어있지 않습니다." });
      if (family.hallId) return res.status(400).json({ error: "해당 상주에게 이미 빈소가 배정되어 있습니다." });

      hall.status = "in-use";
      if (!hall.familyCode) hall.familyCode = genFamilyCode();
      await hall.save();

      family.hallId = hall._id;
      await family.save();

      await HallRequest.updateMany(
        { _id: { $ne: reqDoc._id }, familyUserId: family._id, status: "pending" },
        { status: "rejected", note: "다른 빈소 신청이 승인되어 자동 거절", decidedAt: new Date() }
      );
    }

    reqDoc.status = status;
    reqDoc.note = typeof note === "string" ? note : reqDoc.note;
    reqDoc.decidedAt = new Date();
    await reqDoc.save();

    res.json({ request: reqDoc.toJSONSafe() });
  })
);

module.exports = router;

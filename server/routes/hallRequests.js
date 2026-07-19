"use strict";

const express = require("express");
const Hall = require("../models/Hall");
const HallUsage = require("../models/HallUsage");
const HallRequest = require("../models/HallRequest");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin, requireFamily } = require("../middleware/auth");
const { computeHallAvailability } = require("../utils/hallAvailability");

const router = express.Router();

function genFamilyCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// 상주: 신청 가능한 빈소 규격 목록 + 가능 일자
router.get(
  "/available",
  requireFamily,
  asyncHandler(async (req, res) => {
    const availability = await computeHallAvailability();
    res.json(availability);
  })
);

// 상주: 빈소 신청 (규격 선택)
router.post(
  "/",
  requireFamily,
  asyncHandler(async (req, res) => {
    const { hallId } = req.body || {};
    if (!hallId) return res.status(400).json({ error: "신청할 빈소 규격을 선택해 주세요." });

    const me = await User.findById(req.user.uid);
    if (!me) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    if (me.hallUsageId) return res.status(400).json({ error: "이미 빈소가 배정되어 있습니다." });

    const pending = await HallRequest.findOne({ familyUserId: me._id, status: "pending" });
    if (pending) return res.status(400).json({ error: "이미 처리 대기 중인 빈소 신청이 있습니다." });

    const hall = await Hall.findById(hallId);
    if (!hall || !hall.active) return res.status(404).json({ error: "빈소 규격을 찾을 수 없습니다." });

    const availability = await computeHallAvailability();
    const slot = availability.items.find((it) => String(it.id) === String(hallId));
    if (slot && slot.usesPhysicalSlot && !slot.canRequestNow) {
      return res.status(400).json({
        error: slot.availableLabel || "현재 해당 빈소 규격을 신청할 수 없습니다.",
        availability: {
          availableFrom: slot.availableFrom,
          availableLabel: slot.availableLabel,
          daysUntil: slot.daysUntil,
        },
      });
    }

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
      .populate("hallId", "code name feature areaLabel capacity isVirtual");
    res.json({
      items: items.map((r) => ({
        ...r.toJSONSafe(),
        hall: r.hallId
          ? {
              id: r.hallId._id,
              hallNumber: r.hallId.name,
              name: r.hallId.name,
              feature: r.hallId.feature,
              areaLabel: r.hallId.areaLabel,
              capacity: r.hallId.capacity,
              isVirtual: r.hallId.isVirtual,
            }
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
      .populate("hallId", "code name feature areaLabel capacity isVirtual");
    res.json({
      items: items.map((r) => ({
        ...r.toJSONSafe(),
        family: r.familyUserId
          ? { id: r.familyUserId._id, name: r.familyUserId.name, username: r.familyUserId.username, phone: r.familyUserId.phone }
          : null,
        hall: r.hallId
          ? {
              id: r.hallId._id,
              hallNumber: r.hallId.name,
              name: r.hallId.name,
              feature: r.hallId.feature,
              areaLabel: r.hallId.areaLabel,
              capacity: r.hallId.capacity,
              isVirtual: r.hallId.isVirtual,
            }
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
      if (family.hallUsageId) return res.status(400).json({ error: "해당 상주에게 이미 빈소가 배정되어 있습니다." });

      const usage = await HallUsage.create({
        hallId: hall._id,
        familyUserId: family._id,
        hallRequestId: reqDoc._id,
        chiefMourner: family.name,
        status: "active",
        familyCode: genFamilyCode(),
      });

      family.hallUsageId = usage._id;
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

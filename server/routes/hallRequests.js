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

const USAGE_FIELDS = [
  "deceasedName", "chiefMourner", "relationship", "age",
  "enshrinedAt", "funeralDate", "funeralTime", "burialSite",
];

function genFamilyCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function pickUsageBody(body, defaults) {
  defaults = defaults || {};
  const out = {};
  for (const k of USAGE_FIELDS) {
    if (body && k in body) out[k] = String(body[k] == null ? "" : body[k]).trim();
    else if (defaults[k] != null) out[k] = String(defaults[k]).trim();
    else out[k] = "";
  }
  return out;
}

function validateUsageBody(body) {
  if (!body.deceasedName) return "고인명을 입력해 주세요.";
  if (!body.funeralDate) return "발인 일자를 선택해 주세요.";
  return null;
}

function formatHallRef(hall) {
  if (!hall) return null;
  return {
    id: hall._id,
    hallNumber: hall.name,
    name: hall.name,
    code: hall.code,
    specCode: hall.specCode,
    specLabel: hall.specLabel,
    feature: hall.feature,
    areaLabel: hall.areaLabel,
    capacity: hall.capacity,
    isVirtual: hall.isVirtual,
  };
}

function formatRequestRow(r) {
  return {
    ...r.toJSONSafe(),
    hall: formatHallRef(r.hallId),
  };
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

// 상주: 빈소 신청 + 이용 등록
router.post(
  "/",
  requireFamily,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const { hallId } = body;
    if (!hallId) return res.status(400).json({ error: "신청할 빈소를 선택해 주세요." });

    const me = await User.findById(req.user.uid);
    if (!me) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    if (me.hallUsageId) return res.status(400).json({ error: "이미 빈소가 배정되어 있습니다." });

    const pending = await HallRequest.findOne({ familyUserId: me._id, status: "pending" });
    if (pending) return res.status(400).json({ error: "이미 처리 대기 중인 빈소 신청이 있습니다." });

    const usage = pickUsageBody(body, { chiefMourner: me.name });
    const usageErr = validateUsageBody(usage);
    if (usageErr) return res.status(400).json({ error: usageErr });

    const hall = await Hall.findById(hallId);
    if (!hall || !hall.active) return res.status(404).json({ error: "빈소를 찾을 수 없습니다." });

    const availability = await computeHallAvailability();
    const slot = availability.items.find((it) => String(it.id) === String(hallId));
    if (slot && slot.usesPhysicalSlot && !slot.canRequestNow) {
      return res.status(400).json({
        error: slot.availableLabel || "현재 해당 빈소를 신청할 수 없습니다.",
        availability: {
          availableFrom: slot.availableFrom,
          availableLabel: slot.availableLabel,
          daysUntil: slot.daysUntil,
        },
      });
    }

    const reqDoc = await HallRequest.create({
      familyUserId: me._id,
      hallId: hall._id,
      ...usage,
    });
    res.status(201).json({ request: reqDoc.toJSONSafe() });
  })
);

// 상주: 대기 중인 빈소 신청·이용 정보 수정
router.patch(
  "/mine",
  requireFamily,
  asyncHandler(async (req, res) => {
    const pending = await HallRequest.findOne({ familyUserId: req.user.uid, status: "pending" });
    if (!pending) return res.status(404).json({ error: "수정할 대기 중인 빈소 신청이 없습니다." });

    const body = req.body || {};
    if (body.hallId) {
      const hall = await Hall.findById(body.hallId);
      if (!hall || !hall.active) return res.status(404).json({ error: "빈소를 찾을 수 없습니다." });
      pending.hallId = hall._id;
    }

    const usage = pickUsageBody(body);
    const usageErr = validateUsageBody({ ...pending.toObject(), ...usage });
    if (usageErr) return res.status(400).json({ error: usageErr });
    for (const k of USAGE_FIELDS) pending[k] = usage[k];

    await pending.save();
    await pending.populate("hallId", "code name specCode specLabel feature areaLabel capacity isVirtual");
    res.json({ request: formatRequestRow(pending) });
  })
);

// 상주: 내 빈소 신청 내역
router.get(
  "/mine",
  requireFamily,
  asyncHandler(async (req, res) => {
    const items = await HallRequest.find({ familyUserId: req.user.uid })
      .sort({ createdAt: -1 })
      .populate("hallId", "code name specCode specLabel feature areaLabel capacity isVirtual");
    res.json({ items: items.map(formatRequestRow) });
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
      .populate("hallId", "code name specCode specLabel feature areaLabel capacity isVirtual");
    res.json({
      items: items.map((r) => ({
        ...formatRequestRow(r),
        family: r.familyUserId
          ? { id: r.familyUserId._id, name: r.familyUserId.name, username: r.familyUserId.username, phone: r.familyUserId.phone }
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
      if (!reqDoc.deceasedName || !reqDoc.funeralDate) {
        return res.status(400).json({ error: "고인명·발인 일자가 입력된 신청만 승인할 수 있습니다." });
      }

      const activeOnRoom = await HallUsage.findOne({ hallId: hall._id, status: "active" });
      if (activeOnRoom && !hall.isVirtual) {
        return res.status(400).json({ error: `${hall.name}는 현재 이용 중입니다.` });
      }

      const usage = await HallUsage.create({
        hallId: hall._id,
        familyUserId: family._id,
        hallRequestId: reqDoc._id,
        deceasedName: reqDoc.deceasedName,
        chiefMourner: reqDoc.chiefMourner || family.name,
        relationship: reqDoc.relationship,
        age: reqDoc.age,
        enshrinedAt: reqDoc.enshrinedAt,
        funeralDate: reqDoc.funeralDate,
        funeralTime: reqDoc.funeralTime,
        burialSite: reqDoc.burialSite,
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

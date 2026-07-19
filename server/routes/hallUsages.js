"use strict";

const express = require("express");
const Hall = require("../models/Hall");
const HallUsage = require("../models/HallUsage");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin, requireFamily } = require("../middleware/auth");
const { usageToAdminJSON } = require("../utils/hallFormat");
const { autoCompletePastFunerals } = require("../utils/hallAvailability");

const router = express.Router();

const USAGE_FIELDS = [
  "deceasedName", "chiefMourner", "relationship", "age",
  "enshrinedAt", "funeralDate", "funeralTime", "burialSite",
];

function pickUsageBody(body) {
  const out = {};
  for (const k of USAGE_FIELDS) {
    if (body && k in body) out[k] = String(body[k] == null ? "" : body[k]).trim();
  }
  return out;
}

function formatMemberUsage(usage) {
  const hall = usage.hallId;
  return {
    id: usage._id,
    hall: hall
      ? {
          id: hall._id,
          name: hall.name,
          hallNumber: hall.name,
          code: hall.code,
          specCode: hall.specCode,
          specLabel: hall.specLabel,
          feature: hall.feature,
          areaLabel: hall.areaLabel,
          capacity: hall.capacity,
          isVirtual: hall.isVirtual,
        }
      : null,
    deceasedName: usage.deceasedName,
    chiefMourner: usage.chiefMourner,
    relationship: usage.relationship,
    age: usage.age,
    enshrinedAt: usage.enshrinedAt,
    funeralDate: usage.funeralDate,
    funeralTime: usage.funeralTime,
    burialSite: usage.burialSite,
    status: usage.status,
    familyCode: usage.familyCode,
    createdAt: usage.createdAt,
    updatedAt: usage.updatedAt,
  };
}

function genFamilyCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function loadUsage(id) {
  return HallUsage.findById(id).populate("hallId").populate("familyUserId", "name username phone");
}

// 상주: 내 빈소 이용 정보
router.get(
  "/mine",
  requireFamily,
  asyncHandler(async (req, res) => {
    await autoCompletePastFunerals();
    const me = await User.findById(req.user.uid);
    if (!me || !me.hallUsageId) return res.json({ usage: null });
    const usage = await HallUsage.findOne({ _id: me.hallUsageId, familyUserId: me._id }).populate("hallId");
    if (!usage) return res.json({ usage: null });
    res.json({ usage: formatMemberUsage(usage) });
  })
);

// 상주: 배정된 빈소 이용 정보 수정
router.patch(
  "/mine",
  requireFamily,
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.user.uid);
    if (!me || !me.hallUsageId) return res.status(404).json({ error: "배정된 빈소 이용이 없습니다." });

    const usage = await HallUsage.findOne({ _id: me.hallUsageId, familyUserId: me._id, status: "active" });
    if (!usage) return res.status(404).json({ error: "수정할 수 있는 빈소 이용이 없습니다." });

    const patch = pickUsageBody(req.body || {});
    for (const k of USAGE_FIELDS) if (k in patch) usage[k] = patch[k];
    if (!usage.deceasedName) return res.status(400).json({ error: "고인명을 입력해 주세요." });
    if (!usage.funeralDate) return res.status(400).json({ error: "발인 일자를 선택해 주세요." });

    await usage.save();
    await usage.populate("hallId");
    res.json({ usage: formatMemberUsage(usage) });
  })
);

// 관리자: 빈소 이용 목록
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await autoCompletePastFunerals();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await HallUsage.find(filter)
      .sort({ createdAt: -1 })
      .populate("hallId")
      .populate("familyUserId", "name username phone");
    res.json({
      items: items.map((u) => usageToAdminJSON(u, u.hallId, u.familyUserId)),
    });
  })
);

// 관리자: 상주 연결용 활성 빈소 이용 옵션
router.get(
  "/admin/active-options",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await HallUsage.find({ status: "active" })
      .sort({ createdAt: -1 })
      .populate("hallId");
    res.json({
      items: items.map((u) => ({
        id: u._id,
        hallNumber: u.hallId ? u.hallId.name : "",
        deceasedName: u.deceasedName,
        chiefMourner: u.chiefMourner,
      })),
    });
  })
);

// 관리자: 빈소 이용 등록
router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.hallId) return res.status(400).json({ error: "빈소를 선택해 주세요." });

    const hall = await Hall.findById(body.hallId);
    if (!hall || !hall.active) return res.status(404).json({ error: "빈소를 찾을 수 없습니다." });

    const status = body.status === "completed" || body.status === "cancelled" ? body.status : "active";
    if (status === "active" && !hall.isVirtual) {
      const activeOnRoom = await HallUsage.findOne({ hallId: hall._id, status: "active" });
      if (activeOnRoom) return res.status(400).json({ error: `${hall.name}는 현재 이용 중입니다.` });
    }

    let family = null;
    if (body.familyUserId) {
      family = await User.findOne({ _id: body.familyUserId, role: "family" });
      if (!family) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });
      if (family.hallUsageId) return res.status(400).json({ error: "해당 상주에게 이미 빈소 이용이 배정되어 있습니다." });
    }

    const usage = new HallUsage({
      hallId: hall._id,
      familyUserId: family ? family._id : null,
      deceasedName: body.deceasedName || "",
      chiefMourner: body.chiefMourner || "",
      relationship: body.relationship || "",
      age: body.age || "",
      enshrinedAt: body.enshrinedAt || "",
      funeralDate: body.funeralDate || "",
      funeralTime: body.funeralTime || "",
      burialSite: body.burialSite || "",
      status,
    });
    if (usage.status === "active") usage.familyCode = genFamilyCode();
    await usage.save();

    if (family) {
      family.hallUsageId = usage._id;
      await family.save();
    }

    const saved = await loadUsage(usage._id);
    res.status(201).json({ usage: usageToAdminJSON(saved, saved.hallId, saved.familyUserId) });
  })
);

// 관리자: 빈소 이용 수정
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const usage = await HallUsage.findById(req.params.id);
    if (!usage) return res.status(404).json({ error: "빈소 이용 정보를 찾을 수 없습니다." });

    const body = req.body || {};
    const allowed = [
      "deceasedName", "chiefMourner", "relationship", "age",
      "enshrinedAt", "funeralDate", "funeralTime", "burialSite", "status", "familyCode",
    ];
    for (const k of allowed) if (k in body) usage[k] = body[k];

    if ("hallId" in body && body.hallId) {
      const hall = await Hall.findById(body.hallId);
      if (!hall) return res.status(404).json({ error: "빈소를 찾을 수 없습니다." });
      usage.hallId = hall._id;
    }

    if ("familyUserId" in body) {
      if (body.familyUserId) {
        const family = await User.findOne({ _id: body.familyUserId, role: "family" });
        if (!family) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });
        if (family.hallUsageId && String(family.hallUsageId) !== String(usage._id)) {
          return res.status(400).json({ error: "해당 상주에게 이미 다른 빈소 이용이 배정되어 있습니다." });
        }
        if (usage.familyUserId && String(usage.familyUserId) !== String(family._id)) {
          await User.updateOne({ _id: usage.familyUserId }, { hallUsageId: null });
        }
        usage.familyUserId = family._id;
        family.hallUsageId = usage._id;
        await family.save();
      } else {
        if (usage.familyUserId) {
          await User.updateOne({ _id: usage.familyUserId }, { hallUsageId: null });
        }
        usage.familyUserId = null;
      }
    }

    if (usage.status === "active" && !usage.familyCode) usage.familyCode = genFamilyCode();
    if (usage.status !== "active") {
      usage.familyCode = "";
      if (usage.familyUserId) {
        await User.updateOne({ _id: usage.familyUserId }, { hallUsageId: null });
        usage.familyUserId = null;
      }
    }

    await usage.save();
    const saved = await loadUsage(usage._id);
    res.json({ usage: usageToAdminJSON(saved, saved.hallId, saved.familyUserId) });
  })
);

// 관리자: 빈소 이용 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const usage = await HallUsage.findById(req.params.id);
    if (!usage) return res.status(404).json({ error: "빈소 이용 정보를 찾을 수 없습니다." });
    if (usage.familyUserId) {
      await User.updateOne({ _id: usage.familyUserId }, { hallUsageId: null });
    }
    await usage.deleteOne();
    res.json({ ok: true });
  })
);

module.exports = router;

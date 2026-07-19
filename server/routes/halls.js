"use strict";

const express = require("express");
const Hall = require("../models/Hall");
const HallUsage = require("../models/HallUsage");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");
const { usageToPublicJSON } = require("../utils/hallFormat");
const { computeHallAvailability, autoCompletePastFunerals } = require("../utils/hallAvailability");

const router = express.Router();

// 공개: 현재 이용 중인 빈소 현황 (HallUsage 기준)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await autoCompletePastFunerals();
    const filter = { status: "active" };
    if (req.query.status === "in-use") filter.status = "active";
    else if (req.query.status === "completed") filter.status = "completed";

    const usages = await HallUsage.find(filter)
      .sort({ updatedAt: -1 })
      .populate("hallId");
    res.json({ items: usages.map((u) => usageToPublicJSON(u, u.hallId)) });
  })
);

// 공개: 빈소 검색 (고인명/상주명/규격명)
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ items: [] });
    await autoCompletePastFunerals();
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const halls = await Hall.find({
      $or: [{ name: rx }, { specLabel: rx }, { feature: rx }, { code: rx }],
    }).select("_id");
    const hallIds = halls.map((h) => h._id);

    const usages = await HallUsage.find({
      status: "active",
      $or: [
        { deceasedName: rx },
        { chiefMourner: rx },
        { hallId: { $in: hallIds } },
      ],
    })
      .sort({ updatedAt: -1 })
      .populate("hallId");

    res.json({ items: usages.map((u) => usageToPublicJSON(u, u.hallId)) });
  })
);

// 공개: 빈소 가능 일자 (발인 일자 역산)
router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    res.json(await computeHallAvailability());
  })
);

// 관리자: 빈소 규격(카탈로그) 목록
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const halls = await Hall.find({}).sort({ sortOrder: 1, name: 1 });
    res.json({ items: halls.map((h) => h.toAdminJSON()) });
  })
);

// 관리자: 빈소 규격 수정
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const hall = await Hall.findById(req.params.id);
    if (!hall) return res.status(404).json({ error: "빈소를 찾을 수 없습니다." });

    const allowed = ["name", "areaLabel", "capacity", "feature", "sortOrder", "active", "dailyPrice"];
    for (const k of allowed) if (k in (req.body || {})) {
      if (k === "dailyPrice") hall[k] = Math.max(0, Math.round(Number(req.body[k]) || 0));
      else hall[k] = req.body[k];
    }
    await hall.save();
    res.json({ hall: hall.toAdminJSON() });
  })
);

module.exports = router;

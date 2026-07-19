"use strict";

const express = require("express");
const User = require("../models/User");
const HallUsage = require("../models/HallUsage");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");
const { usageToHallSummary } = require("../utils/hallFormat");

const router = express.Router();

// 관리자: 상주(family) 계정 목록 (연결 빈소 이용 정보 포함)
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await User.find({ role: "family" })
      .sort({ createdAt: -1 })
      .populate({ path: "hallUsageId", populate: { path: "hallId" } });
    res.json({
      items: users.map((u) => ({
        ...u.toSafeJSON(),
        hall: usageToHallSummary(u.hallUsageId, u.hallUsageId && u.hallUsageId.hallId),
        lastLoginAt: u.lastLoginAt,
      })),
    });
  })
);

// 관리자: 상주 계정 생성
router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { username, name, phone, password, hallUsageId } = req.body || {};
    if (!username || !name || !password) {
      return res.status(400).json({ error: "아이디, 이름, 비밀번호를 입력해 주세요." });
    }
    if (hallUsageId) {
      const usage = await HallUsage.findById(hallUsageId);
      if (!usage || usage.status !== "active") {
        return res.status(404).json({ error: "연결할 빈소 이용 정보를 찾을 수 없습니다." });
      }
      if (usage.familyUserId) {
        return res.status(400).json({ error: "해당 빈소 이용에 이미 상주가 연결되어 있습니다." });
      }
    }
    const user = new User({
      username: String(username).toLowerCase().trim(),
      role: "family",
      name,
      phone: phone || "",
      hallUsageId: hallUsageId || null,
    });
    await user.setPassword(password);
    await user.save();

    if (hallUsageId) {
      await HallUsage.updateOne({ _id: hallUsageId }, { familyUserId: user._id, chiefMourner: name });
    }

    res.status(201).json({ user: user.toSafeJSON() });
  })
);

// 관리자: 상주 계정 수정 (이름/연락처/빈소 이용/활성/비밀번호 재설정)
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, role: "family" });
    if (!user) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });

    const { name, phone, hallUsageId, active, password } = req.body || {};
    if (typeof name === "string") user.name = name;
    if (typeof phone === "string") user.phone = phone;
    if (typeof active === "boolean") user.active = active;
    if (password) await user.setPassword(password);

    if ("hallUsageId" in (req.body || {})) {
      if (user.hallUsageId && String(user.hallUsageId) !== String(hallUsageId || "")) {
        await HallUsage.updateOne({ _id: user.hallUsageId }, { familyUserId: null });
      }
      if (hallUsageId) {
        const usage = await HallUsage.findById(hallUsageId);
        if (!usage || usage.status !== "active") {
          return res.status(404).json({ error: "연결할 빈소 이용 정보를 찾을 수 없습니다." });
        }
        if (usage.familyUserId && String(usage.familyUserId) !== String(user._id)) {
          return res.status(400).json({ error: "해당 빈소 이용에 이미 다른 상주가 연결되어 있습니다." });
        }
        usage.familyUserId = user._id;
        if (!usage.chiefMourner) usage.chiefMourner = user.name;
        await usage.save();
        user.hallUsageId = usage._id;
      } else {
        user.hallUsageId = null;
      }
    }

    await user.save();
    res.json({ user: user.toSafeJSON() });
  })
);

// 관리자: 상주 계정 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, role: "family" });
    if (!user) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });
    if (user.hallUsageId) {
      await HallUsage.updateOne({ _id: user.hallUsageId }, { familyUserId: null });
    }
    await user.deleteOne();
    res.json({ ok: true });
  })
);

module.exports = router;

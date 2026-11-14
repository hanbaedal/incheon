"use strict";

const express = require("express");
const User = require("../models/User");
const HallUsage = require("../models/HallUsage");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin, requireStaff } = require("../middleware/auth");
const { usageToHallSummary } = require("../utils/hallFormat");
const { writeAudit } = require("../utils/auditLog");

const router = express.Router();

function mapFamily(u) {
  return {
    ...u.toAdminJSON(),
    hall: usageToHallSummary(u.hallUsageId, u.hallUsageId && u.hallUsageId.hallId),
    lastLoginAt: u.lastLoginAt,
  };
}

function mapAccount(u) {
  return {
    ...u.toAdminJSON(),
    lastLoginAt: u.lastLoginAt,
  };
}

// 상주(family) 계정 목록 (아이디·비밀번호 포함)
router.get(
  "/admin/all",
  requireStaff,
  asyncHandler(async (req, res) => {
    const users = await User.find({ role: "family" })
      .sort({ createdAt: -1 })
      .populate({ path: "hallUsageId", populate: { path: "hallId" } });
    res.json({ items: users.map(mapFamily) });
  })
);

// 관리자 계정 목록 (아이디·비밀번호 포함)
router.get(
  "/admin/admins",
  requireStaff,
  asyncHandler(async (req, res) => {
    const admins = await User.find({ role: "admin" }).sort({ username: 1 });
    res.json({ items: admins.map(mapAccount) });
  })
);

// 회원 리스트 통합 (관리자 + 상주 + 슈퍼바이저) — 아이디·비밀번호 표시
router.get(
  "/admin/members",
  requireStaff,
  asyncHandler(async (req, res) => {
    const [admins, supervisors, families] = await Promise.all([
      User.find({ role: "admin" }).sort({ username: 1 }),
      User.find({ role: "supervisor" }).sort({ username: 1 }),
      User.find({ role: "family" })
        .sort({ createdAt: -1 })
        .populate({ path: "hallUsageId", populate: { path: "hallId" } }),
    ]);

    res.json({
      admins: admins.map(mapAccount),
      supervisors: supervisors.map(mapAccount),
      families: families.map(mapFamily),
      items: [
        ...admins.map((u) => ({ ...mapAccount(u), roleLabel: "관리자" })),
        ...supervisors.map((u) => ({ ...mapAccount(u), roleLabel: "슈퍼바이저" })),
        ...families.map((u) => ({ ...mapFamily(u), roleLabel: "상주" })),
      ],
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
      mustChangePassword: true,
      guideAcknowledgedAt: null,
    });
    await user.setPassword(password);
    await user.save();

    if (hallUsageId) {
      await HallUsage.updateOne({ _id: hallUsageId }, { familyUserId: user._id, chiefMourner: name });
    }

    await writeAudit(req, {
      action: "create",
      targetType: "user",
      targetId: user._id,
      summary: `상주 계정 생성: ${user.username} (${user.name})`,
    });

    res.status(201).json({ user: user.toAdminJSON() });
  })
);

// 관리자: 상주 계정 수정
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
    if (password) {
      await user.setPassword(password);
      user.mustChangePassword = true;
    }

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
    await writeAudit(req, {
      action: "update",
      targetType: "user",
      targetId: user._id,
      summary: `상주 계정 수정: ${user.username}${password ? " (비밀번호 재설정)" : ""}`,
      detail: { active: user.active, hallUsageId: user.hallUsageId },
    });
    res.json({ user: user.toAdminJSON() });
  })
);

// 관리자: 상주 계정 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, role: "family" });
    if (!user) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });
    const snap = { username: user.username, name: user.name };
    if (user.hallUsageId) {
      await HallUsage.updateOne({ _id: user.hallUsageId }, { familyUserId: null });
    }
    await user.deleteOne();
    await writeAudit(req, {
      action: "delete",
      targetType: "user",
      targetId: req.params.id,
      summary: `상주 계정 삭제: ${snap.username} (${snap.name})`,
    });
    res.json({ ok: true });
  })
);

module.exports = router;

"use strict";

const express = require("express");
const User = require("../models/User");
const Hall = require("../models/Hall");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// 관리자: 상주(family) 계정 목록 (연결 빈소 정보 포함)
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await User.find({ role: "family" }).sort({ createdAt: -1 }).populate("hallId", "hallNumber deceasedName");
    res.json({
      items: users.map((u) => ({
        ...u.toSafeJSON(),
        hall: u.hallId ? { id: u.hallId._id, hallNumber: u.hallId.hallNumber, deceasedName: u.hallId.deceasedName } : null,
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
    const { username, name, phone, password, hallId } = req.body || {};
    if (!username || !name || !password) {
      return res.status(400).json({ error: "아이디, 이름, 비밀번호를 입력해 주세요." });
    }
    if (hallId) {
      const hall = await Hall.findById(hallId);
      if (!hall) return res.status(404).json({ error: "연결할 빈소를 찾을 수 없습니다." });
    }
    const user = new User({
      username: String(username).toLowerCase().trim(),
      role: "family",
      name,
      phone: phone || "",
      hallId: hallId || null,
    });
    await user.setPassword(password);
    await user.save();
    res.status(201).json({ user: user.toSafeJSON() });
  })
);

// 관리자: 상주 계정 수정 (이름/연락처/빈소/활성/비밀번호 재설정)
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, role: "family" });
    if (!user) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });

    const { name, phone, hallId, active, password } = req.body || {};
    if (typeof name === "string") user.name = name;
    if (typeof phone === "string") user.phone = phone;
    if ("hallId" in (req.body || {})) user.hallId = hallId || null;
    if (typeof active === "boolean") user.active = active;
    if (password) await user.setPassword(password);
    await user.save();
    res.json({ user: user.toSafeJSON() });
  })
);

// 관리자: 상주 계정 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const r = await User.findOneAndDelete({ _id: req.params.id, role: "family" });
    if (!r) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });
    res.json({ ok: true });
  })
);

module.exports = router;

"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { setSessionCookie, clearSessionCookie } = require("../utils/token");
const { requireAuth } = require("../middleware/auth");
const { writeAudit } = require("../utils/auditLog");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
});

// 로그인 (관리자·상주 공통) — username / password
router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "아이디와 비밀번호를 입력해 주세요." });
    }
    const user = await User.findOne({ username: String(username).toLowerCase().trim() });
    if (!user || !user.active) {
      return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }
    const ok = await user.verifyPassword(password);
    if (!ok) {
      return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }
    user.lastLoginAt = new Date();
    await user.save();

    setSessionCookie(res, {
      uid: String(user._id),
      role: user.role,
      name: user.name,
      username: user.username,
      hallUsageId: user.hallUsageId ? String(user.hallUsageId) : null,
    });

    req.user = {
      uid: String(user._id),
      role: user.role,
      name: user.name,
      username: user.username,
    };
    await writeAudit(req, {
      action: "login",
      targetType: "user",
      targetId: user._id,
      summary: `${user.role} 로그인: ${user.username}`,
    });

    res.json({ user: user.toSafeJSON() });
  })
);

router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// 현재 세션 정보
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.uid);
    if (!user || !user.active) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "세션이 만료되었습니다." });
    }
    res.json({ user: user.toSafeJSON() });
  })
);

// 상주: 비밀번호 변경 (최초 로그인 강제 변경 포함)
router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "현재 비밀번호와 새 비밀번호를 입력해 주세요." });
    }
    if (String(newPassword).length < 4) {
      return res.status(400).json({ error: "새 비밀번호는 4자 이상이어야 합니다." });
    }
    const user = await User.findById(req.user.uid);
    if (!user || !user.active) {
      return res.status(401).json({ error: "세션이 만료되었습니다." });
    }
    const ok = await user.verifyPassword(currentPassword);
    if (!ok) {
      return res.status(400).json({ error: "현재 비밀번호가 올바르지 않습니다." });
    }
    if (String(currentPassword) === String(newPassword)) {
      return res.status(400).json({ error: "새 비밀번호는 현재 비밀번호와 달라야 합니다." });
    }
    await user.setPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    await writeAudit(req, {
      action: "password",
      targetType: "user",
      targetId: user._id,
      summary: `비밀번호 변경: ${user.username}`,
    });

    res.json({ user: user.toSafeJSON() });
  })
);

// 상주: 이용 안내 체크리스트 확인
router.post(
  "/ack-guide",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.uid);
    if (!user || !user.active) {
      return res.status(401).json({ error: "세션이 만료되었습니다." });
    }
    if (user.role !== "family") {
      return res.status(403).json({ error: "상주 계정만 이용 안내를 확인할 수 있습니다." });
    }
    user.guideAcknowledgedAt = new Date();
    await user.save();
    await writeAudit(req, {
      action: "update",
      targetType: "user",
      targetId: user._id,
      summary: `이용 안내 확인: ${user.username}`,
    });
    res.json({ user: user.toSafeJSON() });
  })
);

module.exports = router;

"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { setSessionCookie, clearSessionCookie } = require("../utils/token");
const { requireAuth } = require("../middleware/auth");

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
      hallUsageId: user.hallUsageId ? String(user.hallUsageId) : null,
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

module.exports = router;

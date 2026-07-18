"use strict";

const { COOKIE_NAME, verifyToken } = require("../utils/token");

// 요청의 세션 쿠키를 해석해 req.user 에 주입 (없으면 null)
function attachUser(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  req.user = token ? verifyToken(token) : null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "로그인이 필요합니다." });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "로그인이 필요합니다." });
  if (req.user.role !== "admin") return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  next();
}

function requireFamily(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "로그인이 필요합니다." });
  if (req.user.role !== "family" && req.user.role !== "admin") {
    return res.status(403).json({ error: "상주(유족) 권한이 필요합니다." });
  }
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin, requireFamily };

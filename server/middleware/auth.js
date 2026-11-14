"use strict";

const { resolveUserFromCookies } = require("../utils/token");

function attachUser(req, res, next) {
  req.user = resolveUserFromCookies(req);
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "로그인이 필요합니다." });
  next();
}

function isAdmin(user) {
  return !!(user && user.role === "admin");
}

function isSupervisor(user) {
  return !!(user && user.role === "supervisor");
}

function isStaff(user) {
  return isAdmin(user) || isSupervisor(user);
}

/** 관리자 전용 (품목·요금·계정 수정/삭제 등) */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "로그인이 필요합니다." });
  if (!isAdmin(req.user)) return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  next();
}

/** 관리자 또는 슈퍼바이저 (조회·승인) */
function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "로그인이 필요합니다." });
  if (!isStaff(req.user)) return res.status(403).json({ error: "관리자 또는 슈퍼바이저 권한이 필요합니다." });
  next();
}

function requireFamily(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "로그인이 필요합니다." });
  if (req.user.role !== "family" && req.user.role !== "admin") {
    return res.status(403).json({ error: "상주(유족) 권한이 필요합니다." });
  }
  next();
}

module.exports = {
  attachUser,
  requireAuth,
  requireAdmin,
  requireStaff,
  requireFamily,
  isAdmin,
  isSupervisor,
  isStaff,
};

"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

// 역할별 세션 쿠키 — 관리자·상주가 동시에 로그인 상태를 유지할 수 있음
const COOKIE_NAMES = {
  admin: "session_token_admin",
  family: "session_token_member",
  legacy: "session_token",
};
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7일

function cookieNameForRole(role) {
  return role === "admin" ? COOKIE_NAMES.admin : COOKIE_NAMES.family;
}

function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function setSessionCookie(res, payload) {
  const token = signToken(payload);
  const name = cookieNameForRole(payload.role);
  const opts = {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  };
  res.cookie(name, token, opts);
  // 구버전 단일 쿠키 제거(역할 간 덮어쓰기 방지)
  res.clearCookie(COOKIE_NAMES.legacy, opts);
  return token;
}

function clearSessionCookie(res, scope) {
  const opts = { path: "/" };
  if (!scope || scope === "admin") res.clearCookie(COOKIE_NAMES.admin, opts);
  if (!scope || scope === "family" || scope === "member") res.clearCookie(COOKIE_NAMES.family, opts);
  res.clearCookie(COOKIE_NAMES.legacy, opts);
}

// 요청 컨텍스트에 맞는 세션 선택 (역할별 쿠키가 둘 다 있을 때)
function resolveUserFromCookies(req) {
  const adminTok = req.cookies && req.cookies[COOKIE_NAMES.admin];
  const memberTok = req.cookies && req.cookies[COOKIE_NAMES.family];
  const legacyTok = req.cookies && req.cookies[COOKIE_NAMES.legacy];
  const scope = req.get("x-session-scope");
  const referer = req.get("referer") || "";

  if (scope === "admin" && adminTok) return verifyToken(adminTok);
  if ((scope === "member" || scope === "family") && memberTok) return verifyToken(memberTok);

  if (referer.includes("/admin") && adminTok) return verifyToken(adminTok);
  if (referer.includes("/pages/member") && memberTok) return verifyToken(memberTok);

  for (const tok of [adminTok, memberTok, legacyTok]) {
    const user = tok && verifyToken(tok);
    if (user) return user;
  }
  return null;
}

module.exports = {
  COOKIE_NAMES,
  cookieNameForRole,
  signToken,
  verifyToken,
  setSessionCookie,
  clearSessionCookie,
  resolveUserFromCookies,
  // 하위 호환
  COOKIE_NAME: COOKIE_NAMES.legacy,
};

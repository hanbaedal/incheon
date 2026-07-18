"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

const COOKIE_NAME = "session_token";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7일

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
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
  return token;
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

module.exports = { COOKIE_NAME, signToken, verifyToken, setSessionCookie, clearSessionCookie };

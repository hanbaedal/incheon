"use strict";

const env = require("../config/env");
const User = require("../models/User");

/**
 * 슈퍼바이저 계정 보장
 * 기본: basic / basic4444 (환경변수로 변경 가능)
 */
async function ensureSupervisor() {
  const username = String(env.SUPERVISOR_USERNAME || "basic").toLowerCase().trim();
  const password = String(env.SUPERVISOR_PASSWORD || "basic4444");
  const name = String(env.SUPERVISOR_NAME || "슈퍼바이저");

  let user = await User.findOne({ username });
  if (!user) {
    user = new User({
      username,
      role: "supervisor",
      name,
      active: true,
    });
    await user.setPassword(password);
    await user.save();
    console.log(`[SUPERVISOR] 계정 생성: ${username}`);
    return { created: true, username };
  }

  let changed = false;
  if (user.role !== "supervisor") {
    user.role = "supervisor";
    changed = true;
  }
  if (!user.active) {
    user.active = true;
    changed = true;
  }
  if (user.name !== name) {
    user.name = name;
    changed = true;
  }
  // 표시용 비밀번호가 없거나 env와 다르면 동기화 (운영 편의)
  if (!user.passwordPlain || user.passwordPlain !== password) {
    await user.setPassword(password);
    changed = true;
  }
  if (changed) {
    await user.save();
    console.log(`[SUPERVISOR] 계정 동기화: ${username}`);
  }
  return { created: false, username };
}

module.exports = { ensureSupervisor };

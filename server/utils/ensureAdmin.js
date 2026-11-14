"use strict";

const env = require("../config/env");
const User = require("../models/User");

// 관리자 계정이 하나도 없으면 env 값으로 1회 생성 (있으면 아무 것도 하지 않음)
// ADMIN_RESET=1 이면 기존 관리자를 모두 지우고 env 값으로 재생성 (일회성)
// passwordPlain 이 비어 있으면 env 비밀번호로 동기화해 관리자 화면에 보이게 함
async function ensureAdmin() {
  const username = env.ADMIN_USERNAME.toLowerCase().trim();

  if (env.ADMIN_RESET) {
    const del = await User.deleteMany({ $or: [{ role: "admin" }, { username }] });
    const admin = new User({ username, role: "admin", name: env.ADMIN_NAME });
    await admin.setPassword(env.ADMIN_PASSWORD);
    await admin.save();
    console.log(`[ADMIN] ADMIN_RESET: 기존 관리자 ${del.deletedCount}건 삭제 후 재생성: ${username}`);
    console.log("[ADMIN] ⚠️ 재설정 완료 — 이제 Render에서 ADMIN_RESET 변수를 삭제하세요.");
    return { created: true, username, reset: true };
  }

  const existing = await User.findOne({ username });
  if (existing) {
    let changed = false;
    if (existing.role !== "admin") {
      existing.role = "admin";
      changed = true;
      console.log(`[ADMIN] 기존 계정(${username}) 권한을 admin으로 승격`);
    }
    if (!existing.passwordPlain) {
      await existing.setPassword(env.ADMIN_PASSWORD);
      changed = true;
      console.log(`[ADMIN] 관리자 비밀번호(표시용)를 env 값으로 동기화: ${username}`);
    }
    if (changed) await existing.save();
    return { created: false, username };
  }

  // 다른 관리자 계정이 이미 있다면 새로 만들지 않음 (표시용 비밀번호만 보정)
  const anyAdmin = await User.findOne({ role: "admin" });
  if (anyAdmin) {
    if (!anyAdmin.passwordPlain) {
      await anyAdmin.setPassword(env.ADMIN_PASSWORD);
      await anyAdmin.save();
      console.log(`[ADMIN] 기존 관리자(${anyAdmin.username}) 표시용 비밀번호 동기화`);
    }
    console.log(`[ADMIN] 관리자 계정 존재(${anyAdmin.username}) — 자동 생성 건너뜀`);
    return { created: false, username: anyAdmin.username };
  }

  const admin = new User({ username, role: "admin", name: env.ADMIN_NAME });
  await admin.setPassword(env.ADMIN_PASSWORD);
  await admin.save();
  console.log(`[ADMIN] 관리자 계정 자동 생성: ${username}`);
  return { created: true, username };
}

module.exports = { ensureAdmin };

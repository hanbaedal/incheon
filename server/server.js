"use strict";

const env = require("./config/env");
const { connectDB } = require("./config/db");
const { createApp } = require("./app");
const { ensureAdmin } = require("./utils/ensureAdmin");
const { ensureAmcCatalog } = require("./utils/ensureCatalog");
const { ensureHalls } = require("./utils/ensureHalls");
const { autoCompletePastFunerals } = require("./utils/hallAvailability");

async function main() {
  try {
    await connectDB();
    console.log("[DB] MongoDB 연결 성공");
  } catch (err) {
    console.error("[DB] 연결 실패:", err.message);
    process.exit(1);
  }

  // 관리자 계정이 없으면 env 값으로 자동 생성 (배포 시 편의)
  try {
    await ensureAdmin();
  } catch (err) {
    console.error("[ADMIN] 자동 시딩 실패:", err.message);
  }

  // AMC 장례용품 규격표 — 서버 시작 시 자동 등록 (Render Shell 불필요)
  try {
    const r = await ensureAmcCatalog();
    const n =
      r.coffins.created + r.hoengdae.created + r.shrouds.created +
      r.accessories.created + r.foodItems.created + r.flowerItems.created + r.photoItems.created + r.dressItems.created + r.hearseItems.created;
    if (n > 0) {
      console.log(
        `[CATALOG] AMC 규격표 등록 — 관 ${r.coffins.created}, 횡대 ${r.hoengdae.created}, ` +
        `수의 ${r.shrouds.created}, 부속 ${r.accessories.created}, 음식 ${r.foodItems.created}, ` +
        `화환 ${r.flowerItems.created}, 사진 ${r.photoItems.created}, 상복 ${r.dressItems.created}, 운구 ${r.hearseItems.created}`
      );
    }
  } catch (err) {
    console.error("[CATALOG] AMC 규격표 등록 실패:", err.message);
  }

  try {
    const r = await ensureHalls();
    if (r.migrated) console.log("[HALL] 구 빈소 데이터를 규격 카탈로그 구조로 전환했습니다.");
    if (r.created > 0) console.log(`[HALL] 빈소 규격 ${r.created}건 신규 등록 (전체 ${r.total}건)`);
  } catch (err) {
    console.error("[HALL] 빈소 규격 등록 실패:", err.message);
  }

  try {
    const r = await autoCompletePastFunerals();
    if (r.completed > 0) console.log(`[HALL] 발인 경과 ${r.completed}건 자동 발인완료 처리`);
  } catch (err) {
    console.error("[HALL] 자동 발인완료 실패:", err.message);
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[SERVER] http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  setInterval(() => {
    autoCompletePastFunerals()
      .then((r) => {
        if (r.completed > 0) console.log(`[HALL] 발인 경과 ${r.completed}건 자동 발인완료 처리`);
      })
      .catch((err) => console.error("[HALL] 자동 발인완료 실패:", err.message));
  }, 15 * 60 * 1000);
}

main();

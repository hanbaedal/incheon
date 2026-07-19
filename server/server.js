"use strict";

const env = require("./config/env");
const { connectDB } = require("./config/db");
const { createApp } = require("./app");
const { ensureAdmin } = require("./utils/ensureAdmin");
const { ensureAmcCatalog } = require("./utils/ensureCatalog");

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
    const n = r.coffins.created + r.hoengdae.created + r.shrouds.created + r.accessories.created;
    if (n > 0) {
      console.log(
        `[CATALOG] AMC 규격표 등록 — 관 ${r.coffins.created}, 횡대 ${r.hoengdae.created}, 수의 ${r.shrouds.created}, 부속 ${r.accessories.created}`
      );
    }
  } catch (err) {
    console.error("[CATALOG] AMC 규격표 등록 실패:", err.message);
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[SERVER] http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

main();

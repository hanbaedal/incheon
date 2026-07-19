"use strict";

const { connectDB, disconnectDB } = require("./config/db");
const { ensureAmcCatalog } = require("./utils/ensureCatalog");

async function main() {
  await connectDB();
  console.log("[SEED:COFFINS] 시작");
  const r = await ensureAmcCatalog();
  console.log(`+ 관 ${r.coffins.total}건 (신규 ${r.coffins.created}, 갱신 ${r.coffins.updated})`);
  console.log(`+ 횡대 ${r.hoengdae.total}건 (신규 ${r.hoengdae.created})`);
  console.log(`+ 수의 ${r.shrouds.total}건 (신규 ${r.shrouds.created})`);
  console.log(`+ 부속물품 ${r.accessories.total}건 (신규 ${r.accessories.created})`);
  console.log("[SEED:COFFINS] 완료");
  await disconnectDB();
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[SEED:COFFINS] 오류:", err.message);
    console.error("→ Render에서는 Shell 없이도 서버 재시작 시 자동 등록됩니다.");
    console.error("→ 로컬 실행 시 .env 에 MONGODB_URI 를 설정하세요.");
    process.exit(1);
  });
}

module.exports = { ensureAmcCatalog };

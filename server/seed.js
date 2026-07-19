"use strict";

const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const Notice = require("./models/Notice");
const Product = require("./models/Product");
const { ensureAmcCatalog } = require("./utils/ensureCatalog");
const { ensureAdmin } = require("./utils/ensureAdmin");
const { ensureHalls } = require("./utils/ensureHalls");
const { ensureFuneralForms } = require("./utils/ensureFuneralForms");

async function seedAdmin() {
  const r = await ensureAdmin();
  console.log(r.created ? `+ 관리자 계정 생성: ${r.username}` : `- 관리자 계정 이미 존재: ${r.username}`);
}

async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) {
    console.log(`- 상품 ${count}건 존재 (시드 건너뜀)`);
    return;
  }
  const samples = [];
  if (samples.length === 0) {
    console.log("- 샘플 상품 없음 (시드 건너뜀)");
    return;
  }
  await Product.insertMany(samples);
  console.log(`+ 샘플 상품 ${samples.length}건 생성`);
}

async function seedAmcCatalog() {
  const r = await ensureAmcCatalog();
  console.log(`+ 관 ${r.coffins.total}건 (신규 ${r.coffins.created})`);
  console.log(`+ 횡대 ${r.hoengdae.total}건 (신규 ${r.hoengdae.created})`);
  console.log(`+ 수의 ${r.shrouds.total}건 (신규 ${r.shrouds.created})`);
  console.log(`+ 부속물품 ${r.accessories.total}건 (신규 ${r.accessories.created})`);
  console.log(`+ 접객 음식 ${r.foodItems.total}건 (신규 ${r.foodItems.created})`);
  console.log(`+ 근조 화환 ${r.flowerItems.total}건 (신규 ${r.flowerItems.created})`);
  console.log(`+ 영정 사진 ${r.photoItems.total}건 (신규 ${r.photoItems.created})`);
  console.log(`+ 상복 대여 ${r.dressItems.total}건 (신규 ${r.dressItems.created})`);
  console.log(`+ 운구·차량 ${r.hearseItems.total}건 (신규 ${r.hearseItems.created})`);
  console.log(`+ 서비스 요금 ${r.servicePrices.total}건 (신규 ${r.servicePrices.created})`);
}

async function seedNotice() {
  const count = await Notice.countDocuments();
  if (count > 0) {
    console.log(`- 알림소식 ${count}건 존재 (시드 건너뜀)`);
    return;
  }
  await Notice.create({
    title: "인천병원장례식장 홈페이지가 새단장했습니다.",
    content:
      "안녕하세요. 인천병원장례식장(인천중앙병원장례식장)입니다.\n홈페이지를 새롭게 단장하여 빈소 안내, 온라인 추모, 상담 문의를 더욱 편리하게 이용하실 수 있습니다.\n24시간 상담: 032-524-4444",
    category: "공지",
    pinned: true,
  });
  console.log("+ 샘플 알림소식 1건 생성");
}

async function seedHalls() {
  const r = await ensureHalls();
  if (r.migrated) console.log("+ 구 빈소 데이터를 규격 카탈로그 구조로 전환");
  console.log(`+ 빈소 규격 ${r.total}건 (신규 ${r.created})`);
}

async function seedFuneralForms() {
  const r = await ensureFuneralForms();
  if (r.created) console.log(`+ 관련서식 ${r.total}건 (신규 ${r.created})`);
  else console.log(`- 관련서식 ${r.total}건 존재 (시드 건너뜀)`);
}

async function main() {
  await connectDB();
  console.log("[SEED] 시작");
  await seedAdmin();
  await seedProducts();
  await seedAmcCatalog();
  await seedNotice();
  await seedHalls();
  await seedFuneralForms();
  console.log("[SEED] 완료");
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error("[SEED] 오류:", err);
  process.exit(1);
});

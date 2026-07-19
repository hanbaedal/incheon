"use strict";

const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const Notice = require("./models/Notice");
const Product = require("./models/Product");
const Hall = require("./models/Hall");
const { ensureAmcCatalog } = require("./utils/ensureCatalog");
const { ensureAdmin } = require("./utils/ensureAdmin");

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
  const samples = [
    { category: "접객 음식", catKey: "food", name: "육개장 (1인)", description: "조문객 접대용 육개장", price: 9000, unit: "식", sortOrder: 1 },
    { category: "접객 음식", catKey: "food", name: "편육 모둠", description: "편육·나물 등 모둠 상차림", price: 60000, unit: "판", sortOrder: 2 },
    { category: "공산품류", catKey: "consumables", name: "생수", description: "500ml 생수 — 소비 후 발인 전 정산", price: 500, unit: "병", settlementType: "postpaid", sortOrder: 1 },
    { category: "공산품류", catKey: "consumables", name: "음료수", description: "캔/페트 음료 — 소비 후 발인 전 정산", price: 1500, unit: "개", settlementType: "postpaid", sortOrder: 2 },
    { category: "공산품류", catKey: "consumables", name: "주류(별도)", description: "맥주·소주 등 — 소비 후 발인 전 정산", price: 5000, unit: "병", settlementType: "postpaid", sortOrder: 3 },
    { category: "공산품류", catKey: "consumables", name: "티슈", description: "빈소용 티슈 — 소비 후 발인 전 정산", price: 800, unit: "개", settlementType: "postpaid", sortOrder: 4 },
    { category: "근조 화환", catKey: "flower", name: "3단 근조화환", description: "조문객용 3단 근조화환", price: 90000, unit: "개", sortOrder: 1 },
    { category: "영정 사진", catKey: "photo", name: "영정사진 (14R)", description: "고인 영정사진 제작 및 액자", price: 80000, unit: "점", sortOrder: 1 },
    { category: "상복 대여", catKey: "dress", name: "남성 상복 대여", description: "상·하의 세트 대여", price: 30000, unit: "벌", sortOrder: 1 },
    { category: "운구·차량", catKey: "hearse", name: "리무진 운구차", description: "발인 운구 리무진", price: 400000, unit: "대", sortOrder: 1 },
  ];
  await Product.insertMany(samples);
  console.log(`+ 샘플 상품 ${samples.length}건 생성`);
}

async function seedAmcCatalog() {
  const r = await ensureAmcCatalog();
  console.log(`+ 관 ${r.coffins.total}건 (신규 ${r.coffins.created}, 갱신 ${r.coffins.updated})`);
  console.log(`+ 횡대 ${r.hoengdae.total}건 (신규 ${r.hoengdae.created})`);
  console.log(`+ 수의 ${r.shrouds.total}건 (신규 ${r.shrouds.created})`);
  console.log(`+ 부속물품 ${r.accessories.total}건 (신규 ${r.accessories.created})`);
}

async function seedNotice() {
  const count = await Notice.countDocuments();
  if (count > 0) {
    console.log(`- 알림소식 ${count}건 존재 (시드 건너뜀)`);
    return;
  }
  await Notice.create({
    title: "근로복지공단 인천병원 장례식장 홈페이지가 새단장했습니다.",
    content:
      "안녕하세요. 근로복지공단 인천병원 장례식장입니다.\n홈페이지를 새롭게 단장하여 빈소 안내, 온라인 추모, 상담 문의를 더욱 편리하게 이용하실 수 있습니다.\n24시간 상담: 032-205-1100",
    category: "공지",
    pinned: true,
  });
  console.log("+ 샘플 알림소식 1건 생성");
}

async function seedHalls() {
  const count = await Hall.countDocuments();
  if (count > 0) {
    console.log(`- 빈소 ${count}건 존재 (시드 건너뜀)`);
    return;
  }
  const halls = [
    { hallNumber: "특1호실", status: "available" },
    { hallNumber: "1호실", status: "available" },
    { hallNumber: "2호실", status: "available" },
    { hallNumber: "3호실", status: "available" },
  ];
  await Hall.insertMany(halls);
  console.log(`+ 샘플 빈소 ${halls.length}건 생성`);
}

async function main() {
  await connectDB();
  console.log("[SEED] 시작");
  await seedAdmin();
  await seedProducts();
  await seedAmcCatalog();
  await seedNotice();
  await seedHalls();
  console.log("[SEED] 완료");
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error("[SEED] 오류:", err);
  process.exit(1);
});

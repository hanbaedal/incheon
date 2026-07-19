"use strict";

const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const Notice = require("./models/Notice");
const Product = require("./models/Product");
const Coffin = require("./models/Coffin");
const Hoengdae = require("./models/Hoengdae");
const Hall = require("./models/Hall");
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
    { category: "수의(壽衣)", catKey: "shroud", name: "삼베 수의 (국내산)", description: "국내산 삼베 원단 수의", price: 800000, unit: "벌", sortOrder: 1 },
    { category: "염습·부속 용품", catKey: "etc", name: "염지 세트", description: "염습용 기본 부속품", price: 120000, unit: "세트", sortOrder: 1 },
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

// 서울아산병원 장례식장 관/횡대 안내 표 참고 (단위: ㎜)
async function seedCoffins() {
  const count = await Coffin.countDocuments();
  if (count > 0) {
    console.log(`- 관 ${count}건 존재 (시드 건너뜀)`);
    return;
  }
  const samples = [
    { name: "오동집성관(1.0분)", shoulder: "490", height: 355, length: 1870, thickness: "28", origin: "중국", sortOrder: 1 },
    { name: "오동집성특관(1.0분)", shoulder: "520", height: 385, length: 1948, thickness: "28", origin: "중국", sortOrder: 2 },
    { name: "오동집성관(1.5분)", shoulder: "505", height: 386, length: 1970, thickness: "43", origin: "중국", sortOrder: 3 },
    { name: "오동집성특관(1.5분)", shoulder: "535", height: 410, length: 1975, thickness: "43", origin: "중국", sortOrder: 4 },
    { name: "고급오동집성관(1.5분)", shoulder: "545", height: 420, length: 1980, thickness: "43", origin: "중국", sortOrder: 5 },
    { name: "고급오동집성특관(1.5분)", shoulder: "575", height: 450, length: 1980, thickness: "43", origin: "중국", sortOrder: 6 },
    { name: "오동애관(0.4분)", shoulder: "1,500미만", height: null, length: null, thickness: "", origin: "중국", sortOrder: 7 },
    { name: "금잔화", shoulder: "525", height: 390, length: 1944, thickness: "27/24", origin: "중국", sortOrder: 8 },
    { name: "민들레", shoulder: "530", height: 480, length: 1945, thickness: "25/17", origin: "중국", sortOrder: 9 },
    { name: "무궁화", shoulder: "555", height: 437, length: 1975, thickness: "25/17", origin: "중국", sortOrder: 10 },
    { name: "솔송특관(1.5분)", shoulder: "540", height: 420, length: 1985, thickness: "43", origin: "중국", sortOrder: 11 },
    { name: "솔송고급관(1.5분)", shoulder: "545", height: 425, length: 1975, thickness: "43", origin: "중국", sortOrder: 12 },
    { name: "참숫관", shoulder: "620", height: 504, length: 2020, thickness: "52/17", origin: "중국", sortOrder: 13 },
    { name: "향고급관(1.5분)", shoulder: "545", height: 425, length: 1975, thickness: "43", origin: "중국", sortOrder: 14 },
    { name: "향조각관(1.5분)", shoulder: "670", height: 455, length: 1990, thickness: "43", origin: "중국", sortOrder: 15 },
  ];
  await Coffin.insertMany(samples);
  console.log(`+ 관 ${samples.length}건 생성 (AMC 규격표)`);
}

async function seedHoengdae() {
  const count = await Hoengdae.countDocuments();
  if (count > 0) {
    console.log(`- 횡대 ${count}건 존재 (시드 건너뜀)`);
    return;
  }
  const samples = [
    { name: "횡대(오동2.0)", vertical: 300, horizontal: 660, thickness: 58, origin: "중국", sortOrder: 1 },
    { name: "횡대(솔송1.5)", vertical: 300, horizontal: 660, thickness: 43, origin: "중국", sortOrder: 2 },
    { name: "횡대(향1.5)", vertical: 300, horizontal: 660, thickness: 43, origin: "중국", sortOrder: 3 },
    { name: "횡대(향맞춤)", vertical: 300, horizontal: 750, thickness: 43, origin: "중국", sortOrder: 4 },
  ];
  await Hoengdae.insertMany(samples);
  console.log(`+ 횡대 ${samples.length}건 생성 (AMC 규격표)`);
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
  await seedCoffins();
  await seedHoengdae();
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

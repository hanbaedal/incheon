"use strict";

const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const Notice = require("./models/Notice");
const Product = require("./models/Product");
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
    { category: "관·수의", name: "오동나무 관 (상)", price: 350000, unit: "개", sortOrder: 1 },
    { category: "관·수의", name: "삼베 수의 (국내산)", price: 800000, unit: "벌", sortOrder: 2 },
    { category: "접객 음식", name: "육개장 (1인)", price: 9000, unit: "식", sortOrder: 3 },
    { category: "접객 음식", name: "편육 모둠", price: 60000, unit: "판", sortOrder: 4 },
    { category: "근조 화환", name: "3단 근조화환", price: 90000, unit: "개", sortOrder: 5 },
    { category: "운구·차량", name: "리무진 운구차", price: 400000, unit: "대", sortOrder: 6 },
  ];
  await Product.insertMany(samples);
  console.log(`+ 샘플 상품 ${samples.length}건 생성`);
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

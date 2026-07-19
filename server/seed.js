"use strict";

const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const Notice = require("./models/Notice");
const Product = require("./models/Product");
const Coffin = require("./models/Coffin");
const Hoengdae = require("./models/Hoengdae");
const Shroud = require("./models/Shroud");
const Accessory = require("./models/Accessory");
const Hall = require("./models/Hall");
const COFFIN_SAMPLES = require("./constants/coffinSamples");
const { upsertCoffins } = require("./seedCoffins");
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

// 서울아산병원 장례식장 관/횡대 안내 표 참고 (단위: ㎜)
async function seedCoffins() {
  const r = await upsertCoffins();
  console.log(`+ 관 ${r.total}건 동기화 (신규 ${r.created}, 갱신 ${r.updated})`);
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

async function seedShrouds() {
  const count = await Shroud.countDocuments();
  if (count > 0) {
    console.log(`- 수의 ${count}건 존재 (시드 건너뜀)`);
    return;
  }
  const samples = [
    { name: "멧베 7호", material: "15수대마 100%", weaveType: "", yarnOrigin: "중국", fabricOrigin: "한국", sortOrder: 1 },
    { name: "멧베 10호", material: "대마 100%", weaveType: "", yarnOrigin: "중국", fabricOrigin: "중국", sortOrder: 2 },
    { name: "고급한복수의", material: "실크 100%", weaveType: "기계직", yarnOrigin: "중국", fabricOrigin: "한국", sortOrder: 3 },
    { name: "천상수의1호", material: "대마 100%", weaveType: "수제직", yarnOrigin: "중국", fabricOrigin: "중국", sortOrder: 4 },
    { name: "천상수의4호", material: "명주 50% / 대마 50%", weaveType: "기계직", yarnOrigin: "중국", fabricOrigin: "경북 상주시 함창 / 중국", sortOrder: 5 },
    { name: "천상수의5호", material: "명주 100%", weaveType: "기계직", yarnOrigin: "중국", fabricOrigin: "경북 상주시 함창", sortOrder: 6 },
    { name: "천상수의6호", material: "대마 100%", weaveType: "반수공", yarnOrigin: "중국", fabricOrigin: "중국", sortOrder: 7 },
    { name: "천상수의7호", material: "15수대마 100%", weaveType: "기계직", yarnOrigin: "중국", fabricOrigin: "한국", sortOrder: 8 },
    { name: "천상수의8호", material: "아마 100%", weaveType: "기계직", yarnOrigin: "중국", fabricOrigin: "광주 화순일원", sortOrder: 9 },
    { name: "천상수의9호", material: "대마 100%", weaveType: "기계직", yarnOrigin: "중국", fabricOrigin: "중국", sortOrder: 10 },
    { name: "천상수의10호", material: "저마 100%", weaveType: "기계직", yarnOrigin: "중국", fabricOrigin: "중국", sortOrder: 11 },
    { name: "천상수의12호", material: "혼용사", weaveType: "기계직", yarnOrigin: "중국", fabricOrigin: "중국", sortOrder: 12 },
  ];
  await Shroud.insertMany(samples);
  console.log(`+ 수의 ${samples.length}건 생성 (AMC 규격표)`);
}

async function seedAccessories() {
  const count = await Accessory.countDocuments();
  if (count > 0) {
    console.log(`- 부속물품 ${count}건 존재 (시드 건너뜀)`);
    return;
  }
  const samples = [
    { name: "명정", spec: "명주 100%", sortOrder: 1 },
    { name: "관보", spec: "면/폴리", sortOrder: 2 },
    { name: "결관포", spec: "소창 20마/필", sortOrder: 3 },
    { name: "부의록", spec: "상품", sortOrder: 4 },
    { name: "양초", spec: "초대", sortOrder: 5 },
    { name: "예단특", spec: "1조(천)", sortOrder: 6 },
    { name: "보공", spec: "10개묶음", sortOrder: 7 },
    { name: "습신", spec: "본견", sortOrder: 8 },
    { name: "위폐(향나무)", spec: "향나무", sortOrder: 9 },
    { name: "한지", spec: "20매", sortOrder: 10 },
    { name: "탈지면", spec: "50g", sortOrder: 11 },
    { name: "완장", spec: "혼용사", sortOrder: 12 },
    { name: "사진리본", spec: "검정", sortOrder: 13 },
    { name: "베게", spec: "면", sortOrder: 14 },
    { name: "장갑(장의용)", spec: "면", sortOrder: 15 },
    { name: "근조리본", spec: "폴리", sortOrder: 16 },
    { name: "칠성판", spec: "오동나무", sortOrder: 17 },
    { name: "차량리본", spec: "1대분", sortOrder: 18 },
    { name: "혼백", spec: "종이", sortOrder: 19 },
    { name: "축문", spec: "책", sortOrder: 20 },
    { name: "만복향", spec: "고급향", sortOrder: 21 },
    { name: "염보", spec: "면/인견", sortOrder: 22 },
    { name: "수시복건", spec: "공단/천연펄프", sortOrder: 23 },
  ];
  await Accessory.insertMany(samples);
  console.log(`+ 부속물품 ${samples.length}건 생성 (AMC 규격표)`);
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
  await seedShrouds();
  await seedAccessories();
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

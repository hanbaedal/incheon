"use strict";

const FuneralForm = require("../models/FuneralForm");

const DEFAULT_FORMS = [
  { name: "시체[매장·화장]신고서", description: "시체 매장·화장 신고" },
  { name: "사태[매장·화장]신고서", description: "사태 매장·화장 신고" },
  { name: "개장[신고서·허가신청서]", description: "개장 신고·허가" },
  { name: "개인묘지설치[변경]신고서", description: "개인묘지 설치·변경" },
  { name: "[가족·종중·문중·법인]묘지설치[변경]허가신청서", description: "묘지 설치·변경 허가 신청" },
  { name: "[가족·종중·문중·법인]묘지설치[변경]허가증", description: "묘지 설치·변경 허가증" },
  { name: "화장장[납골당]설치[변경]신고서", description: "화장장·납골당 설치·변경" },
  { name: "화장·납골시설 설치[변경]신고필증", description: "화장·납골시설 신고필증" },
  { name: "납골묘[탑] 설치[변경] 신고필증", description: "납골묘·탑 설치·변경" },
  { name: "묘적부", description: "묘적부" },
  { name: "매장·화장·개장 신고[허가]관리대장", description: "매장·화장·개장 관리대장" },
  { name: "묘지[화장장·납골시설]설치허가[신고]관리대장", description: "묘지·화장장·납골시설 관리대장" },
  { name: "[시체·사태·개장유골]화장[납골]증명서", description: "화장·납골 증명서" },
  { name: "화장·납골관리대장", description: "화장·납골 관리대장" },
  { name: "분묘설치기간연장신청서", description: "분묘 설치기간 연장" },
  { name: "가격표", description: "장례식장 가격표" },
  { name: "행정처분대장", description: "행정처분대장" },
  { name: "묘지·화장장·납골시설관리·운영부", description: "묘지·화장장·납골시설 운영부" },
  { name: "장례식장[시체처리실]관리·운영부", description: "장례식장·시체처리실 운영부" },
];

async function ensureFuneralForms() {
  const count = await FuneralForm.countDocuments();
  if (count > 0) return { created: 0, total: count };

  await FuneralForm.insertMany(
    DEFAULT_FORMS.map((f, i) => ({
      name: f.name,
      description: f.description,
      sortOrder: i + 1,
      active: true,
    }))
  );
  return { created: DEFAULT_FORMS.length, total: DEFAULT_FORMS.length };
}

module.exports = { ensureFuneralForms, DEFAULT_FORMS };

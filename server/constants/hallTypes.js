"use strict";

/** 빈소 규격 카탈로그 (MongoDB Hall 컬렉션 시드용) */
const HALL_CATALOG = [
  {
    code: "35",
    name: "35평형",
    areaLabel: "약 115㎡",
    capacity: "50명 내외",
    feature: "소규모 가족장",
    sortOrder: 1,
    isVirtual: false,
  },
  {
    code: "50",
    name: "50평형",
    areaLabel: "약 165㎡",
    capacity: "80~100명",
    feature: "실속형 (가장 많이 선택)",
    sortOrder: 2,
    isVirtual: false,
  },
  {
    code: "80",
    name: "80평형",
    areaLabel: "약 264㎡",
    capacity: "120명 이상",
    feature: "프리미엄",
    sortOrder: 3,
    isVirtual: false,
  },
  {
    code: "none",
    name: "무빈소",
    areaLabel: "",
    capacity: "",
    feature: "빈소 없이 진행 (상담 가능)",
    sortOrder: 4,
    isVirtual: true,
  },
];

module.exports = { HALL_CATALOG };

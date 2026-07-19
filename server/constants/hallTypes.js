"use strict";

/** 빈소 규격 라벨 */
const HALL_SPEC_LABELS = {
  "35": "35평형",
  "50": "50평형",
  "80": "80평형",
  none: "무빈소",
};

/**
 * 빈소 마스터 — 호실(101·102·103·109) + 규격(specCode) 매핑
 * MongoDB Hall 컬렉션 시드용
 */
const HALL_ROOMS = [
  {
    code: "101",
    name: "101호",
    specCode: "35",
    specLabel: "35평형",
    areaLabel: "약 115㎡",
    capacity: "50명 내외",
    feature: "소규모 가족장",
    sortOrder: 1,
    isVirtual: false,
  },
  {
    code: "102",
    name: "102호",
    specCode: "50",
    specLabel: "50평형",
    areaLabel: "약 165㎡",
    capacity: "80~100명",
    feature: "실속형 (가장 많이 선택)",
    sortOrder: 2,
    isVirtual: false,
  },
  {
    code: "103",
    name: "103호",
    specCode: "80",
    specLabel: "80평형",
    areaLabel: "약 264㎡",
    capacity: "120명 이상",
    feature: "프리미엄",
    sortOrder: 3,
    isVirtual: false,
  },
  {
    code: "109",
    name: "109호",
    specCode: "none",
    specLabel: "무빈소",
    areaLabel: "",
    capacity: "",
    feature: "빈소 없이 진행 (상담 가능)",
    sortOrder: 4,
    isVirtual: true,
  },
];

/** 구 규격 코드 → 신규 호실 코드 */
const LEGACY_SPEC_TO_ROOM = {
  "35": "101",
  "50": "102",
  "80": "103",
  none: "109",
};

module.exports = { HALL_ROOMS, HALL_SPEC_LABELS, LEGACY_SPEC_TO_ROOM };

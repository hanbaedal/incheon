"use strict";

const { DRESS_ITEM_UNITS } = require("./dressCategories");

// 서울아산병원 장례식장 예복 안내(menuId=3855) — 품목·치수별 등록
let order = 0;
const next = () => ++order;

function sizes(name, specs) {
  const unit = DRESS_ITEM_UNITS[name] || "1개";
  return specs.map((spec) => ({
    name,
    spec: String(spec),
    unit,
    sortOrder: next(),
  }));
}

module.exports = [
  ...sizes("예복정장", ["95", "100", "105", "110"]),
  ...sizes("여성예복", ["44", "55", "66", "77"]),
  ...sizes("와이셔츠", ["95", "100", "105", "110"]),
  ...sizes("벨트", ["Free"]),
  ...sizes("양말", ["Free"]),
  ...sizes("구두", ["240", "250", "260", "270", "280"]),
  ...sizes("넥타이", ["표준"]),
  ...sizes("런닝셔츠", ["95", "100", "105", "110"]),
];

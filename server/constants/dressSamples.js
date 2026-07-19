"use strict";

// 서울아산병원 장례식장 예복 안내(menuId=3855) 판매품목 참고
let order = 0;
const next = () => ++order;

function item(dressCategory, name, opts) {
  const o = opts || {};
  return {
    dressCategory,
    name,
    spec: o.spec || "",
    unit: o.unit || "1개",
    sortOrder: next(),
  };
}

module.exports = [
  item("women", "여성예복", { spec: "치수별", unit: "1벌" }),
  item("shirt", "와이셔츠", { spec: "95~110", unit: "1벌" }),
  item("belt", "벨트", { spec: "Free", unit: "1개" }),
  item("socks", "양말", { spec: "Free", unit: "1켤레" }),
  item("shoes", "구두", { spec: "240~280", unit: "1켤레" }),
  item("tie", "넥타이", { spec: "표준", unit: "1개" }),
  item("undershirt", "런닝셔츠", { spec: "95~110", unit: "1벌" }),
];

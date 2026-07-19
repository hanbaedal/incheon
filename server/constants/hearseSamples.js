"use strict";

// 서울아산병원 장례식장 운구차 안내(menuId=3856) 참고
let order = 0;
const next = () => ++order;

function item(hearseCategory, name, opts) {
  const o = opts || {};
  return {
    hearseCategory,
    name,
    spec: o.spec || "",
    unit: o.unit || "1대",
    description: o.description || "",
    sortOrder: next(),
  };
}

module.exports = [
  item("cadillac", "캐딜락", { spec: "운구 + 동승 2~3인", description: "캐딜락 운구차" }),
  item("limousine", "고급리무진", { spec: "운구 + 동승 소수", description: "고급리무진형 운구차" }),
];

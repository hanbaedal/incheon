"use strict";

// 서울아산병원 장례식장 화원 안내(menuId=3853) 참고
let order = 0;
const next = () => ++order;

function item(flowerCategory, name, opts) {
  const o = opts || {};
  return {
    flowerCategory,
    name,
    spec: o.spec || "",
    description: o.description || "",
    price: o.price != null ? o.price : 0,
    unit: o.unit || "개",
    sortOrder: next(),
  };
}

module.exports = [
  // 제단장식 — AMC 1~11호 (가격: funeralhallinfo 수집 기준)
  item("altar", "1호", { price: 550000 }),
  item("altar", "2호", { price: 750000 }),
  item("altar", "3호", { price: 950000 }),
  item("altar", "4호", { price: 1200000 }),
  item("altar", "5호", { price: 1500000 }),
  item("altar", "6호", { price: 1800000 }),
  item("altar", "7호", { price: 2100000 }),
  item("altar", "8호", { price: 2400000 }),
  item("altar", "9호", { price: 2700000 }),
  item("altar", "10호", { price: 5000000 }),
  item("altar", "11호", { price: 9000000 }),

  // 근조바구니
  item("basket", "꽃바구니 B"),
  item("basket", "꽃바구니 C"),
  item("basket", "꽃바구니 D"),

  // 조문용 조화
  item("wreath", "근조화환 3단"),

  // 헌화용 국화
  item("chrysanthemum", "헌화용 국화", { unit: "세트" }),

  // 관장식
  item("coffin", "관 일반"),
  item("coffin", "관보 일반"),
  item("coffin", "사방화"),
  item("coffin", "종교(불교)"),
  item("coffin", "종교(십자가)"),

  // 차량장식
  item("vehicle", "2호"),
  item("vehicle", "5호"),
  item("vehicle", "링컨"),
];

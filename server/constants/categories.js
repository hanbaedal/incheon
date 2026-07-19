"use strict";

const CAT_KEYS = ["coffin", "shroud", "etc", "food", "flower", "photo", "dress", "hearse"];

const CAT_LABELS = {
  coffin: "관·횡대",
  shroud: "수의(壽衣)",
  etc: "염습·부속 용품",
  food: "접객 음식",
  flower: "근조 화환",
  photo: "영정 사진",
  dress: "상복 대여",
  hearse: "운구·차량",
};

const SETTLEMENT_TYPES = ["prepaid", "postpaid"];

module.exports = { CAT_KEYS, CAT_LABELS, SETTLEMENT_TYPES };

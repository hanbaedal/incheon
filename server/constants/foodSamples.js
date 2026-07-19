"use strict";

// 서울아산병원 장례식장 접객 음식 안내(menuId=3852) 참고
let order = 0;
const next = () => ++order;

function meal(name, subGroup) {
  return { foodCategory: "meal", name, subGroup, sortOrder: next() };
}
function anju(name, subGroup) {
  return { foodCategory: "anju", name, subGroup, sortOrder: next() };
}
function tteok(name) {
  return { foodCategory: "tteok", name, subGroup: "", sortOrder: next() };
}
function fruit(name) {
  return { foodCategory: "fruit", name, subGroup: "", sortOrder: next() };
}
function postpaid(foodCategory, name, subGroup) {
  return { foodCategory, name, subGroup: subGroup || "", settlementType: "postpaid", sortOrder: next() };
}

module.exports = [
  // 식사류
  meal("밥(6kg/30인분)", "식사류"),
  meal("김치(4kg)", "반찬류"),
  meal("현미밥(6kg/30인분)", "식사류"),
  meal("꽈리멸치볶음(2kg)", "반찬류"),
  meal("아욱된장국(8kg/30인분)", "식사류"),
  meal("황태찜(3kg)", "반찬류"),
  meal("육개장(8kg/30인분)", "식사류"),
  meal("느타리버섯볶음(3kg)", "반찬류"),
  meal("황태국(8kg/30인분)", "식사류"),
  meal("호박나물볶음(3kg)", "반찬류"),
  meal("사골우거지국(8kg/30인분)", "식사류"),
  meal("오색나물(3kg)", "반찬류"),
  meal("소고기무국(8kg/30인분)", "식사류"),

  // 안주류
  anju("갑오징어초무침(3kg)", "안주류"),
  anju("믹스너츠(1kg/봉)", "마른안주류"),
  anju("홍어회무침(3kg)", "안주류"),
  anju("참진미오징어채(400g/봉)", "마른안주류"),
  anju("골뱅이무침(3kg)", "안주류"),
  anju("삼겹수육(2kg)", "안주류"),
  anju("모듬전(4kg)", "안주류"),
  anju("불고기(호주산,4kg)", "안주류"),
  anju("야채과일샐러드(3kg)", "안주류"),

  // 떡류
  tteok("모시송편(5kg)"),
  tteok("콩찰떡(5kg)"),
  tteok("송편(5kg)"),
  tteok("모듬백이(5kg)"),
  tteok("절편(5kg)"),
  tteok("증편(5kg)"),
  tteok("꿀떡(5kg)"),
  tteok("약식(5kg)"),
  tteok("단호박설기(4kg)"),
  tteok("흑미찰떡(5kg)"),
  tteok("쑥설기(4kg)"),
  tteok("호박찰떡(5kg)"),

  // 과일류
  fruit("오렌지(6kg)"),
  fruit("방울토마토(4pack)"),
  fruit("귤(3kg)"),
  fruit("수박(8kg)"),

  // 제사상 (AMC 페이지는 구성 상담 — 기본 품목)
  { foodCategory: "jesa", name: "제사상 기본 구성", subGroup: "", description: "종교·예법에 맞춰 구성 상담", sortOrder: next() },

  // 식음료류 (소비 후 정산)
  postpaid("beverage", "일반음료"),
  postpaid("beverage", "건강음료"),
  postpaid("beverage", "차류"),
  postpaid("beverage", "생수"),
  postpaid("beverage", "주류"),

  // 공산품류 (소비 후 정산)
  postpaid("consumables", "장의용품"),
  postpaid("consumables", "일회용/문구류"),
  postpaid("consumables", "소모품류"),
  postpaid("consumables", "일회용(밀폐용기)"),
  postpaid("consumables", "티슈"),
];

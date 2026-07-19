"use strict";

// 서울아산병원 장례식장 사진실 안내(menuId=3854) 참고
let order = 0;
const next = () => ++order;

const PORTRAIT_SIZES = ["8×10", "11×14", "13×17", "16×20", "20×24"];
const STORAGE_SIZES = ["3×4cm", "5×7cm", "3×5inch", "4×6inch", "5×7inch"];

function portrait(subGroup, name) {
  return { photoCategory: "portrait", name, subGroup, sortOrder: next() };
}
function frame(name) {
  return { photoCategory: "frame", name, subGroup: "원목액자", sortOrder: next() };
}
function idphoto(name, spec) {
  return { photoCategory: "idphoto", name, subGroup: "", spec, sortOrder: next() };
}
function instant(name, spec) {
  return { photoCategory: "instant", name, subGroup: "", spec, sortOrder: next() };
}

module.exports = [
  // 영정
  ...PORTRAIT_SIZES.map((s) => portrait("칼라/액자", s)),
  ...PORTRAIT_SIZES.map((s) => portrait("사진만", s)),
  ...STORAGE_SIZES.map((s) => portrait("명함판 크기 보관용", s)),

  // 액자
  ...PORTRAIT_SIZES.map((s) => frame(s)),

  // 증명사진
  idphoto("일반", "3×4cm"),
  idphoto("명함", "5×7cm"),
  idphoto("여권", "3.5×4.5cm"),

  // 즉석사진
  instant("폴라로이드", "3×5cm, 1매"),
];

"use strict";

const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema(
  {
    hallNumber: { type: String, required: true, unique: true, trim: true }, // 예: "특1호실"
    deceasedName: { type: String, trim: true, default: "" }, // 고인명
    chiefMourner: { type: String, trim: true, default: "" }, // 상주
    relationship: { type: String, trim: true, default: "" }, // 관계
    age: { type: String, trim: true, default: "" },
    enshrinedAt: { type: String, trim: true, default: "" }, // 입관/안치
    funeralDate: { type: String, trim: true, default: "" }, // 발인 일자
    funeralTime: { type: String, trim: true, default: "" }, // 발인 시각
    burialSite: { type: String, trim: true, default: "" }, // 장지
    status: { type: String, enum: ["in-use", "available"], default: "available", index: true },
    // 상주(유족) 접근 코드 — 공개 API 응답에서는 제외
    familyCode: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// 공개용(민감정보 제외)
hallSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    hallNumber: this.hallNumber,
    deceasedName: this.deceasedName,
    chiefMourner: this.chiefMourner,
    relationship: this.relationship,
    funeralDate: this.funeralDate,
    funeralTime: this.funeralTime,
    burialSite: this.burialSite,
    status: this.status,
    updatedAt: this.updatedAt,
  };
};

// 관리자용(familyCode 포함)
hallSchema.methods.toAdminJSON = function toAdminJSON() {
  return {
    ...this.toPublicJSON(),
    age: this.age,
    enshrinedAt: this.enshrinedAt,
    familyCode: this.familyCode,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.models.Hall || mongoose.model("Hall", hallSchema);

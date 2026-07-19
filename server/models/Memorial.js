"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 추모글 / 헌화
const memorialSchema = new mongoose.Schema(
  {
    hallUsageId: { type: mongoose.Schema.Types.ObjectId, ref: "HallUsage", required: true, index: true },
    author: { type: String, required: true, trim: true }, // 작성자
    relation: { type: String, trim: true, default: "" }, // 고인과의 관계
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["condolence", "flower"], default: "condolence" },
    // 비회원 작성글 수정/삭제용 비밀번호 해시(선택)
    passwordHash: { type: String, default: "" },
    hidden: { type: Boolean, default: false }, // 관리자 숨김 처리
  },
  { timestamps: true }
);

memorialSchema.methods.setPassword = async function setPassword(plain) {
  if (!plain) return;
  this.passwordHash = await bcrypt.hash(String(plain), 10);
};

memorialSchema.methods.verifyPassword = function verifyPassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(String(plain || ""), this.passwordHash);
};

memorialSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    hallUsageId: this.hallUsageId,
    author: this.author,
    relation: this.relation,
    message: this.message,
    type: this.type,
    hidden: this.hidden,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.models.Memorial || mongoose.model("Memorial", memorialSchema);

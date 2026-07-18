"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 온라인 문의
const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "일반문의" },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    isPrivate: { type: Boolean, default: false }, // 비공개(작성자/관리자만)
    passwordHash: { type: String, default: "" }, // 비공개글 확인/수정용
    status: { type: String, enum: ["pending", "answered", "closed"], default: "pending", index: true },
    answer: { type: String, default: "" },
    answeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inquirySchema.methods.setPassword = async function setPassword(plain) {
  if (!plain) return;
  this.passwordHash = await bcrypt.hash(String(plain), 10);
};

inquirySchema.methods.verifyPassword = function verifyPassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(String(plain || ""), this.passwordHash);
};

// 목록/공개용 — 비공개글은 제목·본문 마스킹
inquirySchema.methods.toListJSON = function toListJSON() {
  const base = {
    id: this._id,
    name: maskName(this.name),
    category: this.category,
    status: this.status,
    isPrivate: this.isPrivate,
    createdAt: this.createdAt,
  };
  base.title = this.isPrivate ? "비공개 문의입니다." : this.title;
  return base;
};

inquirySchema.methods.toDetailJSON = function toDetailJSON() {
  return {
    id: this._id,
    name: maskName(this.name),
    category: this.category,
    title: this.title,
    message: this.message,
    isPrivate: this.isPrivate,
    status: this.status,
    answer: this.answer,
    answeredAt: this.answeredAt,
    createdAt: this.createdAt,
  };
};

inquirySchema.methods.toAdminJSON = function toAdminJSON() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    email: this.email,
    category: this.category,
    title: this.title,
    message: this.message,
    isPrivate: this.isPrivate,
    status: this.status,
    answer: this.answer,
    answeredAt: this.answeredAt,
    createdAt: this.createdAt,
  };
};

function maskName(name) {
  const s = String(name || "");
  if (s.length <= 1) return s;
  if (s.length === 2) return s[0] + "*";
  return s[0] + "*".repeat(s.length - 2) + s[s.length - 1];
}

module.exports = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);

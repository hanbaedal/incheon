"use strict";

const mongoose = require("mongoose");

// 알림 소식(공지)
const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, trim: true, default: "공지" }, // 공지/안내/이벤트 등
    pinned: { type: Boolean, default: false, index: true }, // 상단 고정
    published: { type: Boolean, default: true, index: true },
    views: { type: Number, default: 0 },
    author: { type: String, trim: true, default: "관리자" },
  },
  { timestamps: true }
);

noticeSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    category: this.category,
    pinned: this.pinned,
    published: this.published,
    views: this.views,
    author: this.author,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.models.Notice || mongoose.model("Notice", noticeSchema);

"use strict";

const mongoose = require("mongoose");

// 관 (규격·원산지 중심 — 서울아산병원 장례식장 안내 표 참고)
const coffinSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    shoulder: { type: String, default: "" }, // 어깨(㎜) 또는 "1,500미만" 등
    height: { type: Number, default: null }, // 높이(㎜)
    length: { type: Number, default: null }, // 길이(㎜)
    thickness: { type: String, default: "" }, // 두께(㎜), "25/17" 등
    origin: { type: String, default: "" }, // 원산지
    price: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "개" },
    description: { type: String, default: "" },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductImage", default: null },
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

coffinSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    name: this.name,
    shoulder: this.shoulder,
    height: this.height,
    length: this.length,
    thickness: this.thickness,
    origin: this.origin,
    price: this.price,
    unit: this.unit,
    description: this.description,
    imageId: this.imageId,
    imageUrl: this.imageId ? `/api/images/${this.imageId}` : "",
    taxable: this.taxable,
    active: this.active,
    sortOrder: this.sortOrder,
  };
};

module.exports = mongoose.models.Coffin || mongoose.model("Coffin", coffinSchema);

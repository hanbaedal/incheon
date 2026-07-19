"use strict";

const mongoose = require("mongoose");

// 수의 (서울아산병원 장례식장 안내 표 참고)
const shroudSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    material: { type: String, default: "" }, // 재질구성
    weaveType: { type: String, default: "" }, // 기계직 / 수제직 / 반수공
    yarnOrigin: { type: String, default: "" }, // 원사 생산국
    fabricOrigin: { type: String, default: "" }, // 원단 생산지
    price: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "벌" },
    description: { type: String, default: "" },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductImage", default: null },
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

shroudSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    name: this.name,
    material: this.material,
    weaveType: this.weaveType,
    yarnOrigin: this.yarnOrigin,
    fabricOrigin: this.fabricOrigin,
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

module.exports = mongoose.models.Shroud || mongoose.model("Shroud", shroudSchema);

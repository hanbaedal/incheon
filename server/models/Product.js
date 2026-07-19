"use strict";

const mongoose = require("mongoose");
const { CAT_KEYS, SETTLEMENT_TYPES } = require("../constants/categories");

// 장례 서비스/용품 상품 (상주 온라인 예약용)
const productSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true, index: true }, // 표시용 분류명
    catKey: { type: String, enum: CAT_KEYS, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 }, // 공급가(원)
    unit: { type: String, default: "개" }, // 개/식/대 등
    image: { type: String, default: "" }, // 외부 URL 폴백
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductImage", default: null },
    settlementType: { type: String, enum: SETTLEMENT_TYPES, default: "prepaid", index: true },
    taxable: { type: Boolean, default: true }, // 부가세 과세 여부
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.methods.toJSONSafe = function toJSONSafe() {
  const imageUrl = this.imageId ? `/api/images/${this.imageId}` : this.image || "";
  return {
    id: this._id,
    category: this.category,
    catKey: this.catKey,
    name: this.name,
    description: this.description,
    price: this.price,
    unit: this.unit,
    image: this.image,
    imageId: this.imageId,
    imageUrl,
    settlementType: this.settlementType,
    taxable: this.taxable,
    active: this.active,
    sortOrder: this.sortOrder,
  };
};

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);

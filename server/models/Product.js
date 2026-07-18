"use strict";

const mongoose = require("mongoose");

// 장례 서비스/용품 상품 (차후 상주 온라인 주문용)
const productSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true, index: true }, // 관/수의/음식/화환/차량 등
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 }, // 공급가(원)
    unit: { type: String, default: "개" }, // 개/식/대 등
    image: { type: String, default: "" },
    taxable: { type: Boolean, default: true }, // 부가세 과세 여부
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    category: this.category,
    name: this.name,
    description: this.description,
    price: this.price,
    unit: this.unit,
    image: this.image,
    taxable: this.taxable,
    active: this.active,
    sortOrder: this.sortOrder,
  };
};

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);

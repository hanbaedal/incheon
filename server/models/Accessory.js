"use strict";

const mongoose = require("mongoose");

// 부속물품 (서울아산병원 장례식장 안내 표 참고)
const accessorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    spec: { type: String, default: "" }, // 규격
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

accessorySchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    name: this.name,
    spec: this.spec,
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

module.exports = mongoose.models.Accessory || mongoose.model("Accessory", accessorySchema);

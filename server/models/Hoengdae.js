"use strict";

const mongoose = require("mongoose");

// 횡대 (규격·원산지 중심)
const hoengdaeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    vertical: { type: Number, default: null }, // 세로(㎜)
    horizontal: { type: Number, default: null }, // 가로(㎜)
    thickness: { type: Number, default: null }, // 두께(㎜)
    origin: { type: String, default: "" },
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

hoengdaeSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    name: this.name,
    vertical: this.vertical,
    horizontal: this.horizontal,
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

module.exports = mongoose.models.Hoengdae || mongoose.model("Hoengdae", hoengdaeSchema);

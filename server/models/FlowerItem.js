"use strict";

const mongoose = require("mongoose");
const { FLOWER_CATEGORIES } = require("../constants/flowerCategories");

const flowerItemSchema = new mongoose.Schema(
  {
    flowerCategory: { type: String, enum: FLOWER_CATEGORIES, required: true, index: true },
    name: { type: String, required: true, trim: true },
    spec: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "개" },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductImage", default: null },
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

flowerItemSchema.index({ flowerCategory: 1, name: 1 }, { unique: true });

flowerItemSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    flowerCategory: this.flowerCategory,
    name: this.name,
    spec: this.spec,
    description: this.description,
    price: this.price,
    unit: this.unit,
    imageId: this.imageId,
    imageUrl: this.imageId ? `/api/images/${this.imageId}` : "",
    taxable: this.taxable,
    active: this.active,
    sortOrder: this.sortOrder,
  };
};

module.exports = mongoose.models.FlowerItem || mongoose.model("FlowerItem", flowerItemSchema);

"use strict";

const mongoose = require("mongoose");
const { DRESS_ITEM_NAMES } = require("../constants/dressCategories");

const dressItemSchema = new mongoose.Schema(
  {
    name: { type: String, enum: DRESS_ITEM_NAMES, required: true, index: true },
    spec: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "1개" },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductImage", default: null },
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dressItemSchema.index({ name: 1, spec: 1 }, { unique: true });

dressItemSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
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

module.exports = mongoose.models.DressItem || mongoose.model("DressItem", dressItemSchema);

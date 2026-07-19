"use strict";

const mongoose = require("mongoose");
const { PHOTO_CATEGORIES } = require("../constants/photoCategories");

const photoItemSchema = new mongoose.Schema(
  {
    photoCategory: { type: String, enum: PHOTO_CATEGORIES, required: true, index: true },
    name: { type: String, required: true, trim: true },
    subGroup: { type: String, default: "" },
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

photoItemSchema.index({ photoCategory: 1, subGroup: 1, name: 1 }, { unique: true });

photoItemSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    photoCategory: this.photoCategory,
    name: this.name,
    subGroup: this.subGroup,
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

module.exports = mongoose.models.PhotoItem || mongoose.model("PhotoItem", photoItemSchema);

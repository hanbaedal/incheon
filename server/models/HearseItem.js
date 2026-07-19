"use strict";

const mongoose = require("mongoose");
const { HEARSE_CATEGORIES } = require("../constants/hearseCategories");

const hearseItemSchema = new mongoose.Schema(
  {
    hearseCategory: { type: String, enum: HEARSE_CATEGORIES, required: true, index: true },
    name: { type: String, required: true, trim: true },
    spec: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "1대" },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductImage", default: null },
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

hearseItemSchema.index({ hearseCategory: 1, name: 1, spec: 1 }, { unique: true });

hearseItemSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    hearseCategory: this.hearseCategory,
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

module.exports = mongoose.models.HearseItem || mongoose.model("HearseItem", hearseItemSchema);

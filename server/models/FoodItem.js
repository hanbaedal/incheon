"use strict";

const mongoose = require("mongoose");
const { FOOD_CATEGORIES } = require("../constants/foodCategories");

const foodItemSchema = new mongoose.Schema(
  {
    foodCategory: { type: String, enum: FOOD_CATEGORIES, required: true, index: true },
    name: { type: String, required: true, trim: true },
    subGroup: { type: String, default: "" }, // 식사류/반찬류, 안주류/마른안주류 등
    spec: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "개" },
    settlementType: { type: String, enum: ["prepaid", "postpaid"], default: "prepaid" },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductImage", default: null },
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

foodItemSchema.index({ foodCategory: 1, name: 1 }, { unique: true });

foodItemSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    foodCategory: this.foodCategory,
    name: this.name,
    subGroup: this.subGroup,
    spec: this.spec,
    description: this.description,
    price: this.price,
    unit: this.unit,
    settlementType: this.settlementType,
    imageId: this.imageId,
    imageUrl: this.imageId ? `/api/images/${this.imageId}` : "",
    taxable: this.taxable,
    active: this.active,
    sortOrder: this.sortOrder,
  };
};

module.exports = mongoose.models.FoodItem || mongoose.model("FoodItem", foodItemSchema);

"use strict";

const mongoose = require("mongoose");

const hallFacilityFeeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    group: { type: String, required: true, trim: true }, // 구분: 안치료, 입관실
    name: { type: String, default: "-" },
    unit: { type: String, default: "1일" },
    price: { type: Number, default: 0, min: 0 },
    note: { type: String, default: "-" },
    settlementType: { type: String, enum: ["prepaid", "postpaid"], default: "prepaid" },
    orderable: { type: Boolean, default: true },
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

hallFacilityFeeSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    code: this.code,
    group: this.group,
    name: this.name,
    unit: this.unit,
    price: this.price,
    note: this.note,
    settlementType: this.settlementType,
    orderable: this.orderable,
    taxable: this.taxable,
    active: this.active,
    sortOrder: this.sortOrder,
  };
};

module.exports = mongoose.models.HallFacilityFee || mongoose.model("HallFacilityFee", hallFacilityFeeSchema);

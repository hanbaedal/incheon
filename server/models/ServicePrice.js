"use strict";

const mongoose = require("mongoose");

const servicePriceSchema = new mongoose.Schema(
  {
    group: { type: String, required: true, trim: true }, // 구분 (관리비, 주차비 등)
    name: { type: String, required: true, trim: true }, // 항목
    unit: { type: String, default: "-" },
    price: { type: Number, default: 0, min: 0 },
    note: { type: String, default: "-" },
    settlementType: { type: String, enum: ["prepaid", "postpaid"], default: "prepaid" },
    orderable: { type: Boolean, default: true }, // 상주 예약·청구 가능 여부
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

servicePriceSchema.index({ group: 1, name: 1 }, { unique: true });

servicePriceSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
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

module.exports = mongoose.models.ServicePrice || mongoose.model("ServicePrice", servicePriceSchema);

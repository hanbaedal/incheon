"use strict";

const mongoose = require("mongoose");
const { hallToCatalogJSON, hallToAdminJSON } = require("../utils/hallFormat");

/** 빈소 규격 마스터 (35/50/80평형, 무빈소) */
const hallSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    areaLabel: { type: String, trim: true, default: "" },
    capacity: { type: String, trim: true, default: "" },
    feature: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
    isVirtual: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

hallSchema.methods.toCatalogJSON = function toCatalogJSON() {
  return hallToCatalogJSON(this);
};

hallSchema.methods.toAdminJSON = function toAdminJSON() {
  return hallToAdminJSON(this);
};

module.exports = mongoose.models.Hall || mongoose.model("Hall", hallSchema);

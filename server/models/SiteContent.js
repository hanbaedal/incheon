"use strict";

const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, index: true },
    key: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text", "html", "image"], default: "text" },
    label: { type: String, default: "" },
    valueKo: { type: String, default: "" },
    valueZh: { type: String, default: "" },
    valueEn: { type: String, default: "" },
  },
  { timestamps: true }
);

siteContentSchema.index({ page: 1, key: 1 }, { unique: true });

siteContentSchema.methods.valueForLang = function valueForLang(lang) {
  if (lang === "zh") return this.valueZh != null ? this.valueZh : this.valueKo;
  if (lang === "en") return this.valueEn != null ? this.valueEn : this.valueKo;
  return this.valueKo;
};

siteContentSchema.methods.toAdminJSON = function toAdminJSON() {
  return {
    id: this._id,
    page: this.page,
    key: this.key,
    type: this.type,
    label: this.label,
    valueKo: this.valueKo,
    valueZh: this.valueZh,
    valueEn: this.valueEn,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.models.SiteContent || mongoose.model("SiteContent", siteContentSchema);
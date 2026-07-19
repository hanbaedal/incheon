"use strict";

const mongoose = require("mongoose");

const funeralFormSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "FormFile", default: null },
  },
  { timestamps: true }
);

funeralFormSchema.methods.toJSONSafe = function toJSONSafe(fileMeta, opts) {
  opts = opts || {};
  const hasFile = !!(this.fileId && fileMeta);
  const downloadPath = opts.admin
    ? `/api/forms/admin/${this._id}/download`
    : `/api/forms/${this._id}/download`;
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    sortOrder: this.sortOrder,
    active: this.active,
    hasFile,
    filename: hasFile ? fileMeta.filename : "",
    fileSize: hasFile ? fileMeta.size : 0,
    downloadUrl: hasFile ? downloadPath : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.models.FuneralForm || mongoose.model("FuneralForm", funeralFormSchema);

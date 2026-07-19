"use strict";

const mongoose = require("mongoose");

const formFileSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true, trim: true },
    filename: { type: String, default: "", trim: true },
    size: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.FormFile || mongoose.model("FormFile", formFileSchema);

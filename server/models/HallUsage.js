"use strict";

const mongoose = require("mongoose");

const hallUsageSchema = new mongoose.Schema(
  {
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", required: true, index: true },
    familyUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    hallRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "HallRequest", default: null },
    deceasedName: { type: String, trim: true, default: "" },
    chiefMourner: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
    age: { type: String, trim: true, default: "" },
    enshrinedAt: { type: String, trim: true, default: "" },
    funeralDate: { type: String, trim: true, default: "" },
    funeralTime: { type: String, trim: true, default: "" },
    burialSite: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },
    familyCode: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.HallUsage || mongoose.model("HallUsage", hallUsageSchema);

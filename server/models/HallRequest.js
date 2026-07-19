"use strict";

const mongoose = require("mongoose");

const hallRequestSchema = new mongoose.Schema(
  {
    familyUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", required: true, index: true },
    deceasedName: { type: String, trim: true, default: "" },
    chiefMourner: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
    age: { type: String, trim: true, default: "" },
    enshrinedAt: { type: String, trim: true, default: "" },
    funeralDate: { type: String, trim: true, default: "" },
    funeralTime: { type: String, trim: true, default: "" },
    burialSite: { type: String, trim: true, default: "" },
    funeralDays: { type: Number, default: null },
    dailyPrice: { type: Number, default: 0, min: 0 },
    hallFeeAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    note: { type: String, default: "" },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

hallRequestSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    familyUserId: this.familyUserId,
    hallId: this.hallId,
    deceasedName: this.deceasedName,
    chiefMourner: this.chiefMourner,
    relationship: this.relationship,
    age: this.age,
    enshrinedAt: this.enshrinedAt,
    funeralDate: this.funeralDate,
    funeralTime: this.funeralTime,
    burialSite: this.burialSite,
    funeralDays: this.funeralDays,
    dailyPrice: this.dailyPrice,
    hallFeeAmount: this.hallFeeAmount,
    status: this.status,
    note: this.note,
    decidedAt: this.decidedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports =
  mongoose.models.HallRequest || mongoose.model("HallRequest", hallRequestSchema);

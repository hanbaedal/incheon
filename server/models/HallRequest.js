"use strict";

const mongoose = require("mongoose");

const hallRequestSchema = new mongoose.Schema(
  {
    familyUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", required: true, index: true },
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
    status: this.status,
    note: this.note,
    decidedAt: this.decidedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports =
  mongoose.models.HallRequest || mongoose.model("HallRequest", hallRequestSchema);

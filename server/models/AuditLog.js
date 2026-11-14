"use strict";

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorUsername: { type: String, default: "" },
    actorName: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true, index: true }, // create | update | delete | approve | settle | login | password
    targetType: { type: String, required: true, index: true }, // user | order | hallFee | servicePrice | hallRequest | ...
    targetId: { type: String, default: "" },
    summary: { type: String, required: true },
    detail: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

auditLogSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    actorUsername: this.actorUsername,
    actorName: this.actorName,
    actorRole: this.actorRole,
    action: this.action,
    targetType: this.targetType,
    targetId: this.targetId,
    summary: this.summary,
    detail: this.detail || {},
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

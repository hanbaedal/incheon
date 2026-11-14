"use strict";

const AuditLog = require("../models/AuditLog");

async function writeAudit(req, { action, targetType, targetId, summary, detail }) {
  try {
    const actor = req && req.user ? req.user : null;
    await AuditLog.create({
      actorId: actor && actor.uid ? actor.uid : null,
      actorUsername: (actor && actor.username) || "",
      actorName: (actor && actor.name) || "",
      actorRole: (actor && actor.role) || "",
      action: action || "update",
      targetType: targetType || "system",
      targetId: targetId != null ? String(targetId) : "",
      summary: summary || "",
      detail: detail || {},
    });
  } catch (err) {
    console.error("[AUDIT] 기록 실패:", err.message);
  }
}

module.exports = { writeAudit };

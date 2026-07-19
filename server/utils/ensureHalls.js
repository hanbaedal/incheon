"use strict";

const Hall = require("../models/Hall");
const HallUsage = require("../models/HallUsage");
const HallRequest = require("../models/HallRequest");
const User = require("../models/User");
const Order = require("../models/Order");
const Memorial = require("../models/Memorial");
const { HALL_ROOMS, LEGACY_SPEC_TO_ROOM } = require("../constants/hallTypes");

async function dropLegacyHallIndexes() {
  try {
    const indexes = await Hall.collection.indexes();
    for (const idx of indexes) {
      const keys = Object.keys(idx.key || {});
      if (keys.includes("hallNumber")) {
        await Hall.collection.dropIndex(idx.name);
      }
    }
  } catch (err) {
    console.warn("[HALL] 구 인덱스 정리 실패:", err.message);
  }
}

async function needsRoomMigration() {
  const legacyCatalog = await Hall.findOne({ code: { $in: Object.keys(LEGACY_SPEC_TO_ROOM) } }).lean();
  const missingSpec = await Hall.findOne({ specCode: { $exists: false } }).lean();
  return !!(legacyCatalog || missingSpec);
}

async function remapHallReferences(oldIdToCode) {
  const newRooms = await Hall.find({});
  const codeToId = new Map(newRooms.map((r) => [r.code, r._id]));

  const resolveRoomId = (oldHallId) => {
    const legacyCode = oldIdToCode.get(String(oldHallId));
    const roomCode = legacyCode ? LEGACY_SPEC_TO_ROOM[legacyCode] : null;
    return roomCode ? codeToId.get(roomCode) : null;
  };

  const requests = await HallRequest.find({});
  for (const req of requests) {
    const nextId = resolveRoomId(req.hallId);
    if (nextId) req.hallId = nextId;
    await req.save();
  }

  const usages = await HallUsage.find({});
  for (const usage of usages) {
    const nextId = resolveRoomId(usage.hallId);
    if (nextId) usage.hallId = nextId;
    await usage.save();
  }
}

async function migrateToRoomCatalog() {
  if (!(await needsRoomMigration())) return false;

  const oldHalls = await Hall.find({});
  const oldIdToCode = new Map(oldHalls.map((h) => [String(h._id), h.code]));

  await Hall.deleteMany({});
  await dropLegacyHallIndexes();
  await upsertRooms();

  await remapHallReferences(oldIdToCode);
  return true;
}

async function upsertRooms() {
  let created = 0;
  let updated = 0;
  for (const item of HALL_ROOMS) {
    const existing = await Hall.findOne({ code: item.code });
    if (existing) {
      existing.name = item.name;
      existing.specCode = item.specCode;
      existing.specLabel = item.specLabel;
      existing.areaLabel = item.areaLabel;
      existing.capacity = item.capacity;
      existing.feature = item.feature;
      existing.sortOrder = item.sortOrder;
      existing.isVirtual = item.isVirtual;
      if (item.dailyPrice != null) existing.dailyPrice = item.dailyPrice;
      if (existing.active == null) existing.active = true;
      await existing.save();
      updated += 1;
    } else {
      await Hall.create({ ...item, active: true });
      created += 1;
    }
  }
  const total = await Hall.countDocuments();
  return { created, updated, total };
}

async function ensureHalls() {
  await dropLegacyHallIndexes();
  const migrated = await migrateToRoomCatalog();
  const result = await upsertRooms();
  result.migrated = migrated;
  return result;
}

module.exports = { ensureHalls, HALL_ROOMS };

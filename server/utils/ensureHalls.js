"use strict";

const Hall = require("../models/Hall");
const HallUsage = require("../models/HallUsage");
const User = require("../models/User");
const Order = require("../models/Order");
const Memorial = require("../models/Memorial");
const { HALL_CATALOG } = require("../constants/hallTypes");

async function dropLegacyHallIndexes() {
  let dropped = 0;
  try {
    const indexes = await Hall.collection.indexes();
    for (const idx of indexes) {
      const keys = Object.keys(idx.key || {});
      if (keys.includes("hallNumber")) {
        await Hall.collection.dropIndex(idx.name);
        dropped += 1;
      }
    }
  } catch (err) {
    console.warn("[HALL] 구 인덱스 정리 실패:", err.message);
  }
  return dropped;
}

async function migrateLegacyHalls() {
  const legacy = await Hall.findOne({ code: { $exists: false } }).lean();
  if (!legacy) return false;

  await Hall.deleteMany({});
  await HallUsage.deleteMany({});
  await User.updateMany({}, { $set: { hallUsageId: null }, $unset: { hallId: "" } });
  await Order.updateMany({}, { $set: { hallUsageId: null }, $unset: { hallId: "" } });
  await Memorial.deleteMany({});
  return true;
}

async function upsertCatalog() {
  await dropLegacyHallIndexes();

  let created = 0;
  let updated = 0;
  for (const item of HALL_CATALOG) {
    const existing = await Hall.findOne({ code: item.code });
    if (existing) {
      existing.name = item.name;
      existing.areaLabel = item.areaLabel;
      existing.capacity = item.capacity;
      existing.feature = item.feature;
      existing.sortOrder = item.sortOrder;
      existing.isVirtual = item.isVirtual;
      if (existing.active == null) existing.active = true;
      await existing.save();
      updated += 1;
    } else {
      await Hall.create({ ...item, active: true });
      created += 1;
    }
  }
  const total = await Hall.countDocuments();
  return { created, updated, total, migrated: false };
}

async function ensureHalls() {
  const migrated = await migrateLegacyHalls();
  const result = await upsertCatalog();
  result.migrated = migrated;
  return result;
}

module.exports = { ensureHalls, HALL_CATALOG };

"use strict";

const HallFacilityFee = require("../models/HallFacilityFee");
const SAMPLES = require("../constants/hallFacilityFeeSamples");

function sampleToDoc(sample) {
  return {
    code: sample.code,
    group: sample.group,
    name: sample.name || "-",
    unit: sample.unit || "1일",
    price: sample.price != null ? sample.price : 0,
    note: sample.note || "-",
    settlementType: sample.settlementType || "prepaid",
    orderable: sample.orderable !== false,
    sortOrder: sample.sortOrder || 0,
    active: true,
    taxable: true,
  };
}

async function upsertHallFacilityFees() {
  let created = 0;
  let updated = 0;
  for (const sample of SAMPLES) {
    const doc = sampleToDoc(sample);
    const r = await HallFacilityFee.updateOne({ code: sample.code }, { $set: doc }, { upsert: true, runValidators: true });
    if ((r.upsertedCount && r.upsertedCount > 0) || r.upsertedId) created++;
    else if (r.modifiedCount) updated++;
  }
  const allowed = SAMPLES.map((s) => ({ code: s.code }));
  if (allowed.length > 0) await HallFacilityFee.deleteMany({ $nor: allowed });
  const total = await HallFacilityFee.countDocuments({ active: true });
  return { created, updated, total, expected: SAMPLES.length };
}

async function ensureHallFacilityFees() {
  const before = await HallFacilityFee.countDocuments({ active: true });
  const result = await upsertHallFacilityFees();
  if (before === 0 && result.total > 0) {
    console.log(`[HALL-FEES] 시설 사용료 ${result.total}건 등록 (신규 ${result.created})`);
  }
  return result;
}

module.exports = { ensureHallFacilityFees, upsertHallFacilityFees, SAMPLES };

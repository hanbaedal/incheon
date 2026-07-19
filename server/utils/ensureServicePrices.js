"use strict";

const ServicePrice = require("../models/ServicePrice");
const SERVICE_PRICE_SAMPLES = require("../constants/servicePriceSamples");

function sampleToDoc(sample) {
  return {
    group: sample.group,
    name: sample.name,
    unit: sample.unit || "-",
    price: sample.price != null ? sample.price : 0,
    note: sample.note || "-",
    settlementType: sample.settlementType || "prepaid",
    orderable: sample.orderable !== false,
    sortOrder: sample.sortOrder || 0,
    active: true,
    taxable: true,
  };
}

async function upsertServicePrices() {
  let created = 0;
  let updated = 0;
  for (const sample of SERVICE_PRICE_SAMPLES) {
    const doc = sampleToDoc(sample);
    const r = await ServicePrice.updateOne(
      { group: sample.group, name: sample.name },
      { $set: doc },
      { upsert: true, runValidators: true }
    );
    if ((r.upsertedCount && r.upsertedCount > 0) || r.upsertedId) created++;
    else if (r.modifiedCount) updated++;
  }
  const allowed = SERVICE_PRICE_SAMPLES.map((s) => ({ group: s.group, name: s.name }));
  if (allowed.length > 0) {
    await ServicePrice.deleteMany({ $nor: allowed });
  }
  const total = await ServicePrice.countDocuments({ active: true });
  return { created, updated, total, expected: SERVICE_PRICE_SAMPLES.length };
}

async function ensureServicePrices() {
  const before = await ServicePrice.countDocuments({ active: true });
  let result;
  try {
    result = await upsertServicePrices();
  } catch (err) {
    console.error("[SERVICE-PRICES] upsert 실패:", err.message);
    throw err;
  }
  if (result.total === 0 && SERVICE_PRICE_SAMPLES.length > 0) {
    try {
      await ServicePrice.insertMany(SERVICE_PRICE_SAMPLES.map(sampleToDoc), { ordered: true });
      result.total = await ServicePrice.countDocuments({ active: true });
      result.created = result.total;
      console.log(`[SERVICE-PRICES] insertMany로 ${result.total}건 등록`);
    } catch (err) {
      if (err.code !== 11000) console.error("[SERVICE-PRICES] insertMany 실패:", err.message);
      result.total = await ServicePrice.countDocuments({ active: true });
    }
  }
  if (before === 0 && result.total > 0) {
    console.log(`[SERVICE-PRICES] 기본 항목 ${result.total}건 등록 (신규 ${result.created})`);
  } else if (result.created > 0 || result.updated > 0) {
    console.log(`[SERVICE-PRICES] 동기화 — 신규 ${result.created}, 갱신 ${result.updated} (활성 ${result.total}건)`);
  }
  return result;
}

module.exports = { ensureServicePrices, upsertServicePrices, SERVICE_PRICE_SAMPLES };

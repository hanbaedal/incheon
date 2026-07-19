"use strict";

const { connectDB, disconnectDB } = require("./config/db");
const Coffin = require("./models/Coffin");
const COFFIN_SAMPLES = require("./constants/coffinSamples");

async function upsertCoffins() {
  let created = 0;
  let updated = 0;
  for (const sample of COFFIN_SAMPLES) {
    const r = await Coffin.updateOne(
      { name: sample.name },
      { $set: sample, $setOnInsert: { price: 0, unit: "개", active: true, taxable: true } },
      { upsert: true, runValidators: true }
    );
    if (r.upsertedCount) created++;
    else if (r.modifiedCount) updated++;
  }
  return { created, updated, total: COFFIN_SAMPLES.length };
}

async function main() {
  await connectDB();
  console.log("[SEED:COFFINS] 시작");
  const r = await upsertCoffins();
  console.log(`+ 관 ${r.total}건 동기화 (신규 ${r.created}, 갱신 ${r.updated})`);
  console.log("[SEED:COFFINS] 완료");
  await disconnectDB();
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[SEED:COFFINS] 오류:", err);
    process.exit(1);
  });
}

module.exports = { upsertCoffins };

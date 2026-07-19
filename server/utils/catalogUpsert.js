"use strict";

async function upsertByName(Model, samples, onInsertDefaults) {
  let created = 0;
  let updated = 0;
  for (const sample of samples) {
    const r = await Model.updateOne(
      { name: sample.name },
      { $set: sample, $setOnInsert: onInsertDefaults },
      { upsert: true, runValidators: true }
    );
    if (r.upsertedCount) created++;
    else if (r.modifiedCount) updated++;
  }
  return { created, updated, total: samples.length };
}

module.exports = { upsertByName };

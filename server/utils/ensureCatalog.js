"use strict";

const Coffin = require("../models/Coffin");
const Hoengdae = require("../models/Hoengdae");
const Shroud = require("../models/Shroud");
const Accessory = require("../models/Accessory");
const FoodItem = require("../models/FoodItem");
const COFFIN_SAMPLES = require("../constants/coffinSamples");
const HOENGDAE_SAMPLES = require("../constants/hoengdaeSamples");
const SHROUD_SAMPLES = require("../constants/shroudSamples");
const ACCESSORY_SAMPLES = require("../constants/accessorySamples");
const FOOD_SAMPLES = require("../constants/foodSamples");
const { upsertByName } = require("./catalogUpsert");

const DEFAULTS = {
  coffin: { price: 0, unit: "개", active: true, taxable: true },
  hoengdae: { price: 0, unit: "개", active: true, taxable: true },
  shroud: { price: 0, unit: "벌", active: true, taxable: true },
  accessory: { price: 0, unit: "개", active: true, taxable: true },
};

async function upsertFoodItems() {
  let created = 0;
  let updated = 0;
  for (const sample of FOOD_SAMPLES) {
    const settlementType = sample.settlementType || "prepaid";
    const unit = sample.unit || (settlementType === "postpaid" ? "개" : "식");
    const r = await FoodItem.updateOne(
      { foodCategory: sample.foodCategory, name: sample.name },
      {
        $set: {
          foodCategory: sample.foodCategory,
          name: sample.name,
          subGroup: sample.subGroup || "",
          spec: sample.spec || "",
          description: sample.description || "",
          sortOrder: sample.sortOrder || 0,
          settlementType,
        },
        $setOnInsert: { price: 0, unit, active: true, taxable: true },
      },
      { upsert: true, runValidators: true }
    );
    if (r.upsertedCount) created++;
    else if (r.modifiedCount) updated++;
  }
  return { created, updated, total: FOOD_SAMPLES.length };
}

async function ensureAmcCatalog() {
  const coffins = await upsertByName(Coffin, COFFIN_SAMPLES, DEFAULTS.coffin);
  const hoengdae = await upsertByName(Hoengdae, HOENGDAE_SAMPLES, DEFAULTS.hoengdae);
  const shrouds = await upsertByName(Shroud, SHROUD_SAMPLES, DEFAULTS.shroud);
  const accessories = await upsertByName(Accessory, ACCESSORY_SAMPLES, DEFAULTS.accessory);
  const foodItems = await upsertFoodItems();
  return { coffins, hoengdae, shrouds, accessories, foodItems };
}

module.exports = { ensureAmcCatalog, upsertByName, upsertFoodItems };

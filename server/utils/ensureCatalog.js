"use strict";

const Coffin = require("../models/Coffin");
const Hoengdae = require("../models/Hoengdae");
const Shroud = require("../models/Shroud");
const Accessory = require("../models/Accessory");
const FoodItem = require("../models/FoodItem");
const FlowerItem = require("../models/FlowerItem");
const PhotoItem = require("../models/PhotoItem");
const DressItem = require("../models/DressItem");
const HearseItem = require("../models/HearseItem");
const ServicePrice = require("../models/ServicePrice");
const COFFIN_SAMPLES = require("../constants/coffinSamples");
const HOENGDAE_SAMPLES = require("../constants/hoengdaeSamples");
const SHROUD_SAMPLES = require("../constants/shroudSamples");
const ACCESSORY_SAMPLES = require("../constants/accessorySamples");
const FOOD_SAMPLES = require("../constants/foodSamples");
const FLOWER_SAMPLES = require("../constants/flowerSamples");
const PHOTO_SAMPLES = require("../constants/photoSamples");
const DRESS_SAMPLES = require("../constants/dressSamples");
const HEARSE_SAMPLES = require("../constants/hearseSamples");
const SERVICE_PRICE_SAMPLES = require("../constants/servicePriceSamples");
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

async function upsertFlowerItems() {
  let created = 0;
  let updated = 0;
  for (const sample of FLOWER_SAMPLES) {
    const unit = sample.unit || "개";
    const setFields = {
      flowerCategory: sample.flowerCategory,
      name: sample.name,
      spec: sample.spec || "",
      description: sample.description || "",
      sortOrder: sample.sortOrder || 0,
      unit,
    };
    if (sample.price != null) setFields.price = sample.price;
    const r = await FlowerItem.updateOne(
      { flowerCategory: sample.flowerCategory, name: sample.name },
      {
        $set: setFields,
        $setOnInsert: { active: true, taxable: true, price: sample.price != null ? sample.price : 0 },
      },
      { upsert: true, runValidators: true }
    );
    if (r.upsertedCount) created++;
    else if (r.modifiedCount) updated++;
  }
  return { created, updated, total: FLOWER_SAMPLES.length };
}

async function upsertPhotoItems() {
  let created = 0;
  let updated = 0;
  for (const sample of PHOTO_SAMPLES) {
    const unit = sample.unit || "개";
    const r = await PhotoItem.updateOne(
      { photoCategory: sample.photoCategory, subGroup: sample.subGroup || "", name: sample.name },
      {
        $set: {
          photoCategory: sample.photoCategory,
          name: sample.name,
          subGroup: sample.subGroup || "",
          spec: sample.spec || "",
          description: sample.description || "",
          sortOrder: sample.sortOrder || 0,
          unit,
        },
        $setOnInsert: { active: true, taxable: true, price: 0 },
      },
      { upsert: true, runValidators: true }
    );
    if (r.upsertedCount) created++;
    else if (r.modifiedCount) updated++;
  }
  return { created, updated, total: PHOTO_SAMPLES.length };
}

async function upsertDressItems() {
  let created = 0;
  let updated = 0;
  for (const sample of DRESS_SAMPLES) {
    const unit = sample.unit || "1개";
    const r = await DressItem.updateOne(
      { name: sample.name, spec: sample.spec },
      {
        $set: {
          name: sample.name,
          spec: sample.spec,
          description: sample.description || "",
          sortOrder: sample.sortOrder || 0,
          unit,
        },
        $setOnInsert: { active: true, taxable: true, price: 0 },
      },
      { upsert: true, runValidators: true }
    );
    if (r.upsertedCount) created++;
    else if (r.modifiedCount) updated++;
  }
  return { created, updated, total: DRESS_SAMPLES.length };
}

async function upsertHearseItems() {
  let created = 0;
  let updated = 0;
  for (const sample of HEARSE_SAMPLES) {
    const unit = sample.unit || "1대";
    const r = await HearseItem.updateOne(
      { hearseCategory: sample.hearseCategory, name: sample.name, spec: sample.spec || "" },
      {
        $set: {
          hearseCategory: sample.hearseCategory,
          name: sample.name,
          spec: sample.spec || "",
          description: sample.description || "",
          sortOrder: sample.sortOrder || 0,
          unit,
        },
        $setOnInsert: { active: true, taxable: true, price: 0 },
      },
      { upsert: true, runValidators: true }
    );
    if (r.upsertedCount) created++;
    else if (r.modifiedCount) updated++;
  }
  return { created, updated, total: HEARSE_SAMPLES.length };
}

async function upsertServicePrices() {
  const HIDDEN_GROUPS = ["주차비", "사진"];
  let created = 0;
  let updated = 0;
  for (const sample of SERVICE_PRICE_SAMPLES) {
    const r = await ServicePrice.updateOne(
      { group: sample.group, name: sample.name },
      {
        $set: {
          group: sample.group,
          name: sample.name,
          unit: sample.unit || "-",
          price: sample.price != null ? sample.price : 0,
          note: sample.note || "-",
          settlementType: sample.settlementType || "prepaid",
          orderable: sample.orderable !== false,
          sortOrder: sample.sortOrder || 0,
          active: true,
        },
        $setOnInsert: { taxable: true },
      },
      { upsert: true, runValidators: true }
    );
    if (r.upsertedCount) created++;
    else if (r.modifiedCount) updated++;
  }
  const hidden = await ServicePrice.updateMany(
    { group: { $in: HIDDEN_GROUPS } },
    { $set: { active: false, orderable: false } }
  );
  if (hidden.modifiedCount) updated += hidden.modifiedCount;
  return { created, updated, total: SERVICE_PRICE_SAMPLES.length };
}

async function ensureAmcCatalog() {
  const coffins = await upsertByName(Coffin, COFFIN_SAMPLES, DEFAULTS.coffin);
  const hoengdae = await upsertByName(Hoengdae, HOENGDAE_SAMPLES, DEFAULTS.hoengdae);
  const shrouds = await upsertByName(Shroud, SHROUD_SAMPLES, DEFAULTS.shroud);
  const accessories = await upsertByName(Accessory, ACCESSORY_SAMPLES, DEFAULTS.accessory);
  const foodItems = await upsertFoodItems();
  const flowerItems = await upsertFlowerItems();
  const photoItems = await upsertPhotoItems();
  const dressItems = await upsertDressItems();
  const hearseItems = await upsertHearseItems();
  const servicePrices = await upsertServicePrices();
  return { coffins, hoengdae, shrouds, accessories, foodItems, flowerItems, photoItems, dressItems, hearseItems, servicePrices };
}

module.exports = { ensureAmcCatalog, upsertByName, upsertFoodItems, upsertFlowerItems, upsertPhotoItems, upsertDressItems, upsertHearseItems, upsertServicePrices };

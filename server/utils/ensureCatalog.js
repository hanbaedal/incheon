"use strict";

const Coffin = require("../models/Coffin");
const Hoengdae = require("../models/Hoengdae");
const Shroud = require("../models/Shroud");
const Accessory = require("../models/Accessory");
const COFFIN_SAMPLES = require("../constants/coffinSamples");
const HOENGDAE_SAMPLES = require("../constants/hoengdaeSamples");
const SHROUD_SAMPLES = require("../constants/shroudSamples");
const ACCESSORY_SAMPLES = require("../constants/accessorySamples");
const { upsertByName } = require("./catalogUpsert");

const DEFAULTS = {
  coffin: { price: 0, unit: "개", active: true, taxable: true },
  hoengdae: { price: 0, unit: "개", active: true, taxable: true },
  shroud: { price: 0, unit: "벌", active: true, taxable: true },
  accessory: { price: 0, unit: "개", active: true, taxable: true },
};

async function ensureAmcCatalog() {
  const coffins = await upsertByName(Coffin, COFFIN_SAMPLES, DEFAULTS.coffin);
  const hoengdae = await upsertByName(Hoengdae, HOENGDAE_SAMPLES, DEFAULTS.hoengdae);
  const shrouds = await upsertByName(Shroud, SHROUD_SAMPLES, DEFAULTS.shroud);
  const accessories = await upsertByName(Accessory, ACCESSORY_SAMPLES, DEFAULTS.accessory);
  return { coffins, hoengdae, shrouds, accessories };
}

module.exports = { ensureAmcCatalog, upsertByName };

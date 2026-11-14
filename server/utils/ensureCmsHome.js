"use strict";

const SiteContent = require("../models/SiteContent");
const CMS_HOME_DEFAULTS = require("../constants/cmsHomeDefaults");

const PAGE = "home";

async function ensureCmsHome() {
  let created = 0;
  let total = 0;
  for (const row of CMS_HOME_DEFAULTS) {
    total += 1;
    const exists = await SiteContent.findOne({ page: PAGE, key: row.key });
    if (exists) continue;
    await SiteContent.create({
      page: PAGE,
      key: row.key,
      type: row.type || "text",
      label: row.label || row.key,
      valueKo: row.valueKo || "",
      valueZh: row.valueZh || "",
      valueEn: row.valueEn || "",
    });
    created += 1;
  }
  return { page: PAGE, total, created };
}

module.exports = { ensureCmsHome, CMS_HOME_DEFAULTS, CMS_HOME_PAGE: PAGE };
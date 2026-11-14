"use strict";

const express = require("express");
const SiteContent = require("../models/SiteContent");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin, requireStaff } = require("../middleware/auth");
const { writeAudit } = require("../utils/auditLog");
const { CMS_HOME_PAGE } = require("../utils/ensureCmsHome");

const router = express.Router();

function normalizeLang(lang) {
  return lang === "zh" || lang === "en" ? lang : "ko";
}

// 공개: 페이지 슬롯 (언어별)
router.get(
  "/public/:page",
  asyncHandler(async (req, res) => {
    const page = req.params.page;
    const lang = normalizeLang(req.query.lang);
    const docs = await SiteContent.find({ page }).sort({ key: 1 });
    const slots = {};
    for (const doc of docs) {
      const v = doc.valueForLang(lang);
      if (v) slots[doc.key] = v;
    }
    const ehAlt = slots["hero.ehaneulAlt"];
    if (ehAlt) slots["hero.ehaneulImg_alt"] = ehAlt;
    res.json({ page, lang, slots });
  })
);

// 관리자: 전체 슬롯
router.get(
  "/admin/:page",
  requireStaff,
  asyncHandler(async (req, res) => {
    const items = await SiteContent.find({ page: req.params.page }).sort({ key: 1 });
    res.json({ page: req.params.page, items: items.map((d) => d.toAdminJSON()) });
  })
);

// 관리자: 슬롯 수정
router.put(
  "/admin/:page/:key",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page, key } = req.params;
    const allowed = ["type", "label", "valueKo", "valueZh", "valueEn"];
    const body = req.body || {};
    let doc = await SiteContent.findOne({ page, key });
    if (!doc) {
      doc = new SiteContent({ page, key, type: body.type || "text", label: body.label || key });
    }
    for (const k of allowed) if (k in body) doc[k] = body[k];
    await doc.save();

    await writeAudit(req, {
      action: "update",
      targetType: "cms",
      targetId: `${page}:${key}`,
      summary: `홈페이지 CMS 수정: ${page}/${key}`,
      detail: { label: doc.label },
    });

    res.json({ item: doc.toAdminJSON() });
  })
);

// 관리자: 누락 슬롯 시드
router.post(
  "/admin/:page/seed",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (req.params.page !== CMS_HOME_PAGE) {
      return res.status(400).json({ error: "현재는 home 페이지 시드만 지원합니다." });
    }
    const { ensureCmsHome } = require("../utils/ensureCmsHome");
    const result = await ensureCmsHome();
    res.json({ ok: true, result });
  })
);

module.exports = router;
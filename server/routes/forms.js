"use strict";

const express = require("express");
const multer = require("multer");
const FuneralForm = require("../models/FuneralForm");
const FormFile = require("../models/FormFile");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_EXT = new Set([".pdf", ".hwp", ".hwpx", ".doc", ".docx", ".xls", ".xlsx", ".zip"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-hwp",
  "application/haansofthwp",
  "application/vnd.hancom.hwp",
  "application/octet-stream",
]);

function isAllowedFormFile(file) {
  if (!file) return false;
  const ext = String(file.originalname || "").toLowerCase().match(/\.[^.]+$/)?.[0] || "";
  if (ALLOWED_EXT.has(ext)) return true;
  return ALLOWED_MIME.has(file.mimetype);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!isAllowedFormFile(file)) {
      return cb(new Error("PDF·HWP·DOC·XLS·ZIP 파일만 업로드할 수 있습니다."));
    }
    cb(null, true);
  },
});

async function loadFileMap(forms) {
  const ids = forms.map((f) => f.fileId).filter(Boolean);
  if (!ids.length) return new Map();
  const files = await FormFile.find({ _id: { $in: ids } });
  return new Map(files.map((f) => [String(f._id), f]));
}

function encodeFilename(name) {
  const safe = String(name || "download").replace(/[^\w.\-()가-힣\s]/g, "_");
  return encodeURIComponent(safe);
}

// 관리자: 전체 목록
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const items = await FuneralForm.find({}).sort({ sortOrder: 1, createdAt: 1 });
    const fileMap = await loadFileMap(items);
    res.json({
      items: items.map((f) => f.toJSONSafe(f.fileId ? fileMap.get(String(f.fileId)) : null, { admin: true })),
    });
  })
);

// 공개: 활성 서식 목록
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await FuneralForm.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 });
    const fileMap = await loadFileMap(items);
    res.json({
      items: items.map((f) => f.toJSONSafe(f.fileId ? fileMap.get(String(f.fileId)) : null)),
    });
  })
);

// 관리자: 파일 다운로드 (비공개 포함)
router.get(
  "/admin/:id/download",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const form = await FuneralForm.findById(req.params.id);
    if (!form || !form.fileId) return res.status(404).json({ error: "다운로드할 서식을 찾을 수 없습니다." });

    const file = await FormFile.findById(form.fileId);
    if (!file) return res.status(404).json({ error: "서식 파일을 찾을 수 없습니다." });

    const filename = file.filename || `${form.name}.pdf`;
    res.set("Content-Type", file.contentType || "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeFilename(filename)}`);
    res.send(file.data);
  })
);

// 공개: 파일 다운로드
router.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const form = await FuneralForm.findOne({ _id: req.params.id, active: true });
    if (!form || !form.fileId) return res.status(404).json({ error: "다운로드할 서식을 찾을 수 없습니다." });

    const file = await FormFile.findById(form.fileId);
    if (!file) return res.status(404).json({ error: "서식 파일을 찾을 수 없습니다." });

    const filename = file.filename || `${form.name}.pdf`;
    res.set("Content-Type", file.contentType || "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeFilename(filename)}`);
    res.set("Cache-Control", "public, max-age=3600");
    res.send(file.data);
  })
);

// 관리자: 서식 등록
router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, description, sortOrder, active } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: "서식명을 입력해 주세요." });

    const form = await FuneralForm.create({
      name: String(name).trim(),
      description: String(description || "").trim(),
      sortOrder: Number(sortOrder) || 0,
      active: active !== false,
    });
    res.status(201).json({ form: form.toJSONSafe(null) });
  })
);

// 관리자: 서식 수정
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const form = await FuneralForm.findById(req.params.id);
    if (!form) return res.status(404).json({ error: "서식을 찾을 수 없습니다." });

    const { name, description, sortOrder, active } = req.body || {};
    if (name != null) form.name = String(name).trim();
    if (description != null) form.description = String(description).trim();
    if (sortOrder != null) form.sortOrder = Number(sortOrder) || 0;
    if (active != null) form.active = !!active;
    if (!form.name) return res.status(400).json({ error: "서식명을 입력해 주세요." });

    await form.save();
    const file = form.fileId ? await FormFile.findById(form.fileId) : null;
    res.json({ form: form.toJSONSafe(file) });
  })
);

// 관리자: 파일 업로드
router.post(
  "/:id/file",
  requireAdmin,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "파일 업로드에 실패했습니다." });
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "파일을 선택해 주세요." });

    const form = await FuneralForm.findById(req.params.id);
    if (!form) return res.status(404).json({ error: "서식을 찾을 수 없습니다." });

    if (form.fileId) {
      await FormFile.findByIdAndDelete(form.fileId);
    }

    const saved = await FormFile.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname || "",
      size: req.file.size,
    });
    form.fileId = saved._id;
    await form.save();

    res.json({ form: form.toJSONSafe(saved) });
  })
);

// 관리자: 파일 삭제
router.delete(
  "/:id/file",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const form = await FuneralForm.findById(req.params.id);
    if (!form) return res.status(404).json({ error: "서식을 찾을 수 없습니다." });
    if (form.fileId) {
      await FormFile.findByIdAndDelete(form.fileId);
      form.fileId = null;
      await form.save();
    }
    res.json({ form: form.toJSONSafe(null) });
  })
);

// 관리자: 서식 삭제
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const form = await FuneralForm.findById(req.params.id);
    if (!form) return res.status(404).json({ error: "서식을 찾을 수 없습니다." });
    if (form.fileId) await FormFile.findByIdAndDelete(form.fileId);
    await form.deleteOne();
    res.json({ ok: true });
  })
);

module.exports = router;

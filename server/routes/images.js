"use strict";

const express = require("express");
const multer = require("multer");
const ProductImage = require("../models/ProductImage");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("이미지 파일만 업로드할 수 있습니다."));
    }
    cb(null, true);
  },
});

// 관리자: 이미지 업로드 → MongoDB 저장
router.post(
  "/",
  requireAdmin,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "이미지 업로드에 실패했습니다." });
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "이미지 파일을 선택해 주세요." });
    const img = await ProductImage.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname || "",
      size: req.file.size,
    });
    res.status(201).json({
      image: {
        id: img._id,
        contentType: img.contentType,
        filename: img.filename,
        size: img.size,
        url: `/api/images/${img._id}`,
      },
    });
  })
);

// 공개: 이미지 서빙
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const img = await ProductImage.findById(req.params.id);
    if (!img) return res.status(404).json({ error: "이미지를 찾을 수 없습니다." });
    res.set("Content-Type", img.contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(img.data);
  })
);

module.exports = router;

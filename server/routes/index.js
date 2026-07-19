"use strict";

const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

router.use("/auth", require("./auth"));
router.use("/notices", require("./notices"));
router.use("/inquiries", require("./inquiries"));
router.use("/halls", require("./halls"));
router.use("/memorials", require("./memorials"));
router.use("/users", require("./users"));
router.use("/products", require("./products"));
router.use("/coffins", require("./coffins"));
router.use("/hoengdae", require("./hoengdae"));
router.use("/shrouds", require("./shrouds"));
router.use("/accessories", require("./accessories"));
router.use("/orders", require("./orders"));
router.use("/images", require("./images"));
router.use("/hall-requests", require("./hallRequests"));

module.exports = router;

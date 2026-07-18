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
router.use("/orders", require("./orders"));

module.exports = router;

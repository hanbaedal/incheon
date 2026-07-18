"use strict";

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const { attachUser } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errors");
const apiRouter = require("./routes");

const ROOT = path.join(__dirname, "..");

// 정적 서빙에서 차단할 경로 (서버 코드/설정 노출 방지)
const BLOCKED = [
  /^\/server(\/|$)/i,
  /^\/node_modules(\/|$)/i,
  /^\/package(-lock)?\.json$/i,
  /^\/render\.yaml$/i,
];

function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(attachUser);

  // API
  app.use("/api", apiRouter);

  // 민감 경로 차단
  app.use((req, res, next) => {
    if (BLOCKED.some((rx) => rx.test(req.path))) {
      return res.status(404).send("Not found");
    }
    next();
  });

  // 정적 프론트엔드 (index.html, /pages, /assets, /admin ...)
  app.use(
    express.static(ROOT, {
      dotfiles: "deny",
      extensions: ["html"],
      index: "index.html",
    })
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp, ROOT };

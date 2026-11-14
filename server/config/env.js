"use strict";

require("dotenv").config();

// 홈페이지 저장·표시·계산은 한국시간(Asia/Seoul) 기준
process.env.TZ = process.env.TZ || "Asia/Seoul";

const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin1234",
  ADMIN_NAME: process.env.ADMIN_NAME || "시스템 관리자",
  // "1" 또는 "true"이면 서버 시작 시 기존 관리자를 모두 지우고 재생성 (일회성)
  ADMIN_RESET: process.env.ADMIN_RESET === "1" || process.env.ADMIN_RESET === "true",
  SUPERVISOR_USERNAME: process.env.SUPERVISOR_USERNAME || "basic",
  SUPERVISOR_PASSWORD: process.env.SUPERVISOR_PASSWORD || "basic4444",
  SUPERVISOR_NAME: process.env.SUPERVISOR_NAME || "슈퍼바이저",
  TIMEZONE: process.env.TZ || "Asia/Seoul",
  get isProd() {
    return this.NODE_ENV === "production";
  },
};

module.exports = env;

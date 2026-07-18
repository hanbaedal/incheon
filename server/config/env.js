"use strict";

require("dotenv").config();

const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin1234",
  ADMIN_NAME: process.env.ADMIN_NAME || "시스템 관리자",
  get isProd() {
    return this.NODE_ENV === "production";
  },
};

module.exports = env;

"use strict";

const env = require("./config/env");
const { connectDB } = require("./config/db");
const { createApp } = require("./app");

async function main() {
  try {
    await connectDB();
    console.log("[DB] MongoDB 연결 성공");
  } catch (err) {
    console.error("[DB] 연결 실패:", err.message);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[SERVER] http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

main();

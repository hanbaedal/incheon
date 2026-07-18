"use strict";

const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

async function connectDB(uri) {
  const target = uri || env.MONGODB_URI;
  if (!target) {
    throw new Error(
      "MONGODB_URI 가 설정되지 않았습니다. .env 파일 또는 환경 변수를 확인하세요."
    );
  }
  await mongoose.connect(target, {
    serverSelectionTimeoutMS: 10000,
  });
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB, mongoose };

"use strict";

function notFound(req, res, next) {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "요청하신 API 경로를 찾을 수 없습니다." });
  }
  next();
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || (err.name === "ValidationError" ? 400 : 500);
  if (status >= 500) console.error(err);

  let message = err.message || "서버 오류가 발생했습니다.";
  if (err.code === 11000) {
    message = "이미 존재하는 값입니다. (중복)";
    return res.status(409).json({ error: message });
  }
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };

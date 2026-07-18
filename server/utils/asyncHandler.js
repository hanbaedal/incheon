"use strict";

// 비동기 라우트 핸들러의 에러를 next() 로 전달
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

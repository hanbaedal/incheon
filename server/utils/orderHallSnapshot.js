"use strict";

const Order = require("../models/Order");
const { hallSnapshotToSummary, usageToHallSummary } = require("./hallFormat");

async function hasActiveOrdersForUsage(hallUsageId) {
  if (!hallUsageId) return false;
  return !!(await Order.exists({
    hallUsageId,
    status: { $ne: "canceled" },
  }));
}

function orderHallForDisplay(orderJson, usage, hall) {
  if (orderJson && orderJson.hallSnapshot && orderJson.hallSnapshot.hallNumber) {
    return hallSnapshotToSummary(orderJson.hallSnapshot);
  }
  return usageToHallSummary(usage, hall);
}

function assertHallScheduleLocked(existing, patch, hasOrders) {
  if (!hasOrders) return null;
  const fields = ["hallId", "funeralDate", "funeralTime"];
  for (const key of fields) {
    if (!(key in patch)) continue;
    const next = patch[key];
    const prev = existing[key];
    if (String(next || "") !== String(prev || "")) {
      return "예약(주문)이 접수된 후에는 빈소·발인 일자·발인 시각을 변경할 수 없습니다.";
    }
  }
  return null;
}

module.exports = {
  hasActiveOrdersForUsage,
  orderHallForDisplay,
  assertHallScheduleLocked,
};

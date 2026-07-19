"use strict";

const Order = require("../models/Order");
const { computeHallFee, funeralDayLabel } = require("./hallPricing");

async function ensureUsagePricing(usage) {
  const hall = usage.hallId;
  if (!hall || hall.isVirtual) return false;

  let changed = false;
  if (!usage.funeralDays) {
    usage.funeralDays = 3;
    changed = true;
  }

  const dailyPrice = Math.max(0, Math.round(Number(usage.dailyPrice) || Number(hall.dailyPrice) || 0));
  const hallFeeAmount = computeHallFee(dailyPrice, usage.funeralDays);

  if (usage.dailyPrice !== dailyPrice) {
    usage.dailyPrice = dailyPrice;
    changed = true;
  }
  if (usage.hallFeeAmount !== hallFeeAmount) {
    usage.hallFeeAmount = hallFeeAmount;
    changed = true;
  }

  if (changed) await usage.save();
  return changed;
}

async function isHallFeeOrdered(familyUserId, hallUsageId) {
  if (!familyUserId || !hallUsageId) return false;
  return !!(await Order.exists({
    familyUserId,
    hallUsageId,
    status: { $ne: "canceled" },
    items: { $elemMatch: { itemType: "hall" } },
  }));
}

function hallOrderItemFromUsage(usage, hall) {
  const days = usage.funeralDays || 3;
  const dailyPrice = usage.dailyPrice || 0;
  return {
    itemType: "hall",
    itemRefId: usage._id,
    catKey: "hall",
    name: `${hall.name} 빈소 이용 (${funeralDayLabel(days)})`,
    unit: "일",
    price: dailyPrice,
    qty: days,
    finalQty: days,
    settlementType: "prepaid",
    settled: true,
    taxable: true,
  };
}

async function appendHallFeeOrderItem(orderItems, familyUserId, hallUsageId) {
  if (!familyUserId || !hallUsageId) return false;
  if (await isHallFeeOrdered(familyUserId, hallUsageId)) return false;

  const HallUsage = require("../models/HallUsage");
  const usage = await HallUsage.findById(hallUsageId).populate("hallId");
  if (!usage || usage.status !== "active") return false;

  const hall = usage.hallId;
  if (!hall || hall.isVirtual) return false;

  await ensureUsagePricing(usage);
  if (!usage.hallFeeAmount) return false;

  orderItems.unshift(hallOrderItemFromUsage(usage, hall));
  return true;
}

module.exports = {
  ensureUsagePricing,
  isHallFeeOrdered,
  hallOrderItemFromUsage,
  appendHallFeeOrderItem,
};

"use strict";

const Hall = require("../models/Hall");
const HallUsage = require("../models/HallUsage");
const User = require("../models/User");
const { PHYSICAL_HALL_CAPACITY } = require("../constants/facility");
const { hallToCatalogJSON } = require("./hallFormat");
const {
  startOfDay,
  formatYmd,
  parseFuneralAt,
  diffCalendarDays,
  now,
} = require("./koreaTime");

function formatAvailabilityLabel(daysUntil, availableFrom) {
  const dateLabel = formatYmd(availableFrom);
  if (daysUntil <= 0) return `오늘(${dateLabel}) 발인 후 이용 가능`;
  if (daysUntil === 1) return `1일 후 (${dateLabel})부터 이용 가능`;
  return `${daysUntil}일 후 (${dateLabel})부터 이용 가능`;
}

function buildSlotSummary(usage) {
  const hall = usage.hallId;
  return {
    usageId: usage._id,
    hallName: hall ? hall.name : "",
    hallCode: hall ? hall.code : "",
    specLabel: hall ? hall.specLabel : "",
    isVirtual: !!(hall && hall.isVirtual),
    deceasedName: usage.deceasedName || "",
    chiefMourner: usage.chiefMourner || "",
    funeralDate: usage.funeralDate || "",
    funeralTime: usage.funeralTime || "",
    funeralAt: parseFuneralAt(usage.funeralDate, usage.funeralTime),
    hasSchedule: !!String(usage.funeralDate || "").trim(),
  };
}

function computeRoomRelease(slot, today) {
  if (!slot) {
    return {
      canRequestNow: true,
      availableFrom: today,
      availableLabel: "즉시 신청 가능",
      daysUntil: 0,
    };
  }

  const scheduled = slot.hasSchedule && slot.funeralAt;
  if (!scheduled) {
    return {
      canRequestNow: false,
      availableFrom: null,
      availableLabel: "발인일 미정 · 전화 상담 후 안내",
      daysUntil: null,
    };
  }

  const availableFrom = startOfDay(slot.funeralAt);
  const daysUntil = diffCalendarDays(today, availableFrom);
  return {
    canRequestNow: daysUntil <= 0,
    availableFrom,
    availableLabel: formatAvailabilityLabel(daysUntil, availableFrom),
    daysUntil,
  };
}

async function completeHallUsage(usage) {
  const familyUserId = usage.familyUserId;
  usage.status = "completed";
  usage.familyCode = "";
  usage.familyUserId = null;
  await usage.save();
  if (familyUserId) {
    await User.updateOne({ _id: familyUserId, hallUsageId: usage._id }, { hallUsageId: null });
  }
}

async function autoCompletePastFunerals(at = now()) {
  const usages = await HallUsage.find({
    status: "active",
    funeralDate: { $exists: true, $nin: ["", null] },
  });

  let completed = 0;
  for (const usage of usages) {
    const funeralAt = parseFuneralAt(usage.funeralDate, usage.funeralTime);
    if (!funeralAt || at.getTime() < funeralAt.getTime()) continue;
    await completeHallUsage(usage);
    completed += 1;
  }
  return { completed, checked: usages.length };
}

/** 호실별(101·102·103·109) 발인 일자 역산 — 일자 기준은 한국시간 */
async function computeHallAvailability() {
  await autoCompletePastFunerals();
  const today = startOfDay(now());
  const [halls, usages] = await Promise.all([
    Hall.find({ active: true }).sort({ sortOrder: 1, name: 1 }),
    HallUsage.find({ status: "active" }).populate("hallId").sort({ funeralDate: 1, createdAt: 1 }),
  ]);

  const usageByHallId = new Map();
  for (const u of usages) {
    const hid = u.hallId && (u.hallId._id || u.hallId);
    if (hid) usageByHallId.set(String(hid), u);
  }

  const allSlots = usages.map(buildSlotSummary);
  const physicalSlots = allSlots.filter((s) => !s.isVirtual);
  const activePhysicalCount = physicalSlots.length;
  const freePhysicalSlots = Math.max(0, PHYSICAL_HALL_CAPACITY - activePhysicalCount);

  const items = halls.map((hall) => {
    const base = hallToCatalogJSON(hall);
    const activeOnRoom = usageByHallId.get(String(hall._id));
    const slot = activeOnRoom ? buildSlotSummary(activeOnRoom) : null;

    if (hall.isVirtual) {
      return {
        ...base,
        usesPhysicalSlot: false,
        canRequestNow: true,
        availableFrom: formatYmd(today),
        availableLabel: "상담 후 진행 (즉시 신청 가능)",
        daysUntil: 0,
      };
    }

    const release = computeRoomRelease(slot, today);
    return {
      ...base,
      usesPhysicalSlot: true,
      canRequestNow: release.canRequestNow,
      availableFrom: release.availableFrom ? formatYmd(release.availableFrom) : null,
      availableLabel: release.availableLabel,
      daysUntil: release.daysUntil,
    };
  });

  const physicalItems = items.filter((it) => it.usesPhysicalSlot);
  const nextBusy = physicalItems
    .filter((it) => !it.canRequestNow && it.availableFrom)
    .sort((a, b) => String(a.availableFrom).localeCompare(String(b.availableFrom)))[0];

  return {
    capacity: PHYSICAL_HALL_CAPACITY,
    activePhysicalCount,
    freePhysicalSlots,
    canRequestPhysicalNow: physicalItems.some((it) => it.canRequestNow),
    nextAvailableFrom: nextBusy ? nextBusy.availableFrom : (freePhysicalSlots > 0 ? formatYmd(today) : null),
    nextAvailableLabel: nextBusy ? nextBusy.availableLabel : (freePhysicalSlots > 0 ? "즉시 신청 가능" : null),
    daysUntilNextSlot: nextBusy ? nextBusy.daysUntil : 0,
    timezone: "Asia/Seoul",
    activeUsages: allSlots.map((s) => ({
      ...s,
      funeralAt: s.funeralAt ? s.funeralAt.toISOString() : null,
      daysUntilRelease: s.funeralAt ? diffCalendarDays(today, startOfDay(s.funeralAt)) : null,
    })),
    items,
  };
}

module.exports = {
  computeHallAvailability,
  autoCompletePastFunerals,
  completeHallUsage,
  parseFuneralAt,
  formatAvailabilityLabel,
  diffCalendarDays,
};

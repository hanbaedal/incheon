"use strict";

/** 장례 기간 선택 (3·4·5일장) */
const HALL_FUNERAL_DAYS = [
  { days: 3, label: "3일장" },
  { days: 4, label: "4일장" },
  { days: 5, label: "5일장" },
];

const ALLOWED_FUNERAL_DAYS = HALL_FUNERAL_DAYS.map((o) => o.days);

function funeralDayLabel(days) {
  const n = Number(days);
  const found = HALL_FUNERAL_DAYS.find((o) => o.days === n);
  return found ? found.label : n ? `${n}일장` : "";
}

function computeHallFee(dailyPrice, funeralDays) {
  const unit = Math.max(0, Math.round(Number(dailyPrice) || 0));
  const days = Number(funeralDays);
  if (!ALLOWED_FUNERAL_DAYS.includes(days)) return 0;
  return unit * days;
}

function normalizeFuneralDays(value, isVirtual) {
  if (isVirtual) return null;
  const days = Number(value);
  if (!ALLOWED_FUNERAL_DAYS.includes(days)) return null;
  return days;
}

module.exports = {
  HALL_FUNERAL_DAYS,
  ALLOWED_FUNERAL_DAYS,
  funeralDayLabel,
  computeHallFee,
  normalizeFuneralDays,
};

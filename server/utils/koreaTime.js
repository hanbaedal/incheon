"use strict";

/** 한국 표준시 (Asia/Seoul, UTC+9) — 저장·표시·일자 계산의 기준 */
const TIMEZONE = "Asia/Seoul";

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Date → KST 구성요소 */
function partsKst(input = new Date()) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const map = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  // en-US hour12:false 에서 24시가 "24"로 나오는 환경 보정
  let hour = map.hour === "24" ? "00" : map.hour;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** 현재 시각 (Date 객체, 내부는 UTC 인스턴트) */
function now() {
  return new Date();
}

/** YYYY-MM-DD (KST) */
function formatYmd(input = new Date()) {
  const p = partsKst(input);
  if (!p) return "";
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** YYYYMMDD (KST) — 주문번호 등 */
function formatYmdCompact(input = new Date()) {
  const p = partsKst(input);
  if (!p) return "";
  return `${p.year}${pad(p.month)}${pad(p.day)}`;
}

/** YYYY-MM-DD HH:mm (KST) */
function formatYmdHm(input = new Date()) {
  const p = partsKst(input);
  if (!p) return "";
  return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
}

/** YYYY년 MM월 DD일 (KST) */
function formatYmdKorean(input = new Date()) {
  const p = partsKst(input);
  if (!p) return "";
  return `${p.year}년 ${pad(p.month)}월 ${pad(p.day)}일`;
}

/**
 * KST 달력 날짜의 00:00:00 을 UTC Date 로 반환
 * (예: 2026-11-14 KST 자정 = 2026-11-13T15:00:00.000Z)
 */
function startOfDay(input = new Date()) {
  const ymd = typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)
    ? input.slice(0, 10)
    : formatYmd(input);
  return new Date(`${ymd}T00:00:00+09:00`);
}

/** KST 날짜 문자열(YYYY-MM-DD) + 시각(HH:mm) → Date */
function fromKstLocal(ymd, hm = "00:00") {
  const ds = String(ymd || "").trim();
  const m = ds.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const y = m[1];
  const mo = pad(m[2]);
  const day = pad(m[3]);
  const ts = String(hm || "00:00").trim();
  const tm = ts.match(/^(\d{1,2}):(\d{2})/);
  const hh = tm ? pad(tm[1]) : "00";
  const mm = tm ? tm[2] : "00";
  const d = new Date(`${y}-${mo}-${day}T${hh}:${mm}:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 발인일·시각을 KST로 해석 (시각 없으면 당일 23:59 KST) */
function parseFuneralAt(funeralDate, funeralTime) {
  const ds = String(funeralDate || "").trim();
  if (!ds) return null;
  const ts = String(funeralTime || "").trim();
  if (/^\d{1,2}:\d{2}/.test(ts)) return fromKstLocal(ds, ts);
  return fromKstLocal(ds, "23:59");
}

/** KST 달력 일수 차이 (to - from) */
function diffCalendarDays(from, to) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / 86400000);
}

/** ISO 문자열 (표시용으로 KST 오프셋 포함) */
function toKstISOString(input = new Date()) {
  const p = partsKst(input);
  if (!p) return "";
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}+09:00`;
}

module.exports = {
  TIMEZONE,
  now,
  partsKst,
  formatYmd,
  formatYmdCompact,
  formatYmdHm,
  formatYmdKorean,
  startOfDay,
  fromKstLocal,
  parseFuneralAt,
  diffCalendarDays,
  toKstISOString,
};

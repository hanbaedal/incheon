/* 한국 표준시(Asia/Seoul) 표시·파싱 공통 */
(function (global) {
  "use strict";

  var TIMEZONE = "Asia/Seoul";

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function partsKst(input) {
    var d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    var map = {};
    fmt.formatToParts(d).forEach(function (p) {
      if (p.type !== "literal") map[p.type] = p.value;
    });
    var hour = map.hour === "24" ? "00" : map.hour;
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(hour),
      minute: Number(map.minute),
      second: Number(map.second),
    };
  }

  function formatYmd(input) {
    var p = partsKst(input == null ? new Date() : input);
    if (!p) return "";
    return p.year + "-" + pad(p.month) + "-" + pad(p.day);
  }

  function formatYmdHm(input) {
    var p = partsKst(input == null ? new Date() : input);
    if (!p) return "";
    return p.year + "-" + pad(p.month) + "-" + pad(p.day) + " " + pad(p.hour) + ":" + pad(p.minute);
  }

  function formatYmdKorean(input) {
    var p = partsKst(input == null ? new Date() : input);
    if (!p) return "";
    return p.year + "년 " + pad(p.month) + "월 " + pad(p.day) + "일";
  }

  /** 화면용: 날짜만 (없으면 "-") */
  function fmtDay(iso) {
    if (!iso) return "-";
    var s = formatYmd(iso);
    return s || "-";
  }

  /** 화면용: 날짜+시각 */
  function fmt(iso) {
    if (!iso) return "-";
    var s = formatYmdHm(iso);
    return s || "-";
  }

  global.KoreaTime = {
    TIMEZONE: TIMEZONE,
    partsKst: partsKst,
    formatYmd: formatYmd,
    formatYmdHm: formatYmdHm,
    formatYmdKorean: formatYmdKorean,
    fmtDay: fmtDay,
    fmt: fmt,
  };

  // 기존 전역 포맷터와 호환
  global.fmtDay = fmtDay;
  global.fmt = fmt;
})(typeof window !== "undefined" ? window : globalThis);

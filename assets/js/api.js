/* 공용 프론트엔드 API 헬퍼 (정적 페이지에서 백엔드 호출) */
(function () {
  "use strict";

  async function request(path, opts) {
    opts = opts || {};
    const res = await fetch("/api" + path, {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error((data && data.error) || "요청 처리 중 오류가 발생했습니다.");
    return data;
  }

  window.API = {
    get: (p) => request(p),
    post: (p, body) => request(p, { method: "POST", body }),
  };

  window.escHtml = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  function kstParts(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const map = {};
    fmt.formatToParts(d).forEach((part) => {
      if (part.type !== "literal") map[part.type] = part.value;
    });
    return map;
  }

  window.fmtDay = function (iso) {
    if (!iso) return "-";
    const map = kstParts(iso);
    if (!map) return "-";
    return `${map.year}-${map.month}-${map.day}`;
  };

  window.fmt = function (iso) {
    if (!iso) return "-";
    const map = kstParts(iso);
    if (!map) return "-";
    const hour = map.hour === "24" ? "00" : map.hour;
    return `${map.year}-${map.month}-${map.day} ${hour}:${map.minute}`;
  };

  // site.js 의 언어 적용(init) 이후 실행되도록 보장
  window.onSiteReady = function (fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(fn, 0));
    } else {
      setTimeout(fn, 0);
    }
  };
})();

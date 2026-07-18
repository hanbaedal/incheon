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

  window.fmtDay = function (iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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

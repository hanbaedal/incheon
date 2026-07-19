"use strict";
/* 장례서비스 서브페이지 - 로그인한 상주/관리자에게만 품목·가격 카드 표시 */

(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }

  async function isMemberLoggedIn() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) return false;
      const data = await res.json();
      const u = data && data.user;
      return !!(u && (u.role === "family" || u.role === "admin"));
    } catch (e) {
      return false;
    }
  }

  async function loadProducts(catKey) {
    const host = document.getElementById("serviceProducts");
    if (!host || !catKey) return;

    if (!(await isMemberLoggedIn())) {
      host.innerHTML =
        '<div class="block service-prod-login-notice">' +
        "<h3>품목·가격 안내</h3>" +
        "<p>품목·가격 확인 및 온라인 예약은 <strong>상주(유족) 로그인</strong> 후 이용하실 수 있습니다.<br>" +
        "로그인하지 않으시면 위 안내 문구만 확인하실 수 있습니다.</p>" +
        '<a class="btn btn-gold" href="/pages/member/login.html">상주 로그인 →</a>' +
        "</div>";
      return;
    }

    host.innerHTML = '<div class="service-prod-loading">상품 정보를 불러오는 중…</div>';
    try {
      const res = await fetch("/api/products?catKey=" + encodeURIComponent(catKey));
      const data = await res.json();
      const items = data.items || [];
      if (items.length === 0) {
        host.innerHTML = '<div class="service-prod-empty">등록된 상품이 없습니다.</div>';
        return;
      }
      host.innerHTML =
        '<div class="block"><h3>품목 안내</h3><div class="service-prod-grid">' +
        items.map((p) => `
          <article class="service-prod-card">
            ${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" class="service-prod-img">` : '<div class="service-prod-img placeholder">이미지 준비 중</div>'}
            <div class="service-prod-body">
              <h4>${esc(p.name)}</h4>
              <p>${esc(p.description) || "상세 설명은 장례식장으로 문의해 주세요."}</p>
              <div class="service-prod-price">${won(p.price)} <span>/ ${esc(p.unit)}</span></div>
              ${p.settlementType === "postpaid" ? '<span class="service-prod-badge">소비 후 정산</span>' : ""}
            </div>
          </article>`).join("") +
        "</div>" +
        '<p class="service-prod-reserve-hint"><a href="/pages/member/shop.html">장례 예약</a> 메뉴에서 품목을 선택·예약하실 수 있습니다.</p></div>';
    } catch (e) {
      host.innerHTML = '<div class="service-prod-empty">상품 정보를 불러올 수 없습니다.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const catKey = window.SERVICE_CAT_KEY || (window.SITE_PAGE && window.SITE_PAGE.sub) || "";
    loadProducts(catKey);
  });
})();

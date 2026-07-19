"use strict";
/* 장례서비스 서브페이지 - 관리자 등록 상품 동적 카드 */

(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }

  async function loadProducts(catKey) {
    const host = document.getElementById("serviceProducts");
    if (!host || !catKey) return;
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
        "</div></div>";
    } catch (e) {
      host.innerHTML = '<div class="service-prod-empty">상품 정보를 불러올 수 없습니다.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const catKey = window.SERVICE_CAT_KEY || (window.SITE_PAGE && window.SITE_PAGE.sub) || "";
    loadProducts(catKey);
  });
})();

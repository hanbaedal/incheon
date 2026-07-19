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
  function fmtMm(n) { return n != null && n !== "" ? Number(n).toLocaleString("ko-KR") : "-"; }

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

  function loginNoticeHtml() {
    return (
      '<div class="block service-prod-login-notice">' +
      "<h3>품목·가격 안내</h3>" +
      "<p>품목·가격 확인 및 온라인 예약은 <strong>상주(유족) 로그인</strong> 후 이용하실 수 있습니다.<br>" +
      "로그인하지 않으시면 위 안내 문구만 확인하실 수 있습니다.</p>" +
      '<a class="btn btn-gold" href="/pages/member/login.html">상주 로그인 →</a>' +
      "</div>"
    );
  }

  function reserveHintHtml() {
    return '<p class="service-prod-reserve-hint"><a href="/pages/member/shop.html">장례 예약</a> 메뉴에서 품목을 선택·예약하실 수 있습니다.</p>';
  }

  async function renderCoffinSpecs(host) {
    const [coffinRes, hoengdaeRes] = await Promise.all([
      fetch("/api/coffins"),
      fetch("/api/hoengdae"),
    ]);
    const coffins = ((await coffinRes.json()).items) || [];
    const hoengdaes = ((await hoengdaeRes.json()).items) || [];
    const loggedIn = await isMemberLoggedIn();

    let html = "";
    if (coffins.length > 0) {
      html += `
        <div class="block">
          <h3>관 규격표</h3>
          <p class="note" style="margin-top:0">※ 단위 : ㎜</p>
          <table class="tbl">
            <thead>
              <tr><th rowspan="2">품명</th><th colspan="4">규격</th><th rowspan="2">원산지</th>${loggedIn ? '<th rowspan="2">가격</th>' : ""}</tr>
              <tr><th>어깨</th><th>높이</th><th>길이</th><th>두께</th></tr>
            </thead>
            <tbody>
              ${coffins.map((c) => `
                <tr>
                  <th>${esc(c.name)}</th>
                  <td>${esc(c.shoulder || "-")}</td>
                  <td>${fmtMm(c.height)}</td>
                  <td>${fmtMm(c.length)}</td>
                  <td>${esc(c.thickness || "-")}</td>
                  <td>${esc(c.origin || "-")}</td>
                  ${loggedIn ? `<td class="nowrap">${won(c.price)} / ${esc(c.unit)}</td>` : ""}
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`;
    }

    if (hoengdaes.length > 0) {
      html += `
        <div class="block">
          <h3>횡대 규격표</h3>
          <p class="note" style="margin-top:0">※ 단위 : ㎜</p>
          <table class="tbl">
            <thead>
              <tr><th rowspan="2">품명</th><th colspan="3">규격</th><th rowspan="2">원산지</th>${loggedIn ? '<th rowspan="2">가격</th>' : ""}</tr>
              <tr><th>세로</th><th>가로</th><th>두께</th></tr>
            </thead>
            <tbody>
              ${hoengdaes.map((h) => `
                <tr>
                  <th>${esc(h.name)}</th>
                  <td>${fmtMm(h.vertical)}</td>
                  <td>${fmtMm(h.horizontal)}</td>
                  <td>${fmtMm(h.thickness)}</td>
                  <td>${esc(h.origin || "-")}</td>
                  ${loggedIn ? `<td class="nowrap">${won(h.price)} / ${esc(h.unit)}</td>` : ""}
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`;
    }

    if (!loggedIn) {
      html += loginNoticeHtml();
    } else {
      html += '<div class="block">' + reserveHintHtml() + "</div>";
    }

    host.innerHTML = html || '<div class="service-prod-empty">등록된 관·횡대 정보가 없습니다.</div>';
  }

  async function renderShroudSpecs(host) {
    const res = await fetch("/api/shrouds");
    const items = ((await res.json()).items) || [];
    const loggedIn = await isMemberLoggedIn();
    if (items.length === 0) {
      host.innerHTML = '<div class="service-prod-empty">등록된 수의 정보가 없습니다.</div>';
      return;
    }
    let html = `
      <div class="block">
        <h3>수의 규격표</h3>
        <table class="tbl">
          <thead>
            <tr><th>상품명</th><th>재질구성</th><th>직조</th><th>원사 생산국</th><th>원단 생산지</th>${loggedIn ? "<th>가격</th>" : ""}</tr>
          </thead>
          <tbody>
            ${items.map((s) => `
              <tr>
                <th>${esc(s.name)}</th>
                <td>${esc(s.material || "-")}</td>
                <td>${esc(s.weaveType || "-")}</td>
                <td>${esc(s.yarnOrigin || "-")}</td>
                <td>${esc(s.fabricOrigin || "-")}</td>
                ${loggedIn ? `<td class="nowrap">${won(s.price)} / ${esc(s.unit)}</td>` : ""}
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    if (!loggedIn) html += loginNoticeHtml();
    else html += '<div class="block">' + reserveHintHtml() + "</div>";
    host.innerHTML = html;
  }

  async function renderAccessorySpecs(host) {
    const res = await fetch("/api/accessories");
    const items = ((await res.json()).items) || [];
    const loggedIn = await isMemberLoggedIn();
    if (items.length === 0) {
      host.innerHTML = '<div class="service-prod-empty">등록된 부속물품 정보가 없습니다.</div>';
      return;
    }
    const rows = [];
    for (let i = 0; i < items.length; i += 2) {
      const left = items[i];
      const right = items[i + 1];
      rows.push(`
        <tr>
          <th>${esc(left.name)}</th><td>${esc(left.spec || "-")}</td>
          ${right ? `<th>${esc(right.name)}</th><td>${esc(right.spec || "-")}</td>` : "<th></th><td></td>"}
          ${loggedIn ? `<td class="nowrap">${won(left.price)}</td>${right ? `<td class="nowrap">${won(right.price)}</td>` : "<td></td>"}` : ""}
        </tr>`);
    }
    let html = `
      <div class="block">
        <h3>부속물품 규격표</h3>
        <table class="tbl">
          <thead>
            <tr><th>품명</th><th>규격</th><th>품명</th><th>규격</th>${loggedIn ? "<th>가격</th><th>가격</th>" : ""}</tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>`;
    if (!loggedIn) html += loginNoticeHtml();
    else html += '<div class="block">' + reserveHintHtml() + "</div>";
    host.innerHTML = html;
  }

  async function loadProducts(catKey) {
    const host = document.getElementById("serviceProducts");
    if (!host || !catKey) return;

    if (catKey === "coffin") {
      host.innerHTML = '<div class="service-prod-loading">관·횡대 정보를 불러오는 중…</div>';
      try {
        await renderCoffinSpecs(host);
      } catch (e) {
        host.innerHTML = '<div class="service-prod-empty">관·횡대 정보를 불러올 수 없습니다.</div>';
      }
      return;
    }

    if (catKey === "shroud") {
      host.innerHTML = '<div class="service-prod-loading">수의 정보를 불러오는 중…</div>';
      try { await renderShroudSpecs(host); }
      catch (e) { host.innerHTML = '<div class="service-prod-empty">수의 정보를 불러올 수 없습니다.</div>'; }
      return;
    }

    if (catKey === "etc") {
      host.innerHTML = '<div class="service-prod-loading">부속물품 정보를 불러오는 중…</div>';
      try { await renderAccessorySpecs(host); }
      catch (e) { host.innerHTML = '<div class="service-prod-empty">부속물품 정보를 불러올 수 없습니다.</div>'; }
      return;
    }

    if (!(await isMemberLoggedIn())) {
      host.innerHTML = loginNoticeHtml();
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
        reserveHintHtml() + "</div>";
    } catch (e) {
      host.innerHTML = '<div class="service-prod-empty">상품 정보를 불러올 수 없습니다.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const catKey = window.SERVICE_CAT_KEY || (window.SITE_PAGE && window.SITE_PAGE.sub) || "";
    loadProducts(catKey);
  });
})();

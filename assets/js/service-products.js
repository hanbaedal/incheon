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

  const FOOD_LABELS = {
    meal: "식사류", anju: "안주류", tteok: "떡류", fruit: "과일류",
    jesa: "제사상", beverage: "식음료류", consumables: "공산품류",
  };
  const FLOWER_LABELS = {
    altar: "제단장식", basket: "근조바구니", wreath: "조문용 조화",
    chrysanthemum: "헌화용 국화", coffin: "관장식", vehicle: "차량장식",
  };
  const PHOTO_LABELS = {
    portrait: "영정", frame: "액자", idphoto: "증명사진", instant: "즉석사진",
  };
  const DRESS_LABELS = {
    women: "여성예복", shirt: "와이셔츠", belt: "벨트", socks: "양말",
    shoes: "구두", tie: "넥타이", undershirt: "런닝셔츠",
  };
  const DRESS_CAT_ORDER = ["women", "shirt", "belt", "socks", "shoes", "tie", "undershirt"];
  const HEARSE_LABELS = {
    cadillac: "캐딜락", limousine: "고급리무진",
  };
  const HEARSE_CAT_ORDER = ["cadillac", "limousine"];

  async function renderFoodCatalog(host, filterCats) {
    const res = await fetch("/api/food-items");
    const all = ((await res.json()).items) || [];
    const cats = filterCats || Object.keys(FOOD_LABELS);
    const loggedIn = await isMemberLoggedIn();
    let html = "";

    cats.forEach((cat) => {
      const items = all.filter((f) => f.foodCategory === cat);
      if (items.length === 0) return;
      html += `<div class="block"><h3>${esc(FOOD_LABELS[cat] || cat)}</h3>`;
      if (cat === "meal" || cat === "anju") {
        const pairs = [];
        for (let i = 0; i < items.length; i += 2) {
          pairs.push([items[i], items[i + 1] || null]);
        }
        html += `<table class="tbl"><thead><tr><th>${cat === "meal" ? "식사류" : "안주류"}</th><th>${cat === "meal" ? "반찬류" : "마른안주류"}</th>${loggedIn ? "<th>가격</th><th>가격</th>" : ""}</tr></thead><tbody>`;
        html += pairs.map(([a, b]) => `
          <tr>
            <th>${esc(a.name)}</th><td>${b ? esc(b.name) : ""}</td>
            ${loggedIn ? `<td class="nowrap">${won(a.price)}</td><td class="nowrap">${b ? won(b.price) : ""}</td>` : ""}
          </tr>`).join("");
        html += "</tbody></table>";
      } else if (cat === "tteok" || cat === "fruit") {
        const pairs = [];
        for (let i = 0; i < items.length; i += 2) {
          pairs.push([items[i], items[i + 1] || null]);
        }
        html += `<table class="tbl"><thead><tr><th>종류</th><th></th>${loggedIn ? "<th>가격</th><th>가격</th>" : ""}</tr></thead><tbody>`;
        html += pairs.map(([a, b]) => `
          <tr>
            <th>${esc(a.name)}</th><td>${b ? esc(b.name) : ""}</td>
            ${loggedIn ? `<td class="nowrap">${won(a.price)}</td><td class="nowrap">${b ? won(b.price) : ""}</td>` : ""}
          </tr>`).join("");
        html += "</tbody></table>";
      } else {
        html += `<table class="tbl"><thead><tr><th>품명</th>${loggedIn ? "<th>가격</th>" : ""}${cat === "beverage" || cat === "consumables" ? "<th>정산</th>" : ""}</tr></thead><tbody>`;
        html += items.map((f) => `
          <tr>
            <th>${esc(f.name)}</th>
            ${loggedIn ? `<td class="nowrap">${won(f.price)} / ${esc(f.unit)}</td>` : ""}
            ${cat === "beverage" || cat === "consumables" ? `<td>${f.settlementType === "postpaid" ? "소비 후 정산" : "선결제"}</td>` : ""}
          </tr>`).join("");
        html += "</tbody></table>";
      }
      html += "</div>";
    });

    if (!loggedIn) html += loginNoticeHtml();
    else html += '<div class="block">' + reserveHintHtml() + "</div>";
    host.innerHTML = html || '<div class="service-prod-empty">등록된 접객 음식이 없습니다.</div>';
  }

  async function renderFlowerCatalog(host, filterCats) {
    const res = await fetch("/api/flower-items");
    const all = ((await res.json()).items) || [];
    const cats = filterCats || Object.keys(FLOWER_LABELS);
    const loggedIn = await isMemberLoggedIn();
    let html = "";

    cats.forEach((cat) => {
      const items = all.filter((f) => f.flowerCategory === cat);
      if (items.length === 0) return;
      html += `<div class="block"><h3>${esc(FLOWER_LABELS[cat] || cat)}</h3>`;
      html += `<table class="tbl"><thead><tr><th>품명</th>${loggedIn ? "<th>가격</th>" : ""}</tr></thead><tbody>`;
      html += items.map((f) => `
        <tr>
          <th>${esc(f.name)}</th>
          ${loggedIn ? `<td class="nowrap">${won(f.price)} / ${esc(f.unit)}</td>` : ""}
        </tr>`).join("");
      html += "</tbody></table></div>";
    });

    if (!loggedIn) html += loginNoticeHtml();
    else html += '<div class="block">' + reserveHintHtml() + "</div>";
    host.innerHTML = html || '<div class="service-prod-empty">등록된 근조 화환이 없습니다.</div>';
  }

  async function renderPhotoCatalog(host, filterCats) {
    const res = await fetch("/api/photo-items");
    const all = ((await res.json()).items) || [];
    const cats = filterCats || Object.keys(PHOTO_LABELS);
    const loggedIn = await isMemberLoggedIn();
    let html = "";

    cats.forEach((cat) => {
      const items = all.filter((p) => p.photoCategory === cat);
      if (items.length === 0) return;
      const tableCat = cat === "portrait" || cat === "frame";
      html += `<div class="block"><h3>${esc(PHOTO_LABELS[cat] || cat)}</h3>`;
      html += `<table class="tbl"><thead><tr>`;
      if (tableCat) html += `<th>구분</th><th>규격</th>`;
      else html += `<th>구분</th><th>규격</th>`;
      if (loggedIn) html += `<th>가격</th>`;
      html += `</tr></thead><tbody>`;
      html += items.map((p) => {
        const spec = p.spec || p.name;
        if (tableCat) {
          return `<tr><th>${esc(p.subGroup || "-")}</th><td>${esc(p.name)}</td>${loggedIn ? `<td class="nowrap">${won(p.price)} / ${esc(p.unit)}</td>` : ""}</tr>`;
        }
        return `<tr><th>${esc(p.name)}</th><td>${esc(spec)}</td>${loggedIn ? `<td class="nowrap">${won(p.price)} / ${esc(p.unit)}</td>` : ""}</tr>`;
      }).join("");
      html += "</tbody></table></div>";
    });

    if (!loggedIn) html += loginNoticeHtml();
    else html += '<div class="block">' + reserveHintHtml() + "</div>";
    host.innerHTML = html || '<div class="service-prod-empty">등록된 영정 사진 정보가 없습니다.</div>';
  }

  async function renderDressCatalog(host) {
    const res = await fetch("/api/dress-items");
    const all = ((await res.json()).items) || [];
    const loggedIn = await isMemberLoggedIn();
    let html = "";

    if (all.length > 0) {
      const sorted = DRESS_CAT_ORDER.flatMap((cat) =>
        all.filter((d) => d.dressCategory === cat)
      ).concat(all.filter((d) => !DRESS_CAT_ORDER.includes(d.dressCategory)));
      html += `<div class="block"><h3>상복 대여 품목</h3>`;
      html += `<table class="tbl"><thead><tr><th>품목</th><th>규격</th><th>수량</th>${loggedIn ? "<th>가격</th>" : ""}</tr></thead><tbody>`;
      html += sorted.map((d) => `
        <tr>
          <th>${esc(d.name)}</th>
          <td>${esc(d.spec || "-")}</td>
          <td>${esc(d.unit || "1개")}</td>
          ${loggedIn ? `<td class="nowrap">${won(d.price)}</td>` : ""}
        </tr>`).join("");
      html += "</tbody></table></div>";
    }

    if (!loggedIn) html += loginNoticeHtml();
    else html += '<div class="block">' + reserveHintHtml() + "</div>";
    host.innerHTML = html || '<div class="service-prod-empty">등록된 상복 대여 품목이 없습니다.</div>';
  }

  async function renderHearseCatalog(host) {
    const res = await fetch("/api/hearse-items");
    const all = ((await res.json()).items) || [];
    const loggedIn = await isMemberLoggedIn();
    let html = "";

    HEARSE_CAT_ORDER.forEach((cat) => {
      const items = all.filter((h) => h.hearseCategory === cat);
      if (items.length === 0) return;
      html += `<div class="block"><h3>${esc(HEARSE_LABELS[cat] || cat)}</h3>`;
      html += `<table class="tbl"><thead><tr><th>차량</th><th>규격</th><th>수량</th>${loggedIn ? "<th>가격</th>" : ""}</tr></thead><tbody>`;
      html += items.map((h) => `
        <tr>
          <th>${esc(h.name)}</th>
          <td>${esc(h.spec || "-")}</td>
          <td>${esc(h.unit || "1대")}</td>
          ${loggedIn ? `<td class="nowrap">${won(h.price)}</td>` : ""}
        </tr>`).join("");
      html += "</tbody></table></div>";
    });

    if (!loggedIn) html += loginNoticeHtml();
    else html += '<div class="block">' + reserveHintHtml() + "</div>";
    host.innerHTML = html || '<div class="service-prod-empty">등록된 운구·차량 정보가 없습니다.</div>';
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

    if (catKey === "food" || catKey === "consumables") {
      host.innerHTML = '<div class="service-prod-loading">접객 음식 정보를 불러오는 중…</div>';
      try {
        await renderFoodCatalog(host, catKey === "consumables" ? ["beverage", "consumables"] : null);
      } catch (e) {
        host.innerHTML = '<div class="service-prod-empty">접객 음식 정보를 불러올 수 없습니다.</div>';
      }
      return;
    }

    if (catKey === "flower") {
      host.innerHTML = '<div class="service-prod-loading">근조 화환 정보를 불러오는 중…</div>';
      try {
        await renderFlowerCatalog(host);
      } catch (e) {
        host.innerHTML = '<div class="service-prod-empty">근조 화환 정보를 불러올 수 없습니다.</div>';
      }
      return;
    }

    if (catKey === "photo") {
      host.innerHTML = '<div class="service-prod-loading">영정 사진 정보를 불러오는 중…</div>';
      try {
        await renderPhotoCatalog(host);
      } catch (e) {
        host.innerHTML = '<div class="service-prod-empty">영정 사진 정보를 불러올 수 없습니다.</div>';
      }
      return;
    }

    if (catKey === "dress") {
      host.innerHTML = '<div class="service-prod-loading">상복 대여 정보를 불러오는 중…</div>';
      try {
        await renderDressCatalog(host);
      } catch (e) {
        host.innerHTML = '<div class="service-prod-empty">상복 대여 정보를 불러올 수 없습니다.</div>';
      }
      return;
    }

    if (catKey === "hearse") {
      host.innerHTML = '<div class="service-prod-loading">운구·차량 정보를 불러오는 중…</div>';
      try {
        await renderHearseCatalog(host);
      } catch (e) {
        host.innerHTML = '<div class="service-prod-empty">운구·차량 정보를 불러올 수 없습니다.</div>';
      }
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

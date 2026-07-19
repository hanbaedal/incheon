"use strict";
/* 상주(유족) 전용 영역 공통 스크립트 (한글) */

async function mApi(path, opts) {
  opts = opts || {};
  const headers = { "X-Session-Scope": "member" };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch("/api" + path, {
    method: opts.method || "GET",
    credentials: "same-origin",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401 && !opts.noRedirect) { location.href = "/pages/member/login.html"; throw new Error("unauthorized"); }
  if (!res.ok) throw new Error((data && data.error) || "요청 처리 중 오류가 발생했습니다.");
  return data;
}

function mEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }
function mFmtDay(iso) {
  if (!iso) return "-";
  const d = new Date(iso); const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

let mToastTimer = null;
function mToast(msg) {
  let t = document.getElementById("mToast");
  if (!t) { t = document.createElement("div"); t.id = "mToast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(mToastTimer);
  mToastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

const MEMBER_STATUS = { pending: "접수", confirmed: "확인", paid: "결제완료", canceled: "취소" };
const DEFAULT_FUNERAL_DAY_OPTIONS = [
  { days: 3, label: "3일장" },
  { days: 4, label: "4일장" },
  { days: 5, label: "5일장" },
];

function mToDateInputValue(s) {
  const m = String(s || "").trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${m[1]}-${p(m[2])}-${p(m[3])}`;
}

function mToTimeInputValue(s) {
  const m = String(s || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(m[1])}:${p(m[2])}`;
}

function mHallFormValues(prefix) {
  return {
    deceasedName: document.getElementById(prefix + "_deceasedName").value.trim(),
    chiefMourner: document.getElementById(prefix + "_chiefMourner").value.trim(),
    relationship: document.getElementById(prefix + "_relationship").value.trim(),
    age: document.getElementById(prefix + "_age").value.trim(),
    enshrinedAt: document.getElementById(prefix + "_enshrinedAt").value.trim(),
    funeralDate: document.getElementById(prefix + "_funeralDate").value.trim(),
    funeralTime: document.getElementById(prefix + "_funeralTime").value.trim(),
    burialSite: document.getElementById(prefix + "_burialSite").value.trim(),
  };
}

function mHallUsageFormHtml(prefix, data) {
  data = data || {};
  const locked = !!data.scheduleLocked;
  const lockAttr = locked ? " disabled readonly" : "";
  return `
    <div class="m-form-row">
      <div><label for="${prefix}_deceasedName">고인명 *</label><input id="${prefix}_deceasedName" value="${mEsc(data.deceasedName || "")}" /></div>
      <div><label for="${prefix}_chiefMourner">상주 *</label><input id="${prefix}_chiefMourner" value="${mEsc(data.chiefMourner || "")}" /></div>
    </div>
    <div class="m-form-row">
      <div><label for="${prefix}_relationship">고인과의 관계</label><input id="${prefix}_relationship" value="${mEsc(data.relationship || "")}" placeholder="예: 장남" /></div>
      <div><label for="${prefix}_age">향년</label><input id="${prefix}_age" value="${mEsc(data.age || "")}" placeholder="예: 향년 84세" /></div>
    </div>
    ${locked ? '<p class="muted" style="margin:0 0 8px;font-size:13px">예약(주문) 접수 후 발인 일자·시각은 변경할 수 없습니다.</p>' : ""}
    <div class="m-form-row">
      <div><label for="${prefix}_enshrinedAt">입관/안치 일자</label><input type="date" id="${prefix}_enshrinedAt" value="${mEsc(mToDateInputValue(data.enshrinedAt))}" /></div>
      <div><label for="${prefix}_burialSite">장지</label><input id="${prefix}_burialSite" value="${mEsc(data.burialSite || "")}" /></div>
    </div>
    <div class="m-form-row">
      <div><label for="${prefix}_funeralDate">발인 일자 *</label><input type="date" id="${prefix}_funeralDate" value="${mEsc(mToDateInputValue(data.funeralDate))}"${lockAttr} /></div>
      <div><label for="${prefix}_funeralTime">발인 시각</label><input type="time" id="${prefix}_funeralTime" value="${mEsc(mToTimeInputValue(data.funeralTime))}" step="60"${lockAttr} /></div>
    </div>`;
}

function mHallComputeFee(hall, days) {
  if (!hall || hall.isVirtual) return { dailyPrice: 0, funeralDays: null, hallFeeAmount: 0 };
  const dailyPrice = Math.max(0, Number(hall.dailyPrice) || 0);
  const funeralDays = Number(days) || 0;
  return { dailyPrice, funeralDays, hallFeeAmount: dailyPrice * funeralDays };
}

function mHallPriceBoxHtml(hall, days) {
  if (!hall) return "";
  if (hall.isVirtual) {
    return `<div class="price-box"><p class="hint">무빈소는 별도 빈소 이용료가 없습니다. 상담 후 진행됩니다.</p></div>`;
  }
  if (!days) {
    return `<div class="price-box"><p class="hint-warn">장례 기간(3·4·5일장)을 선택하면 이용료가 계산됩니다.</p></div>`;
  }
  const fee = mHallComputeFee(hall, days);
  return `
    <div class="price-box">
      <table>
        <tr><th>단가 (1일)</th><td>${won(fee.dailyPrice)}</td></tr>
        <tr><th>기간</th><td>${mEsc(days)}일장</td></tr>
        <tr><th>금액</th><td>${won(fee.hallFeeAmount)}</td></tr>
      </table>
    </div>`;
}

function mHallFuneralDaysPickerHtml(options, selectedDays, hall) {
  if (hall && hall.isVirtual) return "";
  const opts = options && options.length ? options : DEFAULT_FUNERAL_DAY_OPTIONS;
  return `
    <h4 class="section-h4">장례 기간 선택 *</h4>
    <div class="day-grid" id="mModalDayGrid">${opts.map((o) => `
      <div class="day-pick${Number(selectedDays) === o.days ? " selected" : ""}" data-days="${o.days}">${mEsc(o.label)}</div>
    `).join("")}</div>
    <div id="mModalPriceBox">${mHallPriceBoxHtml(hall, selectedDays)}</div>`;
}

const mMemberModal = (function () {
  let back = null;
  function ensure() {
    if (back) return;
    back = document.createElement("div");
    back.id = "mMemberModalBack";
    back.className = "m-modal-back";
    back.innerHTML = `
      <div class="m-modal" role="dialog" aria-modal="true">
        <div class="m-modal-head">
          <div><h3 id="mMemberModalTitle"></h3><p id="mMemberModalSub" class="m-modal-sub"></p></div>
          <button type="button" class="m-modal-x" id="mMemberModalClose" aria-label="닫기">&times;</button>
        </div>
        <div class="m-modal-body" id="mMemberModalBody"></div>
        <div class="m-modal-foot" id="mMemberModalFoot"></div>
      </div>`;
    document.body.appendChild(back);
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    document.getElementById("mMemberModalClose").addEventListener("click", close);
  }
  function close() {
    if (back) back.classList.remove("open");
  }
  function open(opts) {
    ensure();
    document.getElementById("mMemberModalTitle").textContent = opts.title || "";
    const sub = document.getElementById("mMemberModalSub");
    sub.textContent = opts.subtitle || "";
    sub.style.display = opts.subtitle ? "block" : "none";
    document.getElementById("mMemberModalBody").innerHTML = opts.bodyHtml || "";
    const foot = document.getElementById("mMemberModalFoot");
    foot.innerHTML = "";
    (opts.buttons || []).forEach((btn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = btn.cls || "btn";
      b.textContent = btn.label;
      b.addEventListener("click", async () => {
        if (btn.onClick) {
          const keep = await btn.onClick(b);
          if (keep !== false) close();
        } else close();
      });
      foot.appendChild(b);
    });
    back.classList.add("open");
    if (opts.onOpen) opts.onOpen();
  }
  return { open, close };
})();

const RESERVE_CATS = [
  { key: "hall", label: "빈소선택", type: "hall" },
  { key: "coffin", label: "장례 물품 · 관·횡대", type: "product" },
  { key: "shroud", label: "장례 물품 · 수의", type: "shroud" },
  { key: "etc", label: "장례 물품 · 부속물품", type: "accessory" },
  { key: "food", label: "접객 음식", type: "food" },
  { key: "flower", label: "근조 화환", type: "flower" },
  { key: "photo", label: "영정 사진", type: "photo" },
  { key: "dress", label: "상복 대여", type: "dress" },
  { key: "hearse", label: "운구·차량", type: "hearse" },
];

/* 헤더 렌더 + 로그인 가드. active: 'shop' | 'orders' */
async function memberHeader(active) {
  let me;
  try { me = (await mApi("/auth/me")).user; }
  catch (e) { return null; }
  if (!me || (me.role !== "family" && me.role !== "admin")) {
    location.href = "/pages/member/login.html"; return null;
  }
  const host = document.getElementById("mHeader");
  if (host) {
    host.className = "m-header";
    host.innerHTML = `
      <a href="/pages/member/shop.html" class="brand">
        <strong>상주 전용 서비스</strong>
        <span>인천병원장례식장 (인천중앙병원장례식장)</span>
      </a>
      <nav class="m-nav">
        <a href="/pages/member/shop.html" class="${active === "shop" ? "active" : ""}">장례 예약</a>
        <a href="/pages/member/orders.html" class="${active === "orders" ? "active" : ""}">내 예약</a>
        <a href="/" target="_blank">홈페이지</a>
        <span class="who">${mEsc(me.name)} 님</span>
        <button id="mLogout">로그아웃</button>
      </nav>`;
    document.getElementById("mLogout").addEventListener("click", async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      location.href = "/pages/member/login.html";
    });
  }
  return me;
}

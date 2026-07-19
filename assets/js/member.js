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
  if (!res.ok) throw new Error((data && data.error) || mT("common.error"));
  return data;
}

function mEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function won(n) { return (Number(n) || 0).toLocaleString(mLang() === "en" ? "en-US" : "ko-KR") + mT("common.won"); }
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

const MEMBER_STATUS = { pending: "pending", confirmed: "confirmed", paid: "paid", canceled: "canceled" };
const DEFAULT_FUNERAL_DAY_OPTIONS = mDefaultFuneralDayOptions();

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
      <div><label for="${prefix}_deceasedName">${mT("form.deceased")}</label><input id="${prefix}_deceasedName" value="${mEsc(data.deceasedName || "")}" /></div>
      <div><label for="${prefix}_chiefMourner">${mT("form.chief")}</label><input id="${prefix}_chiefMourner" value="${mEsc(data.chiefMourner || "")}" /></div>
    </div>
    <div class="m-form-row">
      <div><label for="${prefix}_relationship">${mT("form.relation")}</label><input id="${prefix}_relationship" value="${mEsc(data.relationship || "")}" placeholder="${mEsc(mT("form.relationPh"))}" /></div>
      <div><label for="${prefix}_age">${mT("form.age")}</label><input id="${prefix}_age" value="${mEsc(data.age || "")}" placeholder="${mEsc(mT("form.agePh"))}" /></div>
    </div>
    ${locked ? `<p class="muted" style="margin:0 0 8px;font-size:13px">${mEsc(mT("hall.scheduleLocked"))}</p>` : ""}
    <div class="m-form-row">
      <div><label for="${prefix}_enshrinedAt">${mT("form.enshrine")}</label><input type="date" id="${prefix}_enshrinedAt" value="${mEsc(mToDateInputValue(data.enshrinedAt))}" /></div>
      <div><label for="${prefix}_burialSite">${mT("form.burial")}</label><input id="${prefix}_burialSite" value="${mEsc(data.burialSite || "")}" /></div>
    </div>
    <div class="m-form-row">
      <div><label for="${prefix}_funeralDate">${mT("form.funeralDate")}</label><input type="date" id="${prefix}_funeralDate" value="${mEsc(mToDateInputValue(data.funeralDate))}"${lockAttr} /></div>
      <div><label for="${prefix}_funeralTime">${mT("form.funeralTime")}</label><input type="time" id="${prefix}_funeralTime" value="${mEsc(mToTimeInputValue(data.funeralTime))}" step="60"${lockAttr} /></div>
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
    return `<div class="price-box"><p class="hint">${mEsc(mT("hall.virtualHint"))}</p></div>`;
  }
  if (!days) {
    return `<div class="price-box"><p class="hint-warn">${mEsc(mT("hall.daysHint"))}</p></div>`;
  }
  const fee = mHallComputeFee(hall, days);
  return `
    <div class="price-box">
      <table>
        <tr><th>${mEsc(mT("hall.priceDaily"))}</th><td>${won(fee.dailyPrice)}</td></tr>
        <tr><th>${mEsc(mT("hall.pricePeriod"))}</th><td>${mEsc(days)}${mEsc(mT("common.daySuffix"))}</td></tr>
        <tr><th>${mEsc(mT("hall.priceAmount"))}</th><td>${won(fee.hallFeeAmount)}</td></tr>
      </table>
    </div>`;
}

function mHallFuneralDaysPickerHtml(options, selectedDays, hall) {
  if (hall && hall.isVirtual) return "";
  const opts = options && options.length ? options : mDefaultFuneralDayOptions();
  return `
    <h4 class="section-h4">${mEsc(mT("hall.daysTitle"))}</h4>
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
          <button type="button" class="m-modal-x" id="mMemberModalClose" aria-label="${mEsc(mT("common.close"))}">&times;</button>
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

const RESERVE_CATS = mReserveCats();

/* 헤더 렌더 + 로그인 가드. active: 'shop' | 'orders' | 'guide' */
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
        <strong>${mEsc(mT("brand.title"))}</strong>
        <span>${mEsc(mT("brand.sub"))}</span>
      </a>
      <nav class="m-nav">
        <a href="/pages/member/shop.html" class="${active === "shop" ? "active" : ""}">${mEsc(mT("nav.shop"))}</a>
        <a href="/pages/member/orders.html" class="${active === "orders" ? "active" : ""}">${mEsc(mT("nav.orders"))}</a>
        <a href="/pages/member/guide.html" class="${active === "guide" ? "active" : ""}">${mEsc(mT("nav.guide"))}</a>
        <a href="/" target="_blank">${mEsc(mT("nav.homepage"))}</a>
        <span id="mLangSwitch"></span>
        <span class="who">${mEsc(me.name)}${mEsc(mT("nav.whoSuffix"))}</span>
        <button id="mLogout">${mEsc(mT("nav.logout"))}</button>
      </nav>`;
    mRenderLangSwitch(document.getElementById("mLangSwitch"));
    document.documentElement.lang = mLang() === "zh" ? "zh-CN" : mLang();
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

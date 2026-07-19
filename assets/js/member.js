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

/* 헤더 렌더 + 로그인 가드. active: 'shop' | 'orders' | 'hall' */
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
      <div class="brand"><strong>상주 전용 서비스</strong><span>인천병원장례식장 (인천중앙병원장례식장)</span></div>
      <nav class="m-nav">
        <a href="/pages/member/hall.html" class="${active === "hall" ? "active" : ""}">빈소 이용</a>
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

"use strict";
/* 상주(유족) 전용 영역 공통 스크립트 (한글) */

async function mApi(path, opts) {
  opts = opts || {};
  const res = await fetch("/api" + path, {
    method: opts.method || "GET",
    credentials: "same-origin",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
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
      <div class="brand"><strong>상주 전용 서비스</strong><span>근로복지공단 인천병원 장례식장</span></div>
      <nav class="m-nav">
        <a href="/pages/member/shop.html" class="${active === "shop" ? "active" : ""}">상품 주문</a>
        <a href="/pages/member/orders.html" class="${active === "orders" ? "active" : ""}">내 주문</a>
        <a href="/" target="_blank">홈페이지</a>
        <span class="who">${mEsc(me.name)} 님</span>
        <button id="mLogout">로그아웃</button>
      </nav>`;
    document.getElementById("mLogout").addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      location.href = "/pages/member/login.html";
    });
  }
  return me;
}

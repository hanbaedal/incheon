"use strict";
/* 근로복지공단 인천병원 장례식장 - 관리자 콘솔 로직 (한글 전용) */

const ADMIN_LOGIN_URL = "/pages/member/login.html?next=" + encodeURIComponent("/admin/");

/* ---------- 공통 유틸 ---------- */
async function api(path, opts) {
  opts = opts || {};
  const headers = { "X-Session-Scope": "admin" };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch("/api" + path, {
    method: opts.method || "GET",
    credentials: "same-origin",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401) { location.href = ADMIN_LOGIN_URL; throw new Error("unauthorized"); }
  if (!res.ok) throw new Error((data && data.error) || "요청 처리 중 오류가 발생했습니다.");
  return data;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function fmt(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtDay(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/** 발인 일자 등 date input용 YYYY-MM-DD */
function toDateInputValue(s) {
  const m = String(s || "").trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${m[1]}-${p(m[2])}-${p(m[3])}`;
}
/** 발인 시각 time input용 HH:mm */
function toTimeInputValue(s) {
  const m = String(s || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(m[1])}:${p(m[2])}`;
}

let toastTimer = null;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- 모달 ---------- */
const modalBack = document.getElementById("modalBack");
function openModal(title, bodyHtml, footButtons) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  const foot = document.getElementById("modalFoot");
  foot.innerHTML = "";
  (footButtons || []).forEach((b) => {
    const btn = document.createElement("button");
    btn.className = "btn " + (b.cls || "");
    btn.textContent = b.label;
    btn.addEventListener("click", b.onClick);
    foot.appendChild(btn);
  });
  modalBack.classList.add("open");
}
function closeModal() { modalBack.classList.remove("open"); }
document.getElementById("modalClose").addEventListener("click", closeModal);
modalBack.addEventListener("click", (e) => { if (e.target === modalBack) closeModal(); });

/* ---------- 문서 미리보기 모달 (상주 내 예약과 동일) ---------- */
let docModalHtml = "";
const docModalBack = document.getElementById("docModalBack");

function bindDocModal() {
  if (!docModalBack || docModalBack.dataset.bound) return;
  docModalBack.dataset.bound = "1";
  const closeDocModal = () => {
    docModalBack.classList.remove("open");
    docModalBack.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  document.getElementById("docModalClose").addEventListener("click", closeDocModal);
  document.getElementById("docModalClose2").addEventListener("click", closeDocModal);
  docModalBack.addEventListener("click", (e) => { if (e.target === docModalBack) closeDocModal(); });
  document.getElementById("docModalPrint").addEventListener("click", () => {
    printDocHtml(docModalHtml, document.getElementById("docModalTitle").textContent);
  });
}

function openDocPreview(title, html) {
  bindDocModal();
  docModalHtml = html;
  document.getElementById("docModalTitle").textContent = title;
  document.getElementById("docModalBody").innerHTML = html;
  docModalBack.classList.add("open");
  docModalBack.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

async function showAdminOrderDoc(orderId) {
  const data = await api("/orders/" + orderId);
  openDocPreview("주문서 · " + data.order.orderNumber, buildOrderDocHtml(data.order, "order"));
}

async function showAdminAggregateDoc(familyId, type) {
  const s = await api("/orders/admin/summary?familyUserId=" + encodeURIComponent(familyId));
  if (!s.orderCount) { toast("집계할 주문이 없습니다."); return; }
  const labels = { order: "주문서 합계", statement: "거래명세서", tax: "세금계산서" };
  openDocPreview(labels[type] || "문서", buildAggregateDocHtml(s, type));
}

function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function checked(id) { const el = document.getElementById(id); return el ? el.checked : false; }

/* ---------- 인증 가드 ---------- */
let ME = null;
async function guard() {
  try {
    const d = await api("/auth/me");
    if (!d.user || d.user.role !== "admin") { location.href = ADMIN_LOGIN_URL; return false; }
    ME = d.user;
    document.getElementById("whoName").textContent = ME.name + " 님";
    return true;
  } catch (e) { location.href = ADMIN_LOGIN_URL; return false; }
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  location.href = ADMIN_LOGIN_URL;
});

/* ---------- 네비게이션 (상단 메가 메뉴) ---------- */
const NAV_MENU = [
  { id: "dashboard", label: "대시보드", view: "dashboard" },
  { id: "ops", label: "운영", badgeId: "navHallReqBadge",
    items: [
      { view: "halls", label: "빈소 목록" },
      { view: "hallUsages", label: "빈소 이용" },
      { view: "hallRegister", label: "빈소 이용 등록" },
      { view: "families", label: "상주 계정" },
      { view: "hallRequests", label: "빈소 신청" },
    ],
  },
  {
    id: "goods", label: "장례 물품",
    items: [
      { view: "prodCoffin", label: "관" },
      { view: "prodHoengdae", label: "횡대" },
      { view: "prodShroud", label: "수의" },
      { view: "prodAccessory", label: "부속물품" },
    ],
  },
  {
    id: "service", label: "접객·서비스",
    groups: [
      {
        label: "접객 음식",
        items: [
          { view: "prodFoodMeal", label: "식사류" },
          { view: "prodFoodAnju", label: "안주류" },
          { view: "prodFoodTteok", label: "떡류" },
          { view: "prodFoodFruit", label: "과일류" },
          { view: "prodFoodJesa", label: "제사상" },
          { view: "prodFoodBeverage", label: "식음료류" },
          { view: "prodFoodConsumables", label: "공산품류" },
        ],
      },
      {
        label: "근조 화환",
        items: [
          { view: "prodFlowerAltar", label: "제단장식" },
          { view: "prodFlowerBasket", label: "근조바구니" },
          { view: "prodFlowerWreath", label: "조문용 조화" },
          { view: "prodFlowerChrys", label: "헌화용 국화" },
          { view: "prodFlowerCoffin", label: "관장식" },
          { view: "prodFlowerVehicle", label: "차량장식" },
        ],
      },
      {
        label: "영정 사진",
        items: [
          { view: "prodPhotoPortrait", label: "영정" },
          { view: "prodPhotoFrame", label: "액자" },
          { view: "prodPhotoId", label: "증명사진" },
          { view: "prodPhotoInstant", label: "즉석사진" },
        ],
      },
      {
        label: "상복·운구",
        items: [
          { view: "prodDress", label: "상복 대여" },
          { view: "prodHearseCadillac", label: "캐딜락" },
          { view: "prodHearseLimousine", label: "고급리무진" },
        ],
      },
    ],
  },
  { id: "orders", label: "주문·정산", view: "orders", badgeId: "navOrderBadge" },
  { id: "board", label: "게시·문의", badgeId: "navInqBadge",
    items: [
      { view: "notices", label: "알림 소식" },
      { view: "funeralForms", label: "관련서식" },
      { view: "inquiries", label: "온라인 문의" },
      { view: "memorials", label: "추모글 관리" },
    ],
  },
];

function navFlatItems(sec) {
  if (sec.items) return sec.items;
  if (sec.groups) return sec.groups.flatMap((g) => g.items);
  if (sec.view) return [{ view: sec.view, label: sec.label }];
  return [];
}

function navSectionForView(viewKey) {
  for (const sec of NAV_MENU) {
    if (sec.view === viewKey) return sec;
    if (navFlatItems(sec).some((it) => it.view === viewKey)) return sec;
  }
  return NAV_MENU[0];
}

function navDefaultView(sec) {
  if (sec.view) return sec.view;
  const flat = navFlatItems(sec);
  return flat[0] ? flat[0].view : "dashboard";
}

function subNavLinkHtml(it, activeView) {
  const badge = it.badgeId ? `<span class="nav-badge" id="${it.badgeId}"></span>` : "";
  return `<a href="#${it.view}" class="${activeView === it.view ? "active" : ""}">${esc(it.label)}${badge}</a>`;
}

function renderSubNav(sec, activeView) {
  const subNav = document.getElementById("subNav");
  if (!sec || (sec.view && !sec.items && !sec.groups)) {
    subNav.hidden = true;
    subNav.innerHTML = "";
    return;
  }
  if (sec.groups) {
    subNav.innerHTML = sec.groups.map((g) => `
      <div class="sub-nav-group">
        <span class="sub-nav-label">${esc(g.label)}</span>
        ${g.items.map((it) => subNavLinkHtml(it, activeView)).join("")}
      </div>`).join("");
    subNav.hidden = false;
    return;
  }
  if (sec.items && sec.items.length > 0) {
    subNav.innerHTML = `<div class="sub-nav-group">${sec.items.map((it) => subNavLinkHtml(it, activeView)).join("")}</div>`;
    subNav.hidden = false;
    return;
  }
  subNav.hidden = true;
  subNav.innerHTML = "";
}

function syncNav(viewKey) {
  const sec = navSectionForView(viewKey);
  document.querySelectorAll(".main-nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-nav-id") === sec.id);
  });
  renderSubNav(sec, viewKey);
}

function initNav() {
  const mainNav = document.getElementById("mainNav");
  mainNav.innerHTML = NAV_MENU.map((sec) => {
    const badge = sec.badgeId ? `<span class="nav-badge" id="${sec.badgeId}"></span>` : "";
    return `<button type="button" class="main-nav-item" data-nav-id="${sec.id}">${esc(sec.label)}${badge}</button>`;
  }).join("");
  mainNav.querySelectorAll(".main-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sec = NAV_MENU.find((s) => s.id === btn.getAttribute("data-nav-id"));
      if (!sec) return;
      const target = navDefaultView(sec);
      if (location.hash !== "#" + target) location.hash = target;
      else syncNav(target);
    });
  });
}

function setNavBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  if (count > 0) {
    el.textContent = count;
    el.classList.add("show");
  } else {
    el.classList.remove("show");
  }
}

/* ---------- 라우터 ---------- */
const VIEWS = {
  dashboard: { title: "대시보드", render: renderDashboard },
  halls: { title: "빈소 목록", render: renderHalls },
  hallUsages: { title: "빈소 이용", render: renderHallUsages },
  hallRegister: { title: "빈소 이용 등록", render: renderHallRegister },
  families: { title: "상주 계정 관리", render: renderFamilies },
  hallRequests: { title: "빈소 신청", render: renderHallRequests },
  prodCoffin: { title: "관 관리", render: () => renderCoffins() },
  prodHoengdae: { title: "횡대 관리", render: () => renderHoengdae() },
  prodShroud: { title: "수의 관리", render: () => renderShrouds() },
  prodAccessory: { title: "부속물품 관리", render: () => renderAccessories() },
  prodFoodMeal: { title: "식사류 관리", render: () => renderFoodItems("meal") },
  prodFoodAnju: { title: "안주류 관리", render: () => renderFoodItems("anju") },
  prodFoodTteok: { title: "떡류 관리", render: () => renderFoodItems("tteok") },
  prodFoodFruit: { title: "과일류 관리", render: () => renderFoodItems("fruit") },
  prodFoodJesa: { title: "제사상 관리", render: () => renderFoodItems("jesa") },
  prodFoodBeverage: { title: "식음료류 관리", render: () => renderFoodItems("beverage") },
  prodFoodConsumables: { title: "공산품류 관리", render: () => renderFoodItems("consumables") },
  prodFlowerAltar: { title: "제단장식 관리", render: () => renderFlowerItems("altar") },
  prodFlowerBasket: { title: "근조바구니 관리", render: () => renderFlowerItems("basket") },
  prodFlowerWreath: { title: "조문용 조화 관리", render: () => renderFlowerItems("wreath") },
  prodFlowerChrys: { title: "헌화용 국화 관리", render: () => renderFlowerItems("chrysanthemum") },
  prodFlowerCoffin: { title: "관장식 관리", render: () => renderFlowerItems("coffin") },
  prodFlowerVehicle: { title: "차량장식 관리", render: () => renderFlowerItems("vehicle") },
  prodPhotoPortrait: { title: "영정 관리", render: () => renderPhotoItems("portrait") },
  prodPhotoFrame: { title: "액자 관리", render: () => renderPhotoItems("frame") },
  prodPhotoId: { title: "증명사진 관리", render: () => renderPhotoItems("idphoto") },
  prodPhotoInstant: { title: "즉석사진 관리", render: () => renderPhotoItems("instant") },
  prodDress: { title: "상복 대여 관리", render: renderDressItems },
  prodHearseCadillac: { title: "캐딜락 관리", render: () => renderHearseItems("cadillac") },
  prodHearseLimousine: { title: "고급리무진 관리", render: () => renderHearseItems("limousine") },
  orders: { title: "주문 관리", render: renderOrders },
  notices: { title: "알림 소식", render: renderNotices },
  funeralForms: { title: "관련서식 관리", render: renderFuneralForms },
  inquiries: { title: "온라인 문의", render: renderInquiries },
  memorials: { title: "추모글 관리", render: renderMemorials },
};
const content = document.getElementById("content");

function currentView() {
  const key = (location.hash || "#dashboard").slice(1);
  return VIEWS[key] ? key : "dashboard";
}
async function route() {
  const key = currentView();
  syncNav(key);
  document.getElementById("viewTitle").textContent = VIEWS[key].title;
  content.innerHTML = '<div class="empty">불러오는 중…</div>';
  try { await VIEWS[key].render(); }
  catch (e) { content.innerHTML = `<div class="empty">오류: ${esc(e.message)}</div>`; }
  refreshInquiryBadge();
  refreshOrderBadge();
  refreshHallReqBadge();
}
window.addEventListener("hashchange", route);

async function refreshInquiryBadge() {
  try {
    const d = await api("/inquiries/admin/all?status=pending");
    setNavBadge("navInqBadge", d.items.length);
  } catch (e) {}
}

async function refreshOrderBadge() {
  try {
    const d = await api("/orders/admin/all?status=pending");
    setNavBadge("navOrderBadge", d.items.length);
  } catch (e) {}
}

async function refreshHallReqBadge() {
  try {
    const d = await api("/hall-requests/admin/all?status=pending");
    setNavBadge("navHallReqBadge", d.items.length);
  } catch (e) {}
}

/* 금액 표시 */
function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }

const CAT_KEYS = [];
const PRODUCT_SPEC_FIELDS = {};
const SETTLEMENT_LABELS = { prepaid: "선결제", postpaid: "사후정산" };
const FOOD_CATEGORY_LABELS = {
  meal: "식사류", anju: "안주류", tteok: "떡류", fruit: "과일류",
  jesa: "제사상", beverage: "식음료류", consumables: "공산품류",
};
const FLOWER_CATEGORY_LABELS = {
  altar: "제단장식", basket: "근조바구니", wreath: "조문용 조화",
  chrysanthemum: "헌화용 국화", coffin: "관장식", vehicle: "차량장식",
};
const PHOTO_CATEGORY_LABELS = {
  portrait: "영정", frame: "액자", idphoto: "증명사진", instant: "즉석사진",
};
const DRESS_ITEM_NAMES = [
  "예복정장", "여성예복", "와이셔츠", "벨트", "양말", "구두", "넥타이", "런닝셔츠",
];
const DRESS_ITEM_UNITS = {
  예복정장: "1벌", 여성예복: "1벌", 와이셔츠: "1벌", 벨트: "1개",
  양말: "1켤레", 구두: "1켤레", 넥타이: "1개", 런닝셔츠: "1벌",
};
const HEARSE_CATEGORY_LABELS = {
  cadillac: "캐딜락", limousine: "고급리무진",
};

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/images", {
    method: "POST",
    credentials: "same-origin",
    headers: { "X-Session-Scope": "admin" },
    body: fd,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401) { location.href = ADMIN_LOGIN_URL; throw new Error("unauthorized"); }
  if (!res.ok) throw new Error((data && data.error) || "이미지 업로드에 실패했습니다.");
  return data.image;
}

async function uploadFormFile(formId, file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/forms/" + formId + "/file", {
    method: "POST",
    credentials: "same-origin",
    headers: { "X-Session-Scope": "admin" },
    body: fd,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401) { location.href = ADMIN_LOGIN_URL; throw new Error("unauthorized"); }
  if (!res.ok) throw new Error((data && data.error) || "파일 업로드에 실패했습니다.");
  return data.form;
}

/* ---------- 대시보드 ---------- */
async function renderDashboard() {
  const [usages, inquiries, memorials, families, orders] = await Promise.all([
    api("/hall-usages/admin/all?status=active"), api("/inquiries/admin/all"),
    api("/memorials/admin/all"), api("/users/admin/all"), api("/orders/admin/all"),
  ]);
  const inUse = usages.items.length;
  const pending = inquiries.items.filter((i) => i.status === "pending").length;
  const pendingOrders = orders.items.filter((o) => o.status === "pending").length;
  const recent = orders.items.slice(0, 6);

  content.innerHTML = `
    <div class="stats">
      <div class="stat"><div class="n">${inUse}</div><div class="l">사용 중 빈소</div></div>
      <div class="stat"><div class="n">${families.items.length}</div><div class="l">상주 계정</div></div>
      <div class="stat"><div class="n">${pendingOrders}</div><div class="l">접수 대기 주문</div></div>
      <div class="stat"><div class="n">${pending}</div><div class="l">미답변 문의</div></div>
      <div class="stat"><div class="n">${memorials.items.length}</div><div class="l">추모글</div></div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>최근 주문</h3><a class="btn btn-sm" href="#orders">전체 보기</a></div>
      <div class="panel-body" style="padding:0">
        ${recent.length === 0 ? '<div class="empty">주문이 없습니다.</div>' : `
        <table class="grid">
          <thead><tr><th>주문번호</th><th>상주</th><th class="right">합계</th><th>상태</th><th>주문일</th></tr></thead>
          <tbody>${recent.map((o) => `
            <tr><td class="nowrap">${esc(o.orderNumber)}</td><td>${o.family ? esc(o.family.name) : "-"}</td><td class="right nowrap">${won(o.totalAmount)}</td><td>${ORDER_STATUS[o.status] || o.status}</td><td class="nowrap">${fmtDay(o.createdAt)}</td></tr>
          `).join("")}</tbody>
        </table>`}
      </div>
    </div>`;
}

/* ---------- 빈소 목록(호실 마스터) ---------- */
async function renderHalls() {
  const d = await api("/halls/admin/all");
  content.innerHTML = `
    <p class="muted" style="margin:0 0 14px">101·102·103·109호 빈소와 규격(35·50·80평형, 무빈소)입니다. 상주는 호실을 선택해 이용 신청합니다.</p>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 빈소가 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>호실</th><th>규격</th><th>1일 단가</th><th>면적</th><th>수용 인원</th><th>특징</th><th>상태</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((h) => `
          <tr>
            <td><b>${esc(h.name)}</b>${h.isVirtual ? ' <span class="tag gray">무빈소</span>' : ""}</td>
            <td>${esc(h.specLabel) || "-"}</td>
            <td class="nowrap">${h.isVirtual ? "-" : won(h.dailyPrice || 0)}</td>
            <td>${esc(h.areaLabel) || "-"}</td>
            <td>${esc(h.capacity) || "-"}</td>
            <td>${esc(h.feature) || "-"}</td>
            <td>${h.active ? '<span class="tag free">신청 가능</span>' : '<span class="tag gray">중지</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(h))}'>수정</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => hallCatalogForm(JSON.parse(b.getAttribute("data-edit")))));
}

function hallCatalogForm(h) {
  openModal("빈소 수정", `
    <div class="field-row">
      <div class="field"><label>호실명</label><input id="f_name" value="${esc(h.name || "")}" /></div>
      <div class="field"><label>규격</label><input value="${esc(h.specLabel || "")}" disabled /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>신청 가능</label><select id="f_active"><option value="true" ${h.active ? "selected" : ""}>가능</option><option value="false" ${!h.active ? "selected" : ""}>중지</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>면적</label><input id="f_areaLabel" value="${esc(h.areaLabel || "")}" placeholder="예: 약 115㎡" /></div>
      <div class="field"><label>1일 단가(원)</label><input type="number" min="0" step="1000" id="f_dailyPrice" value="${h.isVirtual ? 0 : (h.dailyPrice || 0)}" ${h.isVirtual ? "disabled" : ""} /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>수용 인원</label><input id="f_capacity" value="${esc(h.capacity || "")}" placeholder="예: 50명 내외" /></div>
    </div>
    <div class="field"><label>특징</label><input id="f_feature" value="${esc(h.feature || "")}" /></div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        name: val("f_name"),
        areaLabel: val("f_areaLabel"),
        capacity: val("f_capacity"),
        dailyPrice: h.isVirtual ? 0 : Math.max(0, Math.round(Number(val("f_dailyPrice")) || 0)),
        feature: val("f_feature"),
        active: val("f_active") === "true",
      };
      if (!body.name) { toast("호실명을 입력하세요."); return; }
      try {
        await api("/halls/" + h.id, { method: "PATCH", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

/* ---------- 빈소 이용 ---------- */
let hallUsageFilter = "";
async function renderHallUsages() {
  const d = await api("/hall-usages/admin/all" + (hallUsageFilter ? "?status=" + hallUsageFilter : ""));
  const statusTag = (s) => {
    if (s === "active") return '<span class="tag use">이용중</span>';
    if (s === "completed") return '<span class="tag answered">발인완료</span>';
    return '<span class="tag gray">취소</span>';
  };
  content.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="addHallUsage">+ 빈소 이용 등록</button>
      <select id="hallUsageStatus">
        <option value="">전체 상태</option>
        <option value="active" ${hallUsageFilter === "active" ? "selected" : ""}>이용중</option>
        <option value="completed" ${hallUsageFilter === "completed" ? "selected" : ""}>발인완료</option>
        <option value="cancelled" ${hallUsageFilter === "cancelled" ? "selected" : ""}>취소</option>
      </select>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 빈소 이용이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>상태</th><th>빈소</th><th>기간·이용료</th><th>고인명</th><th>상주</th><th>발인</th><th>접근코드</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((u) => `
          <tr>
            <td>${statusTag(u.status)}</td>
            <td><b>${u.hall ? esc(u.hall.name) : "-"}</b>${u.hall && u.hall.specLabel ? `<br><small class="muted">${esc(u.hall.specLabel)}</small>` : ""}</td>
            <td class="nowrap">${u.funeralDays ? esc(u.funeralDays) + "일장" : "-"}${u.hallFeeAmount ? `<br>${won(u.hallFeeAmount)}` : ""}</td>
            <td>${esc(u.deceasedName) || "-"}</td>
            <td>${esc(u.chiefMourner) || (u.family ? esc(u.family.name) : "-")}</td>
            <td class="nowrap">${esc(u.funeralDate) || "-"} ${esc(u.funeralTime)}</td>
            <td class="nowrap">${u.familyCode ? `<code>${esc(u.familyCode)}</code>` : "-"}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(u))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${u.id}" data-name="${esc(u.hall ? u.hall.name : "빈소")}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("addHallUsage").addEventListener("click", () => hallUsageForm(null));
  document.getElementById("hallUsageStatus").addEventListener("change", (e) => { hallUsageFilter = e.target.value; renderHallUsages(); });
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => hallUsageForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("빈소 이용", b.getAttribute("data-name"), async () => {
      await api("/hall-usages/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

async function renderHallRegister() {
  await renderHallUsages();
  hallUsageForm(null);
}

async function hallUsageForm(u) {
  const e = u || {};
  const opt = (v, label, cur) => `<option value="${v}" ${cur === v ? "selected" : ""}>${label}</option>`;
  let catalogOptions = "";
  let familyOptions = '<option value="">(연결 안 함)</option>';
  try {
    const [catalog, families] = await Promise.all([
      api("/halls/admin/all"),
      api("/users/admin/all"),
    ]);
    catalogOptions = catalog.items.map((h) => {
      const label = esc(h.name) + (h.specLabel ? " · " + esc(h.specLabel) : "") + (h.feature ? " · " + esc(h.feature) : "");
      const sel = e.hall && e.hall.id === h.id ? "selected" : "";
      return `<option value="${h.id}" ${sel}>${label}</option>`;
    }).join("");
    familyOptions += families.items.map((f) => {
      const sel = e.family && e.family.id === f.id ? "selected" : "";
      return `<option value="${f.id}" ${sel}>${esc(f.name)} (${esc(f.username)})</option>`;
    }).join("");
  } catch (err) {}

  openModal(u ? "빈소 이용 수정" : "빈소 이용 등록", `
    <div class="field-row">
      <div class="field"><label>빈소 *</label><select id="f_hallId">${catalogOptions}</select></div>
      <div class="field"><label>상태</label><select id="f_status">${opt("active", "이용중", e.status || "active")}${opt("completed", "발인완료", e.status)}${opt("cancelled", "취소", e.status)}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>장례 기간</label><select id="f_funeralDays">
        <option value="3" ${Number(e.funeralDays || 3) === 3 ? "selected" : ""}>3일장</option>
        <option value="4" ${Number(e.funeralDays) === 4 ? "selected" : ""}>4일장</option>
        <option value="5" ${Number(e.funeralDays) === 5 ? "selected" : ""}>5일장</option>
      </select></div>
      <div class="field"><label>이용료(자동계산)</label><input id="f_hallFeePreview" value="${e.hallFeeAmount ? won(e.hallFeeAmount) : ""}" disabled /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>고인명</label><input id="f_deceasedName" value="${esc(e.deceasedName || "")}" /></div>
      <div class="field"><label>상주</label><input id="f_chiefMourner" value="${esc(e.chiefMourner || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>관계</label><input id="f_relationship" value="${esc(e.relationship || "")}" /></div>
      <div class="field"><label>향년</label><input id="f_age" value="${esc(e.age || "")}" placeholder="예: 향년 84세" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>발인 일자</label><input type="date" id="f_funeralDate" value="${esc(toDateInputValue(e.funeralDate))}" /></div>
      <div class="field"><label>발인 시각</label><input type="time" id="f_funeralTime" value="${esc(toTimeInputValue(e.funeralTime))}" step="60" /></div>
    </div>
    <div class="field"><label>장지</label><input id="f_burialSite" value="${esc(e.burialSite || "")}" /></div>
    <div class="field"><label>연결 상주 계정</label><select id="f_familyUserId">${familyOptions}</select></div>
    ${u && u.familyCode ? `<p class="muted">상주 접근코드: <code>${esc(u.familyCode)}</code></p>` : ""}
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        hallId: val("f_hallId"),
        status: val("f_status"),
        deceasedName: val("f_deceasedName"),
        chiefMourner: val("f_chiefMourner"),
        relationship: val("f_relationship"),
        age: val("f_age"),
        funeralDate: val("f_funeralDate"),
        funeralTime: val("f_funeralTime"),
        burialSite: val("f_burialSite"),
        funeralDays: Number(val("f_funeralDays")) || 3,
        familyUserId: val("f_familyUserId") || null,
      };
      if (!body.hallId) { toast("빈소를 선택하세요."); return; }
      try {
        if (u) await api("/hall-usages/" + u.id, { method: "PATCH", body });
        else await api("/hall-usages", { method: "POST", body });
        closeModal(); toast("저장되었습니다.");
        if (!u && currentView() === "hallRegister") location.hash = "hallUsages";
        else route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

/* ---------- 알림 소식 ---------- */
async function renderNotices() {
  const d = await api("/notices/admin/all");
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addNotice">+ 알림소식 등록</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 알림소식이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>제목</th><th>분류</th><th>고정</th><th>공개</th><th>조회</th><th>작성일</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((n) => `
          <tr>
            <td><b>${esc(n.title)}</b></td>
            <td>${esc(n.category)}</td>
            <td>${n.pinned ? '<span class="tag gray">고정</span>' : "-"}</td>
            <td>${n.published ? '<span class="tag free">공개</span>' : '<span class="tag gray">비공개</span>'}</td>
            <td>${n.views}</td>
            <td class="nowrap">${fmtDay(n.createdAt)}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(n))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${n.id}" data-name="${esc(n.title)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("addNotice").addEventListener("click", () => noticeForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => noticeForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("알림소식", b.getAttribute("data-name"), async () => {
      await api("/notices/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function noticeForm(n) {
  const e = n || {};
  openModal(n ? "알림소식 수정" : "알림소식 등록", `
    <div class="field-row">
      <div class="field"><label>제목 *</label><input id="f_title" value="${esc(e.title || "")}" /></div>
      <div class="field"><label>분류</label><input id="f_category" value="${esc(e.category || "공지")}" /></div>
    </div>
    <div class="field"><label>내용 *</label><textarea id="f_content">${esc(e.content || "")}</textarea></div>
    <div class="field-row">
      <div class="field"><label class="check"><input type="checkbox" id="f_pinned" ${e.pinned ? "checked" : ""}/> 상단 고정</label></div>
      <div class="field"><label class="check"><input type="checkbox" id="f_published" ${e.published === false ? "" : "checked"}/> 공개</label></div>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = { title: val("f_title"), category: val("f_category"), content: val("f_content"), pinned: checked("f_pinned"), published: checked("f_published") };
      if (!body.title || !body.content) { toast("제목과 내용을 입력하세요."); return; }
      try {
        if (n) await api("/notices/" + n.id, { method: "PATCH", body });
        else await api("/notices", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

/* ---------- 관련서식 ---------- */
async function renderFuneralForms() {
  const d = await api("/forms/admin/all");
  content.innerHTML = `
    <p class="orders-lead">관련서식 파일(PDF·HWP·DOC·XLS·ZIP, 최대 15MB)은 MongoDB에 저장됩니다. 등록 후 상주 장례 예약·홈페이지 서식 자료실에서 다운로드할 수 있습니다.</p>
    <div class="toolbar"><button class="btn btn-primary" id="addForm">+ 서식 등록</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 서식이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>순서</th><th>서식명</th><th>파일</th><th>공개</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((f) => `
          <tr>
            <td>${f.sortOrder}</td>
            <td><b>${esc(f.name)}</b>${f.description ? `<br><small class="muted">${esc(f.description)}</small>` : ""}</td>
            <td class="nowrap">${f.hasFile
              ? `<a href="${esc(f.downloadUrl)}" target="_blank" rel="noopener">${esc(f.filename || "다운로드")}</a>`
              : '<span class="tag pending">미등록</span>'}</td>
            <td>${f.active ? '<span class="tag free">공개</span>' : '<span class="tag gray">비공개</span>'}</td>
            <td class="actions right">
              <button class="btn btn-sm btn-primary" data-upload="${esc(f.id)}">파일</button>
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(f))}'>수정</button>
              ${f.hasFile ? `<button class="btn btn-sm" data-rmfile="${esc(f.id)}">파일삭제</button>` : ""}
              <button class="btn btn-sm btn-danger" data-del="${esc(f.id)}" data-name="${esc(f.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("addForm").addEventListener("click", () => funeralFormModal(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => funeralFormModal(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-upload]").forEach((b) =>
    b.addEventListener("click", () => funeralFormUploadOnly(b.getAttribute("data-upload"))));
  content.querySelectorAll("[data-rmfile]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("서식 파일", "첨부 파일", async () => {
      await api("/forms/" + b.getAttribute("data-rmfile") + "/file", { method: "DELETE" });
      toast("파일이 삭제되었습니다."); route();
    })));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("관련서식", b.getAttribute("data-name"), async () => {
      await api("/forms/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function funeralFormUploadOnly(formId) {
  openModal("서식 파일 업로드", `
    <div class="field">
      <label>파일 *</label>
      <input type="file" id="f_formfile" accept=".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.zip" />
      <p class="muted" style="margin:8px 0 0;font-size:12px">PDF·HWP·DOC·XLS·ZIP (최대 15MB)</p>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "업로드", cls: "btn-primary", onClick: async () => {
      const fileEl = document.getElementById("f_formfile");
      if (!fileEl || !fileEl.files || !fileEl.files[0]) { toast("파일을 선택해 주세요."); return; }
      try {
        await uploadFormFile(formId, fileEl.files[0]);
        closeModal(); toast("파일이 등록되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

function funeralFormModal(f) {
  const e = f || {};
  openModal(f ? "관련서식 수정" : "관련서식 등록", `
    <div class="field-row">
      <div class="field"><label>서식명 *</label><input id="f_name" value="${esc(e.name || "")}" /></div>
      <div class="field" style="max-width:120px"><label>표시 순서</label><input type="number" id="f_sort" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><input id="f_desc" value="${esc(e.description || "")}" placeholder="용도 안내 (선택)" /></div>
    <div class="field"><label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 공개 (다운로드 허용)</label></div>
    ${f ? "" : `
    <div class="field">
      <label>파일 (선택)</label>
      <input type="file" id="f_formfile" accept=".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.zip" />
    </div>`}
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        name: val("f_name"),
        description: val("f_desc"),
        sortOrder: Number(val("f_sort")) || 0,
        active: checked("f_active"),
      };
      if (!body.name) { toast("서식명을 입력해 주세요."); return; }
      try {
        let saved;
        if (f) saved = (await api("/forms/" + f.id, { method: "PATCH", body })).form;
        else saved = (await api("/forms", { method: "POST", body })).form;
        const fileEl = document.getElementById("f_formfile");
        if (fileEl && fileEl.files && fileEl.files[0]) {
          await uploadFormFile(saved.id, fileEl.files[0]);
        }
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

/* ---------- 온라인 문의 ---------- */
let inqFilter = "";
async function renderInquiries() {
  const d = await api("/inquiries/admin/all" + (inqFilter ? "?status=" + inqFilter : ""));
  const statusTag = (s) => s === "pending" ? '<span class="tag pending">대기</span>' : s === "answered" ? '<span class="tag answered">답변완료</span>' : '<span class="tag gray">종료</span>';
  content.innerHTML = `
    <div class="toolbar">
      <select id="inqStatus">
        <option value="">전체 상태</option>
        <option value="pending" ${inqFilter === "pending" ? "selected" : ""}>대기</option>
        <option value="answered" ${inqFilter === "answered" ? "selected" : ""}>답변완료</option>
        <option value="closed" ${inqFilter === "closed" ? "selected" : ""}>종료</option>
      </select>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">문의가 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>상태</th><th>분류</th><th>제목</th><th>작성자</th><th>연락처</th><th>접수일</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((i) => `
          <tr>
            <td>${statusTag(i.status)}</td>
            <td>${esc(i.category)} ${i.isPrivate ? '🔒' : ''}</td>
            <td>${esc(i.title)}</td>
            <td>${esc(i.name)}</td>
            <td class="nowrap">${esc(i.phone) || "-"}</td>
            <td class="nowrap">${fmtDay(i.createdAt)}</td>
            <td class="actions">
              <button class="btn btn-sm btn-primary" data-view='${esc(JSON.stringify(i))}'>보기·답변</button>
              <button class="btn btn-sm btn-danger" data-del="${i.id}" data-name="${esc(i.title)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("inqStatus").addEventListener("change", (e) => { inqFilter = e.target.value; renderInquiries(); });
  content.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => inquiryDetail(JSON.parse(b.getAttribute("data-view")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("문의", b.getAttribute("data-name"), async () => {
      await api("/inquiries/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); renderInquiries();
    })));
}

function inquiryDetail(i) {
  openModal("문의 상세", `
    <div class="detail-row"><b>작성자</b><span>${esc(i.name)} / ${esc(i.phone) || "-"} / ${esc(i.email) || "-"}</span></div>
    <div class="detail-row"><b>분류</b><span>${esc(i.category)} ${i.isPrivate ? "(비공개)" : ""}</span></div>
    <div class="detail-row"><b>제목</b><span>${esc(i.title)}</span></div>
    <div class="detail-row"><b>접수일</b><span>${fmt(i.createdAt)}</span></div>
    <div class="field" style="margin-top:14px"><label>문의 내용</label>
      <div style="white-space:pre-wrap;background:#fafbfc;border:1px solid var(--line);border-radius:8px;padding:12px">${esc(i.message)}</div>
    </div>
    <div class="field"><label>답변</label><textarea id="f_answer">${esc(i.answer || "")}</textarea></div>
    <div class="field"><label>상태</label>
      <select id="f_status">
        <option value="pending" ${i.status === "pending" ? "selected" : ""}>대기</option>
        <option value="answered" ${i.status === "answered" ? "selected" : ""}>답변완료</option>
        <option value="closed" ${i.status === "closed" ? "selected" : ""}>종료</option>
      </select>
    </div>
  `, [
    { label: "닫기", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      try {
        await api("/inquiries/" + i.id, { method: "PATCH", body: { answer: val("f_answer"), status: val("f_status") } });
        closeModal(); toast("저장되었습니다."); renderInquiries();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

/* ---------- 추모글 관리 ---------- */
async function renderMemorials() {
  const d = await api("/memorials/admin/all");
  content.innerHTML = `
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 추모글이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>빈소</th><th>작성자</th><th>관계</th><th>내용</th><th>상태</th><th>작성일</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((m) => `
          <tr>
            <td class="nowrap">${m.hall ? esc(m.hall.hallNumber) + (m.hall.deceasedName ? " / " + esc(m.hall.deceasedName) : "") : "-"}</td>
            <td>${esc(m.author)}</td>
            <td>${esc(m.relation) || "-"}</td>
            <td>${esc((m.message || "").slice(0, 40))}${(m.message || "").length > 40 ? "…" : ""}</td>
            <td>${m.hidden ? '<span class="tag gray">숨김</span>' : '<span class="tag free">표시</span>'}</td>
            <td class="nowrap">${fmtDay(m.createdAt)}</td>
            <td class="actions">
              <button class="btn btn-sm" data-hide="${m.id}" data-cur="${m.hidden ? 1 : 0}">${m.hidden ? "표시" : "숨김"}</button>
              <button class="btn btn-sm btn-danger" data-del="${m.id}" data-name="${esc(m.author)}님 추모글">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  content.querySelectorAll("[data-hide]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api("/memorials/" + b.getAttribute("data-hide"), { method: "PATCH", body: { hidden: b.getAttribute("data-cur") !== "1" } });
      toast("변경되었습니다."); renderMemorials();
    }));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("추모글", b.getAttribute("data-name"), async () => {
      await api("/memorials/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); renderMemorials();
    })));
}

/* ---------- 상주 계정 관리 ---------- */
async function renderFamilies() {
  const d = await api("/users/admin/all");
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addFam">+ 상주 계정 발급</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">발급된 상주 계정이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>아이디</th><th>이름</th><th>연락처</th><th>연결 빈소</th><th>상태</th><th>최근 로그인</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((u) => `
          <tr>
            <td><b>${esc(u.username)}</b></td>
            <td>${esc(u.name)}</td>
            <td class="nowrap">${esc(u.phone) || "-"}</td>
            <td class="nowrap">${u.hall ? esc(u.hall.hallNumber) + (u.hall.deceasedName ? " / " + esc(u.hall.deceasedName) : "") : "-"}</td>
            <td>${u.active ? '<span class="tag free">사용</span>' : '<span class="tag gray">정지</span>'}</td>
            <td class="nowrap">${fmtDay(u.lastLoginAt)}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(u))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${u.id}" data-name="${esc(u.username)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("addFam").addEventListener("click", () => familyForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => familyForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("상주 계정", b.getAttribute("data-name"), async () => {
      await api("/users/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

async function familyForm(u) {
  const e = u || {};
  // 빈소 선택지
  let hallOptions = '<option value="">(연결 안 함)</option>';
  try {
    const hd = await api("/hall-usages/admin/active-options");
    hallOptions += hd.items.map((h) => {
      const label = esc(h.hallNumber) + (h.deceasedName ? " / " + esc(h.deceasedName) : "") + (h.chiefMourner ? " · " + esc(h.chiefMourner) : "");
      const sel = e.hall && e.hall.id === h.id ? "selected" : "";
      return `<option value="${h.id}" ${sel}>${label}</option>`;
    }).join("");
  } catch (err) {}

  openModal(u ? "상주 계정 수정" : "상주 계정 발급", `
    <div class="field-row">
      <div class="field"><label>아이디 *</label><input id="f_username" value="${esc(e.username || "")}" ${u ? "disabled" : ""} placeholder="영문/숫자" /></div>
      <div class="field"><label>이름 *</label><input id="f_name" value="${esc(e.name || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>연락처</label><input id="f_phone" value="${esc(e.phone || "")}" placeholder="010-0000-0000" /></div>
      <div class="field"><label>연결 빈소 이용</label><select id="f_hall">${hallOptions}</select></div>
    </div>
    <div class="field"><label>${u ? "비밀번호 재설정 (미입력 시 유지)" : "비밀번호 *"}</label><input id="f_password" type="text" placeholder="${u ? "변경할 때만 입력" : "초기 비밀번호"}" /></div>
    ${u ? `<div class="field"><label class="check"><input type="checkbox" id="f_active" ${e.active ? "checked" : ""}/> 계정 사용(활성)</label></div>` : ""}
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const hallUsageId = val("f_hall");
      if (u) {
        const body = { name: val("f_name"), phone: val("f_phone"), hallUsageId: hallUsageId || null, active: checked("f_active") };
        const pw = val("f_password"); if (pw) body.password = pw;
        if (!body.name) { toast("이름을 입력하세요."); return; }
        try { await api("/users/" + u.id, { method: "PATCH", body }); closeModal(); toast("저장되었습니다."); route(); }
        catch (err) { toast(err.message); }
      } else {
        const body = { username: val("f_username"), name: val("f_name"), phone: val("f_phone"), password: val("f_password"), hallUsageId: hallUsageId || null };
        if (!body.username || !body.name || !body.password) { toast("아이디·이름·비밀번호를 입력하세요."); return; }
        try { await api("/users", { method: "POST", body }); closeModal(); toast("상주 계정이 발급되었습니다."); route(); }
        catch (err) { toast(err.message); }
      }
    } },
  ]);
}

/* ---------- 빈소 신청 관리 ---------- */
let hallReqFilter = "";
async function renderHallRequests() {
  const d = await api("/hall-requests/admin/all" + (hallReqFilter ? "?status=" + hallReqFilter : ""));
  const statusTag = (s) => {
    if (s === "pending") return '<span class="tag pending">대기</span>';
    if (s === "approved") return '<span class="tag answered">승인</span>';
    return '<span class="tag gray">거절</span>';
  };
  content.innerHTML = `
    <div class="toolbar">
      <select id="hallReqStatus">
        <option value="">전체 상태</option>
        <option value="pending" ${hallReqFilter === "pending" ? "selected" : ""}>대기</option>
        <option value="approved" ${hallReqFilter === "approved" ? "selected" : ""}>승인</option>
        <option value="rejected" ${hallReqFilter === "rejected" ? "selected" : ""}>거절</option>
      </select>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">빈소 신청이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>상태</th><th>상주</th><th>신청 빈소</th><th>기간·이용료</th><th>고인</th><th>발인</th><th>신청일</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((r) => `
          <tr>
            <td>${statusTag(r.status)}</td>
            <td>${r.family ? esc(r.family.name) + " (" + esc(r.family.username) + ")" : "-"}</td>
            <td class="nowrap">${r.hall ? `<b>${esc(r.hall.name)}</b>${r.hall.specLabel ? " · " + esc(r.hall.specLabel) : ""}` : "-"}</td>
            <td class="nowrap">${r.funeralDays ? esc(r.funeralDays) + "일장" : "-"}${r.hallFeeAmount ? `<br>${won(r.hallFeeAmount)}` : ""}</td>
            <td>${esc(r.deceasedName) || "-"}</td>
            <td class="nowrap">${esc(r.funeralDate) || "-"} ${esc(r.funeralTime)}</td>
            <td class="nowrap">${fmtDay(r.createdAt)}</td>
            <td class="actions">
              ${r.status === "pending" ? `
                <button class="btn btn-sm btn-primary" data-approve="${r.id}">승인</button>
                <button class="btn btn-sm btn-danger" data-reject="${r.id}">거절</button>
              ` : `<span class="muted">${esc(r.note) || "-"}</span>`}
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("hallReqStatus").addEventListener("change", (e) => { hallReqFilter = e.target.value; renderHallRequests(); });
  content.querySelectorAll("[data-approve]").forEach((b) =>
    b.addEventListener("click", () => decideHallRequest(b.getAttribute("data-approve"), "approved")));
  content.querySelectorAll("[data-reject]").forEach((b) =>
    b.addEventListener("click", () => decideHallRequest(b.getAttribute("data-reject"), "rejected")));
}

async function decideHallRequest(id, status) {
  const note = prompt(status === "approved" ? "승인 메모 (선택)" : "거절 사유 (선택)", "") || "";
  try {
    await api("/hall-requests/" + id, { method: "PATCH", body: { status, note } });
    toast(status === "approved" ? "빈소 신청을 승인했습니다." : "빈소 신청을 거절했습니다.");
    renderHallRequests();
    refreshHallReqBadge();
  } catch (err) { toast(err.message); }
}

/* ---------- 상품 관리 ---------- */
async function renderCoffins() {
  const d = await api("/coffins/admin/all");
  content.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="addCoffin">+ 관 등록</button>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 관이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>품명</th><th>어깨</th><th>높이</th><th>길이</th><th>두께</th><th>원산지</th><th class="right">가격</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((c) => `
          <tr>
            <td><b>${esc(c.name)}</b>${c.imageUrl ? `<br><img src="${esc(c.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            <td class="nowrap">${esc(c.shoulder || "-")}</td>
            <td class="nowrap">${c.height != null ? c.height : "-"}</td>
            <td class="nowrap">${c.length != null ? c.length : "-"}</td>
            <td class="nowrap">${esc(c.thickness || "-")}</td>
            <td class="nowrap">${esc(c.origin || "-")}</td>
            <td class="right nowrap">${won(c.price)} / ${esc(c.unit)}</td>
            <td>${c.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(c))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${c.id}" data-name="${esc(c.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addCoffin").addEventListener("click", () => coffinForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => coffinForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("관", b.getAttribute("data-name"), async () => {
      await api("/coffins/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function coffinForm(c) {
  const e = c || {};
  openModal(c ? "관 수정" : "관 등록", `
    <div class="field-row">
      <div class="field"><label>품명 *</label><input id="f_name" value="${esc(e.name || "")}" /></div>
      <div class="field"><label>원산지</label><input id="f_origin" value="${esc(e.origin || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>어깨(㎜)</label><input id="f_shoulder" value="${esc(e.shoulder || "")}" placeholder="490 또는 1,500미만" /></div>
      <div class="field"><label>높이(㎜)</label><input id="f_height" type="number" value="${e.height != null ? e.height : ""}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>길이(㎜)</label><input id="f_length" type="number" value="${e.length != null ? e.length : ""}" /></div>
      <div class="field"><label>두께(㎜)</label><input id="f_thickness" value="${esc(e.thickness || "")}" placeholder="28 또는 25/17" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || "개")}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field-row">
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
      <div class="field" style="display:flex;gap:18px;align-items:flex-end">
        <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
        <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
      </div>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        name: val("f_name"), origin: val("f_origin"), shoulder: val("f_shoulder"),
        height: val("f_height") ? Number(val("f_height")) : null,
        length: val("f_length") ? Number(val("f_length")) : null,
        thickness: val("f_thickness"),
        price: Number(val("f_price")) || 0, unit: val("f_unit") || "개",
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("품명을 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (c && c.imageId) body.imageId = c.imageId;
      try {
        if (c) await api("/coffins/" + c.id, { method: "PATCH", body });
        else await api("/coffins", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

async function renderHoengdae() {
  const d = await api("/hoengdae/admin/all");
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addHoengdae">+ 횡대 등록</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 횡대가 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>품명</th><th>세로</th><th>가로</th><th>두께</th><th>원산지</th><th class="right">가격</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((h) => `
          <tr>
            <td><b>${esc(h.name)}</b>${h.imageUrl ? `<br><img src="${esc(h.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            <td class="nowrap">${h.vertical != null ? h.vertical : "-"}</td>
            <td class="nowrap">${h.horizontal != null ? h.horizontal : "-"}</td>
            <td class="nowrap">${h.thickness != null ? h.thickness : "-"}</td>
            <td class="nowrap">${esc(h.origin || "-")}</td>
            <td class="right nowrap">${won(h.price)} / ${esc(h.unit)}</td>
            <td>${h.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(h))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${h.id}" data-name="${esc(h.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addHoengdae").addEventListener("click", () => hoengdaeForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => hoengdaeForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("횡대", b.getAttribute("data-name"), async () => {
      await api("/hoengdae/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function hoengdaeForm(h) {
  const e = h || {};
  openModal(h ? "횡대 수정" : "횡대 등록", `
    <div class="field-row">
      <div class="field"><label>품명 *</label><input id="f_name" value="${esc(e.name || "")}" /></div>
      <div class="field"><label>원산지</label><input id="f_origin" value="${esc(e.origin || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>세로(㎜)</label><input id="f_vertical" type="number" value="${e.vertical != null ? e.vertical : ""}" /></div>
      <div class="field"><label>가로(㎜)</label><input id="f_horizontal" type="number" value="${e.horizontal != null ? e.horizontal : ""}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>두께(㎜)</label><input id="f_thickness" type="number" value="${e.thickness != null ? e.thickness : ""}" /></div>
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || "개")}" /></div>
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field" style="display:flex;gap:18px">
      <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
      <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        name: val("f_name"), origin: val("f_origin"),
        vertical: val("f_vertical") ? Number(val("f_vertical")) : null,
        horizontal: val("f_horizontal") ? Number(val("f_horizontal")) : null,
        thickness: val("f_thickness") ? Number(val("f_thickness")) : null,
        price: Number(val("f_price")) || 0, unit: val("f_unit") || "개",
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("품명을 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (h && h.imageId) body.imageId = h.imageId;
      try {
        if (h) await api("/hoengdae/" + h.id, { method: "PATCH", body });
        else await api("/hoengdae", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

async function renderShrouds() {
  const d = await api("/shrouds/admin/all");
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addShroud">+ 수의 등록</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 수의가 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>상품명</th><th>재질구성</th><th>직조</th><th>원사 생산국</th><th>원단 생산지</th><th class="right">가격</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((s) => `
          <tr>
            <td><b>${esc(s.name)}</b>${s.imageUrl ? `<br><img src="${esc(s.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            <td>${esc(s.material || "-")}</td>
            <td class="nowrap">${esc(s.weaveType || "-")}</td>
            <td class="nowrap">${esc(s.yarnOrigin || "-")}</td>
            <td>${esc(s.fabricOrigin || "-")}</td>
            <td class="right nowrap">${won(s.price)} / ${esc(s.unit)}</td>
            <td>${s.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(s))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${s.id}" data-name="${esc(s.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addShroud").addEventListener("click", () => shroudForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => shroudForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("수의", b.getAttribute("data-name"), async () => {
      await api("/shrouds/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function shroudForm(s) {
  const e = s || {};
  openModal(s ? "수의 수정" : "수의 등록", `
    <div class="field-row">
      <div class="field"><label>상품명 *</label><input id="f_name" value="${esc(e.name || "")}" /></div>
      <div class="field"><label>재질구성</label><input id="f_material" value="${esc(e.material || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>직조</label><input id="f_weaveType" value="${esc(e.weaveType || "")}" placeholder="기계직 / 수제직 / 반수공" /></div>
      <div class="field"><label>원사 생산국</label><input id="f_yarnOrigin" value="${esc(e.yarnOrigin || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>원단 생산지</label><input id="f_fabricOrigin" value="${esc(e.fabricOrigin || "")}" /></div>
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || "벌")}" /></div>
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field" style="display:flex;gap:18px">
      <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
      <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        name: val("f_name"), material: val("f_material"), weaveType: val("f_weaveType"),
        yarnOrigin: val("f_yarnOrigin"), fabricOrigin: val("f_fabricOrigin"),
        price: Number(val("f_price")) || 0, unit: val("f_unit") || "벌",
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("상품명을 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (s && s.imageId) body.imageId = s.imageId;
      try {
        if (s) await api("/shrouds/" + s.id, { method: "PATCH", body });
        else await api("/shrouds", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

async function renderAccessories() {
  const d = await api("/accessories/admin/all");
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addAccessory">+ 부속물품 등록</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 부속물품이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>품명</th><th>규격</th><th class="right">가격</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((a) => `
          <tr>
            <td><b>${esc(a.name)}</b>${a.imageUrl ? `<br><img src="${esc(a.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            <td>${esc(a.spec || "-")}</td>
            <td class="right nowrap">${won(a.price)} / ${esc(a.unit)}</td>
            <td>${a.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(a))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${a.id}" data-name="${esc(a.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addAccessory").addEventListener("click", () => accessoryForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => accessoryForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("부속물품", b.getAttribute("data-name"), async () => {
      await api("/accessories/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function accessoryForm(a) {
  const e = a || {};
  openModal(a ? "부속물품 수정" : "부속물품 등록", `
    <div class="field-row">
      <div class="field"><label>품명 *</label><input id="f_name" value="${esc(e.name || "")}" /></div>
      <div class="field"><label>규격</label><input id="f_spec" value="${esc(e.spec || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || "개")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field" style="display:flex;gap:18px">
      <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
      <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        name: val("f_name"), spec: val("f_spec"),
        price: Number(val("f_price")) || 0, unit: val("f_unit") || "개",
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("품명을 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (a && a.imageId) body.imageId = a.imageId;
      try {
        if (a) await api("/accessories/" + a.id, { method: "PATCH", body });
        else await api("/accessories", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

async function renderFoodItems(foodCategory) {
  const label = FOOD_CATEGORY_LABELS[foodCategory] || foodCategory;
  const d = await api("/food-items/admin/all?foodCategory=" + encodeURIComponent(foodCategory));
  const showSubGroup = foodCategory === "meal" || foodCategory === "anju";
  const showPostpaid = foodCategory === "beverage" || foodCategory === "consumables";
  content.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="addFood">+ ${esc(label)} 등록</button>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 품목이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>품명</th>${showSubGroup ? "<th>구분</th>" : ""}<th class="right">가격</th>${showPostpaid ? "<th>정산</th>" : ""}<th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((f) => `
          <tr>
            <td><b>${esc(f.name)}</b>${f.imageUrl ? `<br><img src="${esc(f.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            ${showSubGroup ? `<td class="nowrap">${esc(f.subGroup || "-")}</td>` : ""}
            <td class="right nowrap">${won(f.price)} / ${esc(f.unit)}</td>
            ${showPostpaid ? `<td>${SETTLEMENT_LABELS[f.settlementType] || f.settlementType}</td>` : ""}
            <td>${f.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(f))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${f.id}" data-name="${esc(f.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addFood").addEventListener("click", () => foodItemForm(null, foodCategory));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => foodItemForm(JSON.parse(b.getAttribute("data-edit")), foodCategory)));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete(label, b.getAttribute("data-name"), async () => {
      await api("/food-items/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function foodItemForm(f, foodCategory) {
  const e = f || {};
  const cat = foodCategory || e.foodCategory || "meal";
  const label = FOOD_CATEGORY_LABELS[cat] || cat;
  const isPostpaid = cat === "beverage" || cat === "consumables";
  const settleOpts = Object.keys(SETTLEMENT_LABELS).map((k) =>
    `<option value="${k}" ${(e.settlementType || (isPostpaid ? "postpaid" : "prepaid")) === k ? "selected" : ""}>${SETTLEMENT_LABELS[k]}</option>`).join("");
  openModal(f ? label + " 수정" : label + " 등록", `
    <input type="hidden" id="f_foodCategory" value="${esc(cat)}" />
    <div class="field-row">
      <div class="field"><label>품명 *</label><input id="f_name" value="${esc(e.name || "")}" placeholder="예: 육개장(8kg/30인분)" /></div>
      <div class="field"><label>구분</label><input id="f_subGroup" value="${esc(e.subGroup || "")}" placeholder="식사류/반찬류 등" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || (isPostpaid ? "개" : "식"))}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>정산 방식</label><select id="f_settlementType">${settleOpts}</select></div>
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field" style="display:flex;gap:18px">
      <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
      <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        foodCategory: val("f_foodCategory"), name: val("f_name"), subGroup: val("f_subGroup"),
        price: Number(val("f_price")) || 0, unit: val("f_unit") || "개",
        settlementType: val("f_settlementType"),
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("품명을 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (f && f.imageId) body.imageId = f.imageId;
      try {
        if (f) await api("/food-items/" + f.id, { method: "PATCH", body });
        else await api("/food-items", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

async function renderFlowerItems(flowerCategory) {
  const label = FLOWER_CATEGORY_LABELS[flowerCategory] || flowerCategory;
  const d = await api("/flower-items/admin/all?flowerCategory=" + encodeURIComponent(flowerCategory));
  content.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="addFlower">+ ${esc(label)} 등록</button>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 품목이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>품명</th><th>규격</th><th class="right">가격</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((f) => `
          <tr>
            <td><b>${esc(f.name)}</b>${f.imageUrl ? `<br><img src="${esc(f.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            <td class="nowrap">${esc(f.spec || "-")}</td>
            <td class="right nowrap">${won(f.price)} / ${esc(f.unit)}</td>
            <td>${f.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(f))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${f.id}" data-name="${esc(f.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addFlower").addEventListener("click", () => flowerItemForm(null, flowerCategory));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => flowerItemForm(JSON.parse(b.getAttribute("data-edit")), flowerCategory)));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete(label, b.getAttribute("data-name"), async () => {
      await api("/flower-items/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function flowerItemForm(f, flowerCategory) {
  const e = f || {};
  const cat = flowerCategory || e.flowerCategory || "altar";
  const label = FLOWER_CATEGORY_LABELS[cat] || cat;
  openModal(f ? label + " 수정" : label + " 등록", `
    <input type="hidden" id="f_flowerCategory" value="${esc(cat)}" />
    <div class="field-row">
      <div class="field"><label>품명 *</label><input id="f_name" value="${esc(e.name || "")}" placeholder="예: 5호" /></div>
      <div class="field"><label>규격</label><input id="f_spec" value="${esc(e.spec || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || "개")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field" style="display:flex;gap:18px">
      <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
      <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        flowerCategory: val("f_flowerCategory"), name: val("f_name"), spec: val("f_spec"),
        price: Number(val("f_price")) || 0, unit: val("f_unit") || "개",
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("품명을 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (f && f.imageId) body.imageId = f.imageId;
      try {
        if (f) await api("/flower-items/" + f.id, { method: "PATCH", body });
        else await api("/flower-items", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

async function renderPhotoItems(photoCategory) {
  const label = PHOTO_CATEGORY_LABELS[photoCategory] || photoCategory;
  const d = await api("/photo-items/admin/all?photoCategory=" + encodeURIComponent(photoCategory));
  const showSubGroup = photoCategory === "portrait" || photoCategory === "frame";
  content.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="addPhoto">+ ${esc(label)} 등록</button>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 품목이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>품명</th>${showSubGroup ? "<th>구분</th>" : ""}<th>규격</th><th class="right">가격</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((p) => `
          <tr>
            <td><b>${esc(p.name)}</b>${p.imageUrl ? `<br><img src="${esc(p.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            ${showSubGroup ? `<td class="nowrap">${esc(p.subGroup || "-")}</td>` : ""}
            <td class="nowrap">${esc(p.spec || p.name)}</td>
            <td class="right nowrap">${won(p.price)} / ${esc(p.unit)}</td>
            <td>${p.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(p))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${p.id}" data-name="${esc(p.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addPhoto").addEventListener("click", () => photoItemForm(null, photoCategory));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => photoItemForm(JSON.parse(b.getAttribute("data-edit")), photoCategory)));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete(label, b.getAttribute("data-name"), async () => {
      await api("/photo-items/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function photoItemForm(p, photoCategory) {
  const e = p || {};
  const cat = photoCategory || e.photoCategory || "portrait";
  const label = PHOTO_CATEGORY_LABELS[cat] || cat;
  openModal(p ? label + " 수정" : label + " 등록", `
    <input type="hidden" id="f_photoCategory" value="${esc(cat)}" />
    <div class="field-row">
      <div class="field"><label>품명 *</label><input id="f_name" value="${esc(e.name || "")}" placeholder="예: 8×10" /></div>
      <div class="field"><label>구분</label><input id="f_subGroup" value="${esc(e.subGroup || "")}" placeholder="칼라/액자, 원목액자 등" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>규격</label><input id="f_spec" value="${esc(e.spec || "")}" placeholder="3×4cm 등" /></div>
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || "개")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field" style="display:flex;gap:18px">
      <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
      <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        photoCategory: val("f_photoCategory"), name: val("f_name"), subGroup: val("f_subGroup"),
        spec: val("f_spec"), price: Number(val("f_price")) || 0, unit: val("f_unit") || "개",
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("품명을 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (p && p.imageId) body.imageId = p.imageId;
      try {
        if (p) await api("/photo-items/" + p.id, { method: "PATCH", body });
        else await api("/photo-items", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

async function renderDressItems() {
  const d = await api("/dress-items/admin/all");
  content.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="addDress">+ 품목 등록</button>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 품목이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>품목</th><th>치수</th><th>수량</th><th class="right">가격</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((it) => `
          <tr>
            <td><b>${esc(it.name)}</b>${it.imageUrl ? `<br><img src="${esc(it.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            <td class="nowrap">${esc(it.spec)}</td>
            <td class="nowrap">${esc(it.unit)}</td>
            <td class="right nowrap">${won(it.price)}</td>
            <td>${it.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(it))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${it.id}" data-name="${esc(it.name + " " + it.spec)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addDress").addEventListener("click", () => dressItemForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => dressItemForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("상복", b.getAttribute("data-name"), async () => {
      await api("/dress-items/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function dressItemForm(it) {
  const e = it || {};
  const defaultName = e.name || "예복정장";
  const defaultUnit = DRESS_ITEM_UNITS[defaultName] || "1벌";
  openModal(it ? "상복 품목 수정" : "상복 품목 등록", `
    <div class="field-row">
      <div class="field"><label>품목 *</label>
        <select id="f_name">${DRESS_ITEM_NAMES.map((n) =>
          `<option value="${esc(n)}" ${defaultName === n ? "selected" : ""}>${esc(n)}</option>`
        ).join("")}</select>
      </div>
      <div class="field"><label>치수 *</label><input id="f_spec" value="${esc(e.spec || "")}" placeholder="100, 44, 260, Free 등" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>수량(단위)</label><input id="f_unit" value="${esc(e.unit || defaultUnit)}" placeholder="1벌, 1켤레, 1개" /></div>
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field" style="display:flex;gap:18px">
      <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
      <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        name: val("f_name"), spec: val("f_spec"),
        unit: val("f_unit") || DRESS_ITEM_UNITS[val("f_name")] || "1개",
        price: Number(val("f_price")) || 0,
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("품목을 선택하세요."); return; }
      if (!body.spec) { toast("치수를 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (it && it.imageId) body.imageId = it.imageId;
      try {
        if (it) await api("/dress-items/" + it.id, { method: "PATCH", body });
        else await api("/dress-items", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
  const nameEl = document.getElementById("f_name");
  const unitEl = document.getElementById("f_unit");
  if (nameEl && unitEl && !it) {
    nameEl.addEventListener("change", () => {
      unitEl.value = DRESS_ITEM_UNITS[nameEl.value] || "1개";
    });
  }
}

async function renderHearseItems(hearseCategory) {
  const label = HEARSE_CATEGORY_LABELS[hearseCategory] || hearseCategory;
  const d = await api("/hearse-items/admin/all?hearseCategory=" + encodeURIComponent(hearseCategory));
  content.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="addHearse">+ ${esc(label)} 등록</button>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 차량이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>차량</th><th>규격</th><th>수량</th><th class="right">가격</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((it) => `
          <tr>
            <td><b>${esc(it.name)}</b>${it.imageUrl ? `<br><img src="${esc(it.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            <td class="nowrap">${esc(it.spec || "-")}</td>
            <td class="nowrap">${esc(it.unit)}</td>
            <td class="right nowrap">${won(it.price)}</td>
            <td>${it.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(it))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${it.id}" data-name="${esc(it.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;
  document.getElementById("addHearse").addEventListener("click", () => hearseItemForm(null, hearseCategory));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => hearseItemForm(JSON.parse(b.getAttribute("data-edit")), hearseCategory)));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete(label, b.getAttribute("data-name"), async () => {
      await api("/hearse-items/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function hearseItemForm(it, hearseCategory) {
  const e = it || {};
  const cat = hearseCategory || e.hearseCategory || "cadillac";
  const label = HEARSE_CATEGORY_LABELS[cat] || cat;
  openModal(it ? label + " 수정" : label + " 등록", `
    <input type="hidden" id="f_hearseCategory" value="${esc(cat)}" />
    <div class="field-row">
      <div class="field"><label>차량명 *</label><input id="f_name" value="${esc(e.name || label)}" /></div>
      <div class="field"><label>규격</label><input id="f_spec" value="${esc(e.spec || "")}" placeholder="운구 + 동승 2~3인 등" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>수량(단위)</label><input id="f_unit" value="${esc(e.unit || "1대")}" placeholder="1대" /></div>
      <div class="field"><label>가격(원)</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : 0}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>이미지</label><input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"></p>` : ""}
    </div>
    <div class="field" style="display:flex;gap:18px">
      <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
      <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        hearseCategory: val("f_hearseCategory"), name: val("f_name"), spec: val("f_spec"),
        unit: val("f_unit") || "1대", price: Number(val("f_price")) || 0,
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.name) { toast("차량명을 입력하세요."); return; }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try { body.imageId = (await uploadImage(fileEl.files[0])).id; }
        catch (err) { toast(err.message); return; }
      } else if (it && it.imageId) body.imageId = it.imageId;
      try {
        if (it) await api("/hearse-items/" + it.id, { method: "PATCH", body });
        else await api("/hearse-items", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

async function renderProductsByCat(catKey) {
  const catMeta = CAT_KEYS.find((c) => c.key === catKey) || { label: catKey };
  const d = await api("/products/admin/all");
  const items = d.items.filter((p) => p.catKey === catKey);
  const specCols = (PRODUCT_SPEC_FIELDS[catKey] || []).slice(0, 2);
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addProd">+ ${esc(catMeta.label)} 등록</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${items.length === 0 ? '<div class="empty">등록된 상품이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>상품명</th>${specCols.map((s) => `<th>${esc(s.label)}</th>`).join("")}<th class="right">가격</th><th>정산</th><th>노출</th><th class="right">관리</th></tr></thead>
        <tbody>${items.map((p) => `
          <tr>
            <td><b>${esc(p.name)}</b>${p.imageUrl ? `<br><img src="${esc(p.imageUrl)}" alt="" style="max-width:48px;max-height:48px;margin-top:4px;border-radius:4px">` : ""}</td>
            ${specCols.map((s) => `<td class="nowrap">${esc((p.specs && p.specs[s.key]) || "-")}</td>`).join("")}
            <td class="right nowrap">${won(p.price)} / ${esc(p.unit)}</td>
            <td>${SETTLEMENT_LABELS[p.settlementType] || p.settlementType}</td>
            <td>${p.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(p))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${p.id}" data-name="${esc(p.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("addProd").addEventListener("click", () => productForm(null, catKey));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => productForm(JSON.parse(b.getAttribute("data-edit")), catKey)));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("상품", b.getAttribute("data-name"), async () => {
      await api("/products/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function specFieldsHtml(catKey, specs) {
  const fields = PRODUCT_SPEC_FIELDS[catKey] || [];
  if (fields.length === 0) return "";
  const s = specs || {};
  return `<div class="field-row">${fields.map((f) =>
    `<div class="field"><label>${esc(f.label)}</label><input id="spec_${f.key}" value="${esc(s[f.key] || "")}" /></div>`
  ).join("")}</div>`;
}

function collectSpecs(catKey) {
  const fields = PRODUCT_SPEC_FIELDS[catKey] || [];
  const specs = {};
  fields.forEach((f) => { specs[f.key] = val("spec_" + f.key); });
  return specs;
}

function productForm(p, fixedCatKey) {
  const e = p || {};
  const catKey = fixedCatKey || e.catKey || "shroud";
  const catMeta = CAT_KEYS.find((c) => c.key === catKey) || { label: catKey };
  const settleOpts = Object.keys(SETTLEMENT_LABELS).map((k) =>
    `<option value="${k}" ${e.settlementType === k ? "selected" : ""}>${SETTLEMENT_LABELS[k]}</option>`).join("");
  openModal(p ? "상품 수정" : catMeta.label + " 등록", `
    <input type="hidden" id="f_catKey" value="${esc(catKey)}" />
    <input type="hidden" id="f_category" value="${esc(e.category || catMeta.label)}" />
    <div class="field-row">
      <div class="field"><label>상품명 *</label><input id="f_name" value="${esc(e.name || "")}" /></div>
      <div class="field"><label>정산 방식</label><select id="f_settlementType">${settleOpts}</select></div>
    </div>
    ${specFieldsHtml(catKey, e.specs)}
    <div class="field-row">
      <div class="field"><label>가격(원) *</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : ""}" /></div>
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || "개")}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
    <div class="field"><label>상품 이미지</label>
      <input type="file" id="f_imageFile" accept="image/*" />
      ${e.imageUrl ? `<p class="muted" style="margin-top:8px"><img src="${esc(e.imageUrl)}" alt="" style="max-width:120px;border-radius:6px"><br>현재 이미지 유지. 새 파일 선택 시 교체.</p>` : ""}
    </div>
    <div class="field-row">
      <div class="field"><label>정렬 순서</label><input id="f_sortOrder" type="number" value="${e.sortOrder != null ? e.sortOrder : 0}" /></div>
      <div class="field" style="display:flex;gap:18px;align-items:flex-end">
        <label class="check"><input type="checkbox" id="f_taxable" ${e.taxable === false ? "" : "checked"}/> 과세</label>
        <label class="check"><input type="checkbox" id="f_active" ${e.active === false ? "" : "checked"}/> 판매(노출)</label>
      </div>
    </div>
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        catKey: val("f_catKey"), category: val("f_category"), name: val("f_name"),
        settlementType: val("f_settlementType"),
        price: Number(val("f_price")), unit: val("f_unit") || "개",
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        specs: collectSpecs(catKey),
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.catKey || !body.category || !body.name || !(body.price >= 0)) {
        toast("상품명·가격을 입력하세요."); return;
      }
      const fileEl = document.getElementById("f_imageFile");
      if (fileEl && fileEl.files && fileEl.files[0]) {
        try {
          const img = await uploadImage(fileEl.files[0]);
          body.imageId = img.id;
        } catch (err) { toast(err.message); return; }
      } else if (p && p.imageId) {
        body.imageId = p.imageId;
      }
      try {
        if (p) await api("/products/" + p.id, { method: "PATCH", body });
        else await api("/products", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
      } catch (err) { toast(err.message); }
    } },
  ]);
}

/* ---------- 주문 관리 ---------- */
let orderFilter = "";
let lastOrders = [];
const ORDER_STATUS = { pending: "접수", confirmed: "확인", paid: "결제완료", canceled: "취소" };

function groupOrdersByFamily(orders) {
  const map = new Map();
  for (const o of orders) {
    const fid = (o.family && o.family.id) || String(o.familyUserId || "unknown");
    if (!map.has(fid)) {
      map.set(fid, { familyId: o.family && o.family.id, family: o.family, hall: o.hall, orders: [] });
    }
    const g = map.get(fid);
    g.orders.push(o);
    if (!g.hall && o.hall) g.hall = o.hall;
  }
  return Array.from(map.values()).sort((a, b) => {
    const an = (a.family && a.family.name) || "";
    const bn = (b.family && b.family.name) || "";
    return an.localeCompare(bn, "ko");
  });
}

function familyDocButtons(familyId, cls) {
  if (!familyId) return "";
  const c = cls || "btn btn-sm";
  return `
    <button type="button" class="${c} btn-primary" data-family-agg="${esc(familyId)}" data-agg="order">주문서 합계</button>
    <button type="button" class="${c}" data-family-agg="${esc(familyId)}" data-agg="statement">거래명세서</button>
    <button type="button" class="${c}" data-family-agg="${esc(familyId)}" data-agg="tax">세금계산서</button>`;
}

async function renderOrders() {
  const d = await api("/orders/admin/all" + (orderFilter ? "?status=" + orderFilter : ""));
  lastOrders = d.items || [];
  const groups = groupOrdersByFamily(lastOrders);
  const tag = (s) => `<span class="tag ${s}">${ORDER_STATUS[s] || s}</span>`;
  const activeCount = (orders) => orders.filter((o) => o.status !== "canceled").length;

  content.innerHTML = `
    <p class="orders-lead">상주별 예약 내역과 발인 정산 문서를 확인·출력할 수 있습니다. 사후정산 품목은 발인 전 관리자가 실사용 수량을 정산합니다.</p>
    <div class="toolbar">
      <select id="ordStatus">
        <option value="">전체 상태</option>
        ${Object.keys(ORDER_STATUS).map((k) => `<option value="${k}" ${orderFilter === k ? "selected" : ""}>${ORDER_STATUS[k]}</option>`).join("")}
      </select>
    </div>
    ${groups.length === 0 ? '<div class="panel"><div class="panel-body"><div class="empty">주문이 없습니다.</div></div></div>' : `
    <div class="order-groups">
      ${groups.map((g) => {
        const familyLabel = g.family
          ? `${esc(g.family.name)} (${esc(g.family.username)})`
          : esc("상주 미지정");
        const hallLabel = g.hall
          ? `빈소 ${esc(g.hall.hallNumber)}${g.hall.deceasedName ? " · 故 " + esc(g.hall.deceasedName) : ""}${g.hall.funeralDate ? " · 발인 " + esc(g.hall.funeralDate) + (g.hall.funeralTime ? " " + esc(g.hall.funeralTime) : "") : ""}`
          : "빈소 미지정";
        const sumCount = activeCount(g.orders);
        return `
        <div class="panel order-family-card">
          <div class="order-family-meta">
            <h3>${familyLabel}</h3>
            <p class="sub">${hallLabel}</p>
          </div>
          <div class="order-family-section">건별 예약 내역</div>
          <div class="panel-body" style="padding:0">
            <table class="grid">
              <thead><tr><th>주문번호</th><th>주요 품목</th><th class="right">합계</th><th>상태</th><th class="nowrap">주문일</th><th class="right">문서</th><th class="right">관리</th></tr></thead>
              <tbody>${g.orders.map((o) => `
                <tr>
                  <td class="nowrap"><b>${esc(o.orderNumber)}</b></td>
                  <td>${esc(o.items[0] ? o.items[0].name : "-")}${o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ""}</td>
                  <td class="right nowrap">${won(o.totalAmount)}</td>
                  <td>${tag(o.status)}</td>
                  <td class="nowrap">${fmtDay(o.createdAt)}</td>
                  <td class="right nowrap">
                    <button type="button" class="btn btn-sm" data-order-doc="${esc(o.id)}">주문서</button>
                  </td>
                  <td class="right nowrap actions">
                    <button type="button" class="btn btn-sm btn-primary" data-order-id="${esc(o.id)}">상세</button>
                  </td>
                </tr>`).join("")}
              </tbody>
            </table>
            ${sumCount > 0 && g.familyId ? `
            <div class="doc-actions">
              <p class="doc-actions-lead">발인 정산 · 취소 제외 ${sumCount}건 합계</p>
              <div class="doc-actions-btns">${familyDocButtons(g.familyId, "btn")}</div>
            </div>` : ""}
          </div>
        </div>`;
      }).join("")}
    </div>`}
  `;

  document.getElementById("ordStatus").addEventListener("change", (e) => { orderFilter = e.target.value; renderOrders(); });
  content.querySelectorAll("[data-order-id]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = lastOrders.find((x) => x.id === b.getAttribute("data-order-id"));
      if (o) orderDetail(o);
      else toast("주문 정보를 찾을 수 없습니다.");
    }));
  content.querySelectorAll("[data-order-doc]").forEach((b) =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      try { await showAdminOrderDoc(b.getAttribute("data-order-doc")); }
      catch (e) { toast(e.message); }
      finally { b.disabled = false; }
    }));
  content.querySelectorAll("[data-family-agg][data-agg]").forEach((b) =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      try { await showAdminAggregateDoc(b.getAttribute("data-family-agg"), b.getAttribute("data-agg")); }
      catch (e) { toast(e.message); }
      finally { b.disabled = false; }
    }));
}

function orderDetail(o) {
  const rows = o.items.map((it, idx) => `
    <tr>
      <td>${esc(it.name)}${it.settlementType === "postpaid" ? ' <span class="tag pending">사후정산</span>' : ""}</td>
      <td class="right nowrap">${won(it.price)}</td>
      <td class="right">${it.qty}${esc(it.unit)}</td>
      <td class="right">${it.settlementType === "postpaid" ? (it.settled ? (it.finalQty + esc(it.unit)) : "미정산") : "-"}</td>
      <td class="right nowrap">${it.settlementType === "postpaid" && !it.settled ? "-" : won(it.price * (it.settlementType === "postpaid" ? (it.finalQty || 0) : it.qty))}</td>
    </tr>`).join("");

  const postpaidItems = o.items.map((it, idx) => ({ ...it, _idx: idx })).filter((it) => it.settlementType === "postpaid" && !it.settled);
  const settleHtml = postpaidItems.length > 0 ? `
    <div class="block" style="margin-top:16px;padding:12px;background:#fafbfc;border:1px solid var(--line);border-radius:8px">
      <h4 style="margin:0 0 10px">사후정산 (발인 전 수기 정산)</h4>
      ${postpaidItems.map((it) => `
        <div class="field-row" style="align-items:center;margin-bottom:8px">
          <div class="field" style="flex:1"><label>${esc(it.name)} (예약 ${it.qty}${esc(it.unit)})</label></div>
          <div class="field" style="max-width:120px">
            <input type="number" min="0" id="settle_${it._idx}" placeholder="실사용" value="${it.qty}" />
          </div>
        </div>`).join("")}
      <button class="btn btn-primary btn-sm" id="settleBtn">정산 반영</button>
    </div>` : (o.postpaidSettledAt ? `<p class="muted">사후정산 완료: ${fmt(o.postpaidSettledAt)}</p>` : "");

  openModal(`주문 상세 · ${esc(o.orderNumber)}`, `
    <div class="detail-row"><b>상주</b><span>${o.family ? esc(o.family.name) + " (" + esc(o.family.username) + ")" : "-"}</span></div>
    <div class="detail-row"><b>빈소</b><span>${o.hall ? esc(o.hall.hallNumber) + (o.hall.specLabel ? " (" + esc(o.hall.specLabel) + ")" : "") + (o.hall.deceasedName ? " / 故 " + esc(o.hall.deceasedName) : "") : "-"}</span></div>
    <div class="detail-row"><b>발인</b><span>${o.hall && o.hall.funeralDate ? esc(o.hall.funeralDate) + (o.hall.funeralTime ? " " + esc(o.hall.funeralTime) : "") : "-"}${o.hall && o.hall.frozen ? ' <span class="muted">(주문 접수 시 고정)</span>' : ""}</span></div>
    <div class="detail-row"><b>주문일</b><span>${fmt(o.createdAt)}</span></div>
    <table class="grid" style="margin:12px 0">
      <thead><tr><th>품목</th><th class="right">단가</th><th class="right">예약</th><th class="right">실사용</th><th class="right">금액</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="4" class="right">공급가액</td><td class="right nowrap">${won(o.supplyAmount)}</td></tr>
        <tr><td colspan="4" class="right">부가세</td><td class="right nowrap">${won(o.vatAmount)}</td></tr>
        <tr><td colspan="4" class="right"><b>합계</b></td><td class="right nowrap"><b>${won(o.totalAmount)}</b></td></tr>
      </tfoot>
    </table>
    ${o.memo ? `<div class="detail-row"><b>메모</b><span>${esc(o.memo)}</span></div>` : ""}
    ${settleHtml}
    <div class="field"><label>상태 변경</label>
      <select id="f_status">
        ${Object.keys(ORDER_STATUS).map((k) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${ORDER_STATUS[k]}</option>`).join("")}
      </select>
    </div>
    <div class="toolbar" style="margin-top:8px">
      ${o.family && o.family.id ? familyDocButtons(o.family.id, "btn btn-sm") : ""}
      <button type="button" class="btn btn-sm" data-order-doc-inline="${esc(o.id)}">주문서</button>
    </div>
  `, [
    { label: "닫기", onClick: closeModal },
    { label: "상태 저장", cls: "btn-primary", onClick: async () => {
      try { await api("/orders/" + o.id, { method: "PATCH", body: { status: val("f_status") } }); closeModal(); toast("저장되었습니다."); renderOrders(); }
      catch (err) { toast(err.message); }
    } },
  ]);

  const inlineDocBtn = document.querySelector("#modalBody [data-order-doc-inline]");
  if (inlineDocBtn) {
    inlineDocBtn.addEventListener("click", async () => {
      inlineDocBtn.disabled = true;
      try { await showAdminOrderDoc(o.id); }
      catch (e) { toast(e.message); }
      finally { inlineDocBtn.disabled = false; }
    });
  }
  document.querySelectorAll("#modalBody [data-family-agg]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try { await showAdminAggregateDoc(btn.getAttribute("data-family-agg"), btn.getAttribute("data-agg")); }
      catch (e) { toast(e.message); }
      finally { btn.disabled = false; }
    });
  });

  const settleBtn = document.getElementById("settleBtn");
  if (settleBtn) {
    settleBtn.addEventListener("click", async () => {
      const settleItems = postpaidItems.map((it) => ({
        index: it._idx,
        finalQty: Number(document.getElementById("settle_" + it._idx).value) || 0,
      }));
      try {
        await api("/orders/" + o.id + "/settle", { method: "PATCH", body: { items: settleItems } });
        closeModal(); toast("사후정산이 반영되었습니다."); renderOrders();
      } catch (err) { toast(err.message); }
    });
  }
}

/* ---------- 공통 삭제 확인 ---------- */
function confirmDelete(kind, name, onOk) {
  openModal(kind + " 삭제", `<p>다음 ${esc(kind)}을(를) 삭제하시겠습니까?</p><p style="font-weight:700">${esc(name)}</p><p class="muted">삭제 후에는 복구할 수 없습니다.</p>`, [
    { label: "취소", onClick: closeModal },
    { label: "삭제", cls: "btn-danger", onClick: async () => { try { await onOk(); closeModal(); } catch (e) { toast(e.message); } } },
  ]);
}

/* ---------- 시작 ---------- */
(async function () {
  initNav();
  if (await guard()) route();
})();

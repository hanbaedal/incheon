"use strict";
/* 근로복지공단 인천병원 장례식장 - 관리자 콘솔 로직 (한글 전용) */

/* ---------- 공통 유틸 ---------- */
async function api(path, opts) {
  opts = opts || {};
  const res = await fetch("/api" + path, {
    method: opts.method || "GET",
    credentials: "same-origin",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401) { location.href = "/admin/login.html"; throw new Error("unauthorized"); }
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
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function checked(id) { const el = document.getElementById(id); return el ? el.checked : false; }

/* ---------- 인증 가드 ---------- */
let ME = null;
async function guard() {
  try {
    const d = await api("/auth/me");
    if (!d.user || d.user.role !== "admin") { location.href = "/admin/login.html"; return false; }
    ME = d.user;
    document.getElementById("whoName").textContent = ME.name + " 님";
    return true;
  } catch (e) { location.href = "/admin/login.html"; return false; }
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  location.href = "/admin/login.html";
});

/* ---------- 라우터 ---------- */
const VIEWS = {
  dashboard: { title: "대시보드", render: renderDashboard },
  halls: { title: "빈소 관리", render: renderHalls },
  families: { title: "상주 계정 관리", render: renderFamilies },
  products: { title: "상품 관리", render: renderProducts },
  orders: { title: "주문 관리", render: renderOrders },
  notices: { title: "알림 소식", render: renderNotices },
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
  document.querySelectorAll("#sideNav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("data-view") === key);
  });
  document.getElementById("viewTitle").textContent = VIEWS[key].title;
  content.innerHTML = '<div class="empty">불러오는 중…</div>';
  try { await VIEWS[key].render(); }
  catch (e) { content.innerHTML = `<div class="empty">오류: ${esc(e.message)}</div>`; }
  refreshInquiryBadge();
  refreshOrderBadge();
}
window.addEventListener("hashchange", route);

async function refreshInquiryBadge() {
  try {
    const d = await api("/inquiries/admin/all?status=pending");
    const badge = document.getElementById("navInqBadge");
    if (d.items.length > 0) { badge.style.display = "grid"; badge.textContent = d.items.length; }
    else badge.style.display = "none";
  } catch (e) {}
}

async function refreshOrderBadge() {
  try {
    const d = await api("/orders/admin/all?status=pending");
    const badge = document.getElementById("navOrderBadge");
    if (d.items.length > 0) { badge.style.display = "grid"; badge.textContent = d.items.length; }
    else badge.style.display = "none";
  } catch (e) {}
}

/* 금액 표시 */
function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }

/* ---------- 대시보드 ---------- */
async function renderDashboard() {
  const [halls, inquiries, memorials, families, orders] = await Promise.all([
    api("/halls/admin/all"), api("/inquiries/admin/all"),
    api("/memorials/admin/all"), api("/users/admin/all"), api("/orders/admin/all"),
  ]);
  const inUse = halls.items.filter((h) => h.status === "in-use").length;
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

/* ---------- 빈소 관리 ---------- */
async function renderHalls() {
  const d = await api("/halls/admin/all");
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addHall">+ 빈소 등록</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 빈소가 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>호실</th><th>상태</th><th>고인명</th><th>상주</th><th>발인</th><th>접근코드</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((h) => `
          <tr>
            <td><b>${esc(h.hallNumber)}</b></td>
            <td><span class="tag ${h.status === "in-use" ? "use" : "free"}">${h.status === "in-use" ? "사용중" : "비어있음"}</span></td>
            <td>${esc(h.deceasedName) || "-"}</td>
            <td>${esc(h.chiefMourner) || "-"}</td>
            <td class="nowrap">${esc(h.funeralDate) || "-"} ${esc(h.funeralTime)}</td>
            <td class="nowrap">${h.familyCode ? `<code>${esc(h.familyCode)}</code>` : "-"}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(h))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${h.id}" data-name="${esc(h.hallNumber)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("addHall").addEventListener("click", () => hallForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => hallForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("빈소", b.getAttribute("data-name"), async () => {
      await api("/halls/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function hallForm(h) {
  const e = h || {};
  const opt = (v, label, cur) => `<option value="${v}" ${cur === v ? "selected" : ""}>${label}</option>`;
  openModal(h ? "빈소 수정" : "빈소 등록", `
    <div class="field-row">
      <div class="field"><label>호실명 *</label><input id="f_hallNumber" value="${esc(e.hallNumber || "")}" placeholder="예: 특1호실" /></div>
      <div class="field"><label>상태</label><select id="f_status">${opt("available", "비어있음", e.status || "available")}${opt("in-use", "사용중", e.status)}</select></div>
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
      <div class="field"><label>발인 일자</label><input id="f_funeralDate" value="${esc(e.funeralDate || "")}" placeholder="예: 2026-07-20" /></div>
      <div class="field"><label>발인 시각</label><input id="f_funeralTime" value="${esc(e.funeralTime || "")}" placeholder="예: 07:00" /></div>
    </div>
    <div class="field"><label>장지</label><input id="f_burialSite" value="${esc(e.burialSite || "")}" /></div>
    ${h && h.familyCode ? `<p class="muted">상주 접근코드: <code>${esc(h.familyCode)}</code></p>` : ""}
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const body = {
        hallNumber: val("f_hallNumber"), status: val("f_status"),
        deceasedName: val("f_deceasedName"), chiefMourner: val("f_chiefMourner"),
        relationship: val("f_relationship"), age: val("f_age"),
        funeralDate: val("f_funeralDate"), funeralTime: val("f_funeralTime"),
        burialSite: val("f_burialSite"),
      };
      if (!body.hallNumber) { toast("호실명을 입력하세요."); return; }
      try {
        if (h) await api("/halls/" + h.id, { method: "PATCH", body });
        else await api("/halls", { method: "POST", body });
        closeModal(); toast("저장되었습니다."); route();
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
    const hd = await api("/halls/admin/all");
    hallOptions += hd.items.map((h) => {
      const label = esc(h.hallNumber) + (h.deceasedName ? " / " + esc(h.deceasedName) : "");
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
      <div class="field"><label>연결 빈소</label><select id="f_hall">${hallOptions}</select></div>
    </div>
    <div class="field"><label>${u ? "비밀번호 재설정 (미입력 시 유지)" : "비밀번호 *"}</label><input id="f_password" type="text" placeholder="${u ? "변경할 때만 입력" : "초기 비밀번호"}" /></div>
    ${u ? `<div class="field"><label class="check"><input type="checkbox" id="f_active" ${e.active ? "checked" : ""}/> 계정 사용(활성)</label></div>` : ""}
  `, [
    { label: "취소", onClick: closeModal },
    { label: "저장", cls: "btn-primary", onClick: async () => {
      const hallId = val("f_hall");
      if (u) {
        const body = { name: val("f_name"), phone: val("f_phone"), hallId: hallId || null, active: checked("f_active") };
        const pw = val("f_password"); if (pw) body.password = pw;
        if (!body.name) { toast("이름을 입력하세요."); return; }
        try { await api("/users/" + u.id, { method: "PATCH", body }); closeModal(); toast("저장되었습니다."); route(); }
        catch (err) { toast(err.message); }
      } else {
        const body = { username: val("f_username"), name: val("f_name"), phone: val("f_phone"), password: val("f_password"), hallId: hallId || null };
        if (!body.username || !body.name || !body.password) { toast("아이디·이름·비밀번호를 입력하세요."); return; }
        try { await api("/users", { method: "POST", body }); closeModal(); toast("상주 계정이 발급되었습니다."); route(); }
        catch (err) { toast(err.message); }
      }
    } },
  ]);
}

/* ---------- 상품 관리 ---------- */
async function renderProducts() {
  const d = await api("/products/admin/all");
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addProd">+ 상품 등록</button></div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">등록된 상품이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>분류</th><th>상품명</th><th class="right">가격</th><th>단위</th><th>과세</th><th>노출</th><th>정렬</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((p) => `
          <tr>
            <td class="nowrap">${esc(p.category)}</td>
            <td><b>${esc(p.name)}</b></td>
            <td class="right nowrap">${won(p.price)}</td>
            <td>${esc(p.unit)}</td>
            <td>${p.taxable ? "과세" : "면세"}</td>
            <td>${p.active ? '<span class="tag free">판매</span>' : '<span class="tag gray">숨김</span>'}</td>
            <td>${p.sortOrder}</td>
            <td class="actions">
              <button class="btn btn-sm" data-edit='${esc(JSON.stringify(p))}'>수정</button>
              <button class="btn btn-sm btn-danger" data-del="${p.id}" data-name="${esc(p.name)}">삭제</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("addProd").addEventListener("click", () => productForm(null));
  content.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => productForm(JSON.parse(b.getAttribute("data-edit")))));
  content.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => confirmDelete("상품", b.getAttribute("data-name"), async () => {
      await api("/products/" + b.getAttribute("data-del"), { method: "DELETE" });
      toast("삭제되었습니다."); route();
    })));
}

function productForm(p) {
  const e = p || {};
  openModal(p ? "상품 수정" : "상품 등록", `
    <div class="field-row">
      <div class="field"><label>분류 *</label><input id="f_category" value="${esc(e.category || "")}" placeholder="예: 관·수의 / 접객 음식" /></div>
      <div class="field"><label>상품명 *</label><input id="f_name" value="${esc(e.name || "")}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>가격(원) *</label><input id="f_price" type="number" min="0" value="${e.price != null ? e.price : ""}" /></div>
      <div class="field"><label>단위</label><input id="f_unit" value="${esc(e.unit || "개")}" /></div>
    </div>
    <div class="field"><label>설명</label><textarea id="f_description">${esc(e.description || "")}</textarea></div>
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
        category: val("f_category"), name: val("f_name"),
        price: Number(val("f_price")), unit: val("f_unit") || "개",
        description: val("f_description"), sortOrder: Number(val("f_sortOrder")) || 0,
        taxable: checked("f_taxable"), active: checked("f_active"),
      };
      if (!body.category || !body.name || !(body.price >= 0)) { toast("분류·상품명·가격을 입력하세요."); return; }
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
const ORDER_STATUS = { pending: "접수", confirmed: "확인", paid: "결제완료", canceled: "취소" };
async function renderOrders() {
  const d = await api("/orders/admin/all" + (orderFilter ? "?status=" + orderFilter : ""));
  const tag = (s) => {
    const cls = s === "pending" ? "pending" : s === "canceled" ? "gray" : "answered";
    return `<span class="tag ${cls}">${ORDER_STATUS[s] || s}</span>`;
  };
  content.innerHTML = `
    <div class="toolbar">
      <select id="ordStatus">
        <option value="">전체 상태</option>
        ${Object.keys(ORDER_STATUS).map((k) => `<option value="${k}" ${orderFilter === k ? "selected" : ""}>${ORDER_STATUS[k]}</option>`).join("")}
      </select>
    </div>
    <div class="panel"><div class="panel-body" style="padding:0">
      ${d.items.length === 0 ? '<div class="empty">주문이 없습니다.</div>' : `
      <table class="grid">
        <thead><tr><th>주문번호</th><th>상주</th><th>빈소</th><th>품목</th><th class="right">합계</th><th>상태</th><th>주문일</th><th class="right">관리</th></tr></thead>
        <tbody>${d.items.map((o) => `
          <tr>
            <td class="nowrap"><b>${esc(o.orderNumber)}</b></td>
            <td class="nowrap">${o.family ? esc(o.family.name) + " (" + esc(o.family.username) + ")" : esc(o.buyer && o.buyer.name) || "-"}</td>
            <td class="nowrap">${o.hall ? esc(o.hall.hallNumber) : "-"}</td>
            <td>${esc(o.items[0] ? o.items[0].name : "-")}${o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ""}</td>
            <td class="right nowrap">${won(o.totalAmount)}</td>
            <td>${tag(o.status)}</td>
            <td class="nowrap">${fmtDay(o.createdAt)}</td>
            <td class="actions">
              <button class="btn btn-sm btn-primary" data-view='${esc(JSON.stringify(o))}'>상세</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`}
    </div></div>`;

  document.getElementById("ordStatus").addEventListener("change", (e) => { orderFilter = e.target.value; renderOrders(); });
  content.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => orderDetail(JSON.parse(b.getAttribute("data-view")))));
}

function orderDetail(o) {
  const rows = o.items.map((it) => `
    <tr>
      <td>${esc(it.name)}</td>
      <td class="right nowrap">${won(it.price)}</td>
      <td class="right">${it.qty}${esc(it.unit)}</td>
      <td class="right nowrap">${won(it.price * it.qty)}</td>
    </tr>`).join("");
  openModal(`주문 상세 · ${esc(o.orderNumber)}`, `
    <div class="detail-row"><b>상주</b><span>${o.family ? esc(o.family.name) + " (" + esc(o.family.username) + ")" : "-"}</span></div>
    <div class="detail-row"><b>빈소</b><span>${o.hall ? esc(o.hall.hallNumber) + (o.hall.deceasedName ? " / " + esc(o.hall.deceasedName) : "") : "-"}</span></div>
    <div class="detail-row"><b>주문일</b><span>${fmt(o.createdAt)}</span></div>
    <table class="grid" style="margin:12px 0">
      <thead><tr><th>품목</th><th class="right">단가</th><th class="right">수량</th><th class="right">금액</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="3" class="right">공급가액</td><td class="right nowrap">${won(o.supplyAmount)}</td></tr>
        <tr><td colspan="3" class="right">부가세</td><td class="right nowrap">${won(o.vatAmount)}</td></tr>
        <tr><td colspan="3" class="right"><b>합계</b></td><td class="right nowrap"><b>${won(o.totalAmount)}</b></td></tr>
      </tfoot>
    </table>
    ${o.memo ? `<div class="detail-row"><b>메모</b><span>${esc(o.memo)}</span></div>` : ""}
    <div class="field"><label>상태 변경</label>
      <select id="f_status">
        ${Object.keys(ORDER_STATUS).map((k) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${ORDER_STATUS[k]}</option>`).join("")}
      </select>
    </div>
    <div class="toolbar" style="margin-top:8px">
      <a class="btn btn-sm" href="/pages/member/doc.html?type=order&id=${o.id}" target="_blank">주문서</a>
      <a class="btn btn-sm" href="/pages/member/doc.html?type=statement&id=${o.id}" target="_blank">거래명세서</a>
      <a class="btn btn-sm" href="/pages/member/doc.html?type=tax&id=${o.id}" target="_blank">세금계산서</a>
    </div>
  `, [
    { label: "닫기", onClick: closeModal },
    { label: "상태 저장", cls: "btn-primary", onClick: async () => {
      try { await api("/orders/" + o.id, { method: "PATCH", body: { status: val("f_status") } }); closeModal(); toast("저장되었습니다."); renderOrders(); }
      catch (err) { toast(err.message); }
    } },
  ]);
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
  if (await guard()) route();
})();

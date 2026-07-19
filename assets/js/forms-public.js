"use strict";

async function fetchPublicForms() {
  const res = await fetch("/api/forms");
  if (!res.ok) throw new Error("서식 목록을 불러오지 못했습니다.");
  const data = await res.json();
  return data.items || [];
}

function formDownloadCell(f, compact) {
  if (f.downloadUrl) {
    const label = typeof mT === "function" ? mT("common.download") : "받기";
    return `<a class="${compact ? "info-link" : ""}" href="${escapeHtml(f.downloadUrl)}" download style="${compact ? "" : "color:var(--gold);font-weight:600;"}">${escapeHtml(label)}</a>`;
  }
  const pending = typeof mT === "function" ? mT("common.preparing") : "준비중";
  return compact ? `<span class="muted">${escapeHtml(pending)}</span>` : `<span class="muted">${escapeHtml(pending)}</span>`;
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderFormsTableRows(items, compact) {
  if (!items.length) {
    return `<tr><td colspan="${compact ? 2 : 3}">등록된 서식이 없습니다.</td></tr>`;
  }
  if (compact) {
    return items.map((f) => `
      <tr>
        <td>${escapeHtml(f.name)}</td>
        <td class="right nowrap">${formDownloadCell(f, true)}</td>
      </tr>`).join("");
  }
  return items.map((f) => `
    <tr>
      <td>${escapeHtml(f.name)}</td>
      <td>${escapeHtml(f.description || "-")}</td>
      <td>${formDownloadCell(f, false)}</td>
    </tr>`).join("");
}

async function loadFormsIntoTable(tbodyId, compact) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const loading = typeof mT === "function" ? mT("common.loading") : "불러오는 중…";
  tbody.innerHTML = `<tr><td colspan="${compact ? 2 : 3}">${escapeHtml(loading)}</td></tr>`;
  try {
    const items = await fetchPublicForms();
    tbody.innerHTML = renderFormsTableRows(items, compact);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="${compact ? 2 : 3}">${escapeHtml(e.message)}</td></tr>`;
  }
}

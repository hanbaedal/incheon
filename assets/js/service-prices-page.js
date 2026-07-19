"use strict";

(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }
  function fmtPrice(item) {
    if (!item.orderable && (!item.price || item.price <= 0)) return "-";
    if (!item.price || item.price <= 0) return "-";
    return won(item.price);
  }

  async function loadPrices() {
    const tbody = document.getElementById("priceRows");
    if (!tbody) return;
    try {
      const res = await fetch("/api/service-prices");
      if (!res.ok) throw new Error("요금 정보를 불러올 수 없습니다.");
      const data = await res.json();
      const items = data.items || [];
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="state">등록된 항목이 없습니다.</td></tr>';
        return;
      }
      tbody.innerHTML = items.map((s) => `
        <tr>
          <td>${esc(s.group)}</td>
          <td>${esc(s.name)}</td>
          <td>${esc(s.unit || "-")}</td>
          <td class="right">${esc(fmtPrice(s))}</td>
          <td>${esc(s.note || "-")}</td>
        </tr>`).join("");
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" class="state">${esc(e.message || "오류")}</td></tr>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPrices);
  } else {
    loadPrices();
  }
})();

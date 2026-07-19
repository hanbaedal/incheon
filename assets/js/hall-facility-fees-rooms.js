"use strict";

(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }

  async function loadFacilityFees() {
    const tbody = document.getElementById("facilityFeeRows");
    if (!tbody) return;
    try {
      const res = await fetch("/api/hall-facility-fees");
      if (!res.ok) throw new Error("시설 사용료를 불러올 수 없습니다.");
      const data = await res.json();
      const items = data.items || [];
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="state">등록된 시설 사용료가 없습니다.</td></tr>';
        return;
      }
      tbody.innerHTML = items.map((f) => `
        <tr>
          <td>${esc(f.group)}</td>
          <td>${esc(f.name || "-")}</td>
          <td>-</td>
          <td class="right">${esc(won(f.price))}</td>
          <td>${esc(f.unit || "1일")}</td>
          <td>${esc(f.note || "-")}</td>
        </tr>`).join("");
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" class="state">${esc(e.message || "오류")}</td></tr>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadFacilityFees);
  } else {
    loadFacilityFees();
  }
})();

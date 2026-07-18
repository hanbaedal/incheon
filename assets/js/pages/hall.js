/* 빈소 찾기 / 빈소 현황 (백엔드 연동) */
onSiteReady(function () {
  const searchArea = document.getElementById("hallSearchArea");
  const statusArea = document.getElementById("hallStatusArea");

  function hallRows(items) {
    if (!items.length) return '<div class="dyn-empty">현재 조건에 해당하는 빈소가 없습니다.</div>';
    const rows = items
      .map(
        (h) => `<tr>
          <td><b>${escHtml(h.hallNumber)}</b></td>
          <td>${h.status === "in-use" ? '<span class="st st-use">사용중</span>' : '<span class="st st-free">비어있음</span>'}</td>
          <td>${escHtml(h.deceasedName) || "-"}</td>
          <td>${escHtml(h.chiefMourner) || "-"}</td>
          <td class="nowrap">${escHtml(h.funeralDate) || "-"} ${escHtml(h.funeralTime)}</td>
          <td>${escHtml(h.burialSite) || "-"}</td>
        </tr>`
      )
      .join("");
    return `<table class="tbl"><thead><tr>
      <th>호실</th><th style="width:90px">상태</th><th>고인</th><th>상주</th><th>발인</th><th>장지</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }

  // 빈소 찾기 (검색)
  if (searchArea) {
    searchArea.innerHTML = `
      <div class="btn-row" style="margin-bottom:16px">
        <input id="hq" placeholder="고인명 또는 상주명, 호실 검색" style="flex:1;min-width:200px;padding:11px 13px;border:1px solid var(--line);border-radius:8px" />
        <button class="pill-btn" id="hqBtn" style="background:var(--navy);color:#fff;border-color:var(--navy)">검색</button>
      </div>
      <div id="hqResult"><div class="dyn-loading">현재 사용 중인 빈소를 불러옵니다…</div></div>`;
    const result = document.getElementById("hqResult");
    async function loadDefault() {
      try {
        const d = await API.get("/halls?status=in-use");
        result.innerHTML = hallRows(d.items);
      } catch (e) { result.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`; }
    }
    async function doSearch() {
      const q = document.getElementById("hq").value.trim();
      if (!q) return loadDefault();
      result.innerHTML = '<div class="dyn-loading">검색 중…</div>';
      try {
        const d = await API.get("/halls/search?q=" + encodeURIComponent(q));
        result.innerHTML = hallRows(d.items);
      } catch (e) { result.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`; }
    }
    document.getElementById("hqBtn").addEventListener("click", doSearch);
    document.getElementById("hq").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
    loadDefault();
  }

  // 빈소 현황 (전체)
  if (statusArea) {
    statusArea.innerHTML = '<div class="dyn-loading">불러오는 중…</div>';
    API.get("/halls")
      .then((d) => { statusArea.innerHTML = hallRows(d.items); })
      .catch((e) => { statusArea.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`; });
  }
});

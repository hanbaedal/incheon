/* 빈소 찾기 / 빈소 현황 (백엔드 연동) */
onSiteReady(function () {
  const searchArea = document.getElementById("hallSearchArea");
  const statusArea = document.getElementById("hallStatusArea");

  function availabilityPanel(summary) {
    if (!summary) return "";
    let head = `<div class="block" style="padding:16px 18px;margin-bottom:16px;background:var(--bg-soft)">
      <p style="margin:0 0 6px;font-weight:700;color:var(--navy)">빈소 이용 가능 안내</p>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7">
        물리 빈소 <b>${summary.capacity}</b>실 기준 · 현재 이용 <b>${summary.activePhysicalCount}</b>실`;
    if (summary.freePhysicalSlots > 0) {
      head += ` · <b style="color:var(--navy)">${summary.freePhysicalSlots}실 즉시 배정 가능</b>`;
    } else if (summary.nextAvailableLabel) {
      head += `<br><b style="color:#b45309">${escHtml(summary.nextAvailableLabel)}</b>`;
    }
    head += "</p>";

    if (summary.activeUsages && summary.activeUsages.length) {
      const rows = summary.activeUsages
        .filter((u) => !u.isVirtual)
        .map((u) => {
          const rel =
            u.daysUntilRelease == null
              ? "발인일 미정"
              : u.daysUntilRelease <= 0
                ? "오늘 발인"
                : `${u.daysUntilRelease}일 후 발인`;
          return `<tr>
            <td><b>${escHtml(u.hallName)}</b></td>
            <td>${escHtml(u.deceasedName) || "-"}</td>
            <td class="nowrap">${escHtml(u.funeralDate) || "-"} ${escHtml(u.funeralTime)}</td>
            <td>${rel}</td>
          </tr>`;
        })
        .join("");
      if (rows) {
        head += `<table class="tbl" style="margin-top:12px"><thead><tr>
          <th>규격</th><th>고인</th><th>발인</th><th>예상 공실</th>
        </tr></thead><tbody>${rows}</tbody></table>`;
      }
    }
    head += "</div>";
    return head;
  }

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
      <th>빈소</th><th style="width:90px">상태</th><th>고인</th><th>상주</th><th>발인</th><th>장지</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }

  // 빈소 찾기 (검색)
  if (searchArea) {
    searchArea.innerHTML = `
      <div class="btn-row" style="margin-bottom:16px">
        <input id="hq" placeholder="고인명 또는 상주명, 빈소 규격 검색" style="flex:1;min-width:200px;padding:11px 13px;border:1px solid var(--line);border-radius:8px" />
        <button class="pill-btn" id="hqBtn" style="background:var(--navy);color:#fff;border-color:var(--navy)">검색</button>
      </div>
      <div id="hqResult"><div class="dyn-loading">현재 사용 중인 빈소를 불러옵니다…</div></div>`;
    const result = document.getElementById("hqResult");
    async function loadDefault() {
      try {
        const [usageRes, availRes] = await Promise.all([
          API.get("/halls?status=in-use"),
          API.get("/halls/availability"),
        ]);
        result.innerHTML = availabilityPanel(availRes) + hallRows(usageRes.items);
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
    Promise.all([API.get("/halls"), API.get("/halls/availability")])
      .then(([usage, avail]) => {
        statusArea.innerHTML = availabilityPanel(avail) + hallRows(usage.items);
      })
      .catch((e) => { statusArea.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`; });
  }
});

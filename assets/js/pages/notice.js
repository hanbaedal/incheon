/* 알림 소식 - 목록/상세 (백엔드 연동) */
onSiteReady(function () {
  const area = document.getElementById("noticeArea");
  if (!area) return;

  async function loadList() {
    area.innerHTML = '<div class="dyn-loading">불러오는 중…</div>';
    try {
      const d = await API.get("/notices?limit=50");
      if (!d.items.length) {
        area.innerHTML = '<div class="dyn-empty">등록된 소식이 없습니다.</div>';
        return;
      }
      const rows = d.items
        .map(
          (n, idx) => `<tr class="row-link" data-id="${n.id}">
            <td>${n.pinned ? "📌" : d.total - idx}</td>
            <td>${escHtml(n.title)}</td>
            <td class="nowrap">${fmtDay(n.createdAt)}</td></tr>`
        )
        .join("");
      area.innerHTML = `<table class="tbl"><thead><tr>
        <th style="width:70px">번호</th><th>제목</th><th style="width:130px">등록일</th>
        </tr></thead><tbody>${rows}</tbody></table>`;
      area.querySelectorAll("[data-id]").forEach((tr) =>
        tr.addEventListener("click", () => detail(tr.getAttribute("data-id")))
      );
    } catch (e) {
      area.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`;
    }
  }

  async function detail(id) {
    area.innerHTML = '<div class="dyn-loading">불러오는 중…</div>';
    try {
      const d = await API.get("/notices/" + id);
      const n = d.notice;
      area.innerHTML = `
        <h3 style="margin:0 0 6px;font-size:20px">${escHtml(n.title)}</h3>
        <p style="margin:0 0 16px;color:#6b7280;font-size:13.5px">${escHtml(n.category)} · ${fmtDay(n.createdAt)} · 조회 ${n.views}</p>
        <div class="detail-box">${escHtml(n.content)}</div>
        <div class="btn-row" style="margin-top:18px"><button class="pill-btn" id="backBtn">← 목록으로</button></div>`;
      document.getElementById("backBtn").addEventListener("click", loadList);
    } catch (e) {
      area.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`;
    }
  }

  loadList();
});

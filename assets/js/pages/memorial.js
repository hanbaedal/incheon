/* 온라인 추모 - 빈소별 추모글 열람/작성 */
onSiteReady(function () {
  const cyberArea = document.getElementById("cyberArea");
  const writeArea = document.getElementById("memWriteArea");

  async function inUseHalls() {
    const d = await API.get("/halls?status=in-use");
    return d.items;
  }

  function hallOptions(items) {
    return items
      .map((h) => `<option value="${h.id}">${escHtml(h.hallNumber)}${h.deceasedName ? " - 故 " + escHtml(h.deceasedName) : ""}</option>`)
      .join("");
  }

  /* 온라인 추모(cyber.html): 빈소 목록 → 추모글 열람 + 작성 */
  if (cyberArea) {
    cyberArea.innerHTML = '<div class="dyn-loading">불러오는 중…</div>';
    inUseHalls()
      .then((halls) => {
        if (!halls.length) {
          cyberArea.innerHTML = '<div class="dyn-empty">현재 운영 중인 빈소가 없습니다.</div>';
          return;
        }
        cyberArea.innerHTML = `
          <div class="form-field"><label>추모하실 빈소를 선택하세요</label>
            <select id="c_hall">${hallOptions(halls)}</select></div>
          <div id="c_tributes"></div>`;
        const sel = document.getElementById("c_hall");
        sel.addEventListener("change", () => renderHall(sel.value));
        renderHall(sel.value);
      })
      .catch((e) => { cyberArea.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`; });

    async function renderHall(hallId) {
      const box = document.getElementById("c_tributes");
      box.innerHTML = '<div class="dyn-loading">추모글을 불러옵니다…</div>';
      try {
        const d = await API.get("/memorials?hallId=" + hallId);
        const list = d.items.length
          ? d.items
              .map(
                (m) => `<div class="block" style="padding:18px 20px;margin-bottom:12px">
                  <p style="margin:0 0 6px;color:#6b7280;font-size:13px"><b style="color:var(--navy)">${escHtml(m.author)}</b>${m.relation ? " · " + escHtml(m.relation) : ""} · ${fmtDay(m.createdAt)}</p>
                  <p style="margin:0;white-space:pre-wrap;line-height:1.8">${escHtml(m.message)}</p></div>`
              )
              .join("")
          : '<div class="dyn-empty">첫 번째 추모의 글을 남겨주세요.</div>';
        box.innerHTML = `
          <div class="btn-row" style="justify-content:flex-end;margin:8px 0 16px">
            <button class="pill-btn" id="openWrite" style="background:var(--gold);color:#fff;border-color:var(--gold)">추모글 작성</button>
          </div>
          <div id="writeForm"></div>
          ${list}`;
        document.getElementById("openWrite").addEventListener("click", () => showForm(hallId, box));
      } catch (e) { box.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`; }
    }

    function showForm(hallId, box) {
      const wrap = document.getElementById("writeForm");
      wrap.innerHTML = writeFormHtml();
      bindForm(wrap, () => hallId, () => renderHall(hallId));
    }
  }

  /* 추모글 남기기(write.html): 빈소 선택 + 작성 */
  if (writeArea) {
    writeArea.innerHTML = '<div class="dyn-loading">불러오는 중…</div>';
    inUseHalls()
      .then((halls) => {
        if (!halls.length) {
          writeArea.innerHTML = '<div class="dyn-empty">현재 운영 중인 빈소가 없습니다.</div>';
          return;
        }
        writeArea.innerHTML = `
          <div class="form-field"><label>빈소 선택 *</label><select id="w_hall">${hallOptions(halls)}</select></div>
          ${writeFormHtml()}`;
        bindForm(writeArea, () => document.getElementById("w_hall").value, () => {
          alert("추모의 글이 등록되었습니다.");
          location.href = "cyber.html";
        });
      })
      .catch((e) => { writeArea.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`; });
  }

  function writeFormHtml() {
    return `
      <div class="block" style="background:var(--bg-soft)">
        <div class="form-grid2">
          <div class="form-field"><label>작성자 *</label><input id="m_author" /></div>
          <div class="form-field"><label>고인과의 관계</label><input id="m_relation" placeholder="예: 지인, 동료" /></div>
        </div>
        <div class="form-field"><label>추모의 글 *</label><textarea id="m_message" placeholder="삼가 고인의 명복을 빕니다."></textarea></div>
        <div class="form-field" style="max-width:260px"><label>비밀번호 <span style="color:#6b7280;font-weight:400">(수정·삭제용)</span></label><input id="m_password" type="password" /></div>
        <div class="btn-row">
          <button class="pill-btn" id="m_submit" style="background:var(--navy);color:#fff;border-color:var(--navy)">추모글 등록</button>
        </div>
        <p class="form-msg" id="m_msg"></p>
      </div>`;
  }

  function bindForm(scope, getHallId, onDone) {
    scope.querySelector("#m_submit").addEventListener("click", async () => {
      const msg = scope.querySelector("#m_msg");
      msg.className = "form-msg";
      const body = {
        hallId: getHallId(),
        author: scope.querySelector("#m_author").value.trim(),
        relation: scope.querySelector("#m_relation").value.trim(),
        message: scope.querySelector("#m_message").value.trim(),
        password: scope.querySelector("#m_password").value,
      };
      if (!body.hallId || !body.author || !body.message) {
        msg.className = "form-msg err"; msg.textContent = "빈소, 작성자, 추모 내용을 입력해 주세요."; return;
      }
      try {
        await API.post("/memorials", body);
        onDone();
      } catch (e) { msg.className = "form-msg err"; msg.textContent = e.message; }
    });
  }
});

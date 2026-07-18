/* 온라인 문의 - 목록/작성/열람(비공개 비밀번호) */
onSiteReady(function () {
  const area = document.getElementById("inqArea");
  if (!area) return;

  const CATS = ["일반문의", "빈소문의", "장례절차", "요금문의", "기타"];

  function stTag(s) {
    if (s === "answered") return '<span class="st st-answered">답변완료</span>';
    if (s === "closed") return '<span class="st st-gray">종료</span>';
    return '<span class="st st-pending">답변대기</span>';
  }

  async function loadList() {
    area.innerHTML = '<div class="dyn-loading">불러오는 중…</div>';
    try {
      const d = await API.get("/inquiries?limit=50");
      const rows = d.items.length
        ? d.items
            .map(
              (i) => `<tr class="row-link" data-id="${i.id}" data-private="${i.isPrivate ? 1 : 0}">
                <td>${stTag(i.status)}</td>
                <td>${i.isPrivate ? "🔒 " : ""}${escHtml(i.title)}</td>
                <td class="nowrap">${escHtml(i.name)}</td>
                <td class="nowrap">${fmtDay(i.createdAt)}</td></tr>`
            )
            .join("")
        : '';
      area.innerHTML = `
        <div class="btn-row" style="justify-content:flex-end;margin-bottom:14px">
          <button class="pill-btn" id="writeBtn" style="background:var(--navy);color:#fff;border-color:var(--navy)">문의 작성</button>
        </div>
        ${d.items.length ? `<table class="tbl"><thead><tr>
          <th style="width:100px">상태</th><th>제목</th><th style="width:110px">작성자</th><th style="width:120px">등록일</th>
          </tr></thead><tbody>${rows}</tbody></table>` : '<div class="dyn-empty">등록된 문의가 없습니다.</div>'}`;
      document.getElementById("writeBtn").addEventListener("click", showWrite);
      area.querySelectorAll("[data-id]").forEach((tr) =>
        tr.addEventListener("click", () =>
          openItem(tr.getAttribute("data-id"), tr.getAttribute("data-private") === "1")
        )
      );
    } catch (e) {
      area.innerHTML = `<div class="dyn-empty">${escHtml(e.message)}</div>`;
    }
  }

  function showWrite() {
    area.innerHTML = `
      <h3 style="margin:0 0 16px;font-size:19px">온라인 문의 작성</h3>
      <div class="form-grid2">
        <div class="form-field"><label>이름 *</label><input id="i_name" /></div>
        <div class="form-field"><label>연락처</label><input id="i_phone" placeholder="예: 010-0000-0000" /></div>
      </div>
      <div class="form-grid2">
        <div class="form-field"><label>이메일</label><input id="i_email" /></div>
        <div class="form-field"><label>분류</label><select id="i_category">${CATS.map((c) => `<option>${c}</option>`).join("")}</select></div>
      </div>
      <div class="form-field"><label>제목 *</label><input id="i_title" /></div>
      <div class="form-field"><label>내용 *</label><textarea id="i_message"></textarea></div>
      <div class="form-grid2">
        <div class="form-field"><label class="form-check"><input type="checkbox" id="i_private" /> 비공개 문의</label></div>
        <div class="form-field"><label>비밀번호 <span style="color:#6b7280;font-weight:400">(비공개글 확인용)</span></label><input id="i_password" type="password" /></div>
      </div>
      <div class="btn-row">
        <button class="pill-btn" id="submitBtn" style="background:var(--gold);color:#fff;border-color:var(--gold)">등록</button>
        <button class="pill-btn" id="cancelBtn">취소</button>
      </div>
      <p class="form-msg" id="i_msg"></p>`;
    document.getElementById("cancelBtn").addEventListener("click", loadList);
    document.getElementById("submitBtn").addEventListener("click", submit);
  }

  async function submit() {
    const msg = document.getElementById("i_msg");
    msg.className = "form-msg";
    const body = {
      name: document.getElementById("i_name").value.trim(),
      phone: document.getElementById("i_phone").value.trim(),
      email: document.getElementById("i_email").value.trim(),
      category: document.getElementById("i_category").value,
      title: document.getElementById("i_title").value.trim(),
      message: document.getElementById("i_message").value.trim(),
      isPrivate: document.getElementById("i_private").checked,
      password: document.getElementById("i_password").value,
    };
    if (!body.name || !body.title || !body.message) {
      msg.className = "form-msg err"; msg.textContent = "이름, 제목, 내용을 입력해 주세요."; return;
    }
    try {
      await API.post("/inquiries", body);
      alert("문의가 등록되었습니다. 확인 후 답변드리겠습니다.");
      loadList();
    } catch (e) {
      msg.className = "form-msg err"; msg.textContent = e.message;
    }
  }

  async function openItem(id, isPrivate) {
    if (isPrivate) {
      const pw = prompt("비공개 문의입니다. 작성 시 입력한 비밀번호를 입력하세요.");
      if (pw === null) return;
      view(id, pw);
    } else {
      view(id, "");
    }
  }

  async function view(id, password) {
    area.innerHTML = '<div class="dyn-loading">불러오는 중…</div>';
    try {
      const d = await API.post("/inquiries/" + id + "/view", { password });
      const i = d.inquiry;
      area.innerHTML = `
        <h3 style="margin:0 0 6px;font-size:19px">${escHtml(i.title)}</h3>
        <p style="margin:0 0 16px;color:#6b7280;font-size:13.5px">${escHtml(i.category)} · ${escHtml(i.name)} · ${fmtDay(i.createdAt)} · ${stTag(i.status)}</p>
        <div class="detail-box">${escHtml(i.message)}</div>
        ${i.answer ? `<div class="answer-box"><strong>답변</strong><br/>${escHtml(i.answer)}</div>` : ""}
        <div class="btn-row" style="margin-top:18px"><button class="pill-btn" id="backBtn">← 목록으로</button></div>`;
      document.getElementById("backBtn").addEventListener("click", loadList);
    } catch (e) {
      alert(e.message);
      loadList();
    }
  }

  loadList();
});

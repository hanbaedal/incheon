"use strict";

let CMS_SLOTS = {};
let CMS_ACTIVE_KEY = null;
let CMS_EDIT_LANG = "ko";

function cmsSlotMapForLang(lang) {
  const slots = {};
  Object.keys(CMS_SLOTS).forEach((key) => {
    const it = CMS_SLOTS[key];
    if (!it) return;
    const v = lang === "zh" ? it.valueZh : lang === "en" ? it.valueEn : it.valueKo;
    if (v) slots[key] = v;
  });
  const alt = CMS_SLOTS["hero.ehaneulAlt"];
  if (alt) {
    const av = lang === "zh" ? alt.valueZh : lang === "en" ? alt.valueEn : alt.valueKo;
    if (av) slots["hero.ehaneulImg_alt"] = av;
  }
  return slots;
}

function injectCmsFrameStyles(doc) {
  if (!doc || doc.getElementById("cmsEditStyle")) return;
  const st = doc.createElement("style");
  st.id = "cmsEditStyle";
  st.textContent = `
    [data-cms-key].cms-editable-slot { cursor: pointer; outline: 2px dashed transparent; outline-offset: 2px; transition: outline-color .15s; }
    [data-cms-key].cms-editable-slot:hover { outline-color: #b99247; background: rgba(185,146,71,.08); }
    [data-cms-key].cms-slot-active { outline: 2px solid #1f2a44; background: rgba(31,42,68,.06); }
  `;
  doc.head.appendChild(st);
}

function wireCmsFrame(frame) {
  const doc = frame.contentDocument;
  if (!doc) return;
  injectCmsFrameStyles(doc);
  doc.querySelectorAll("[data-cms-key]").forEach((el) => {
    if (el._cmsBound) return;
    el._cmsBound = true;
    el.classList.add("cms-editable-slot");
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectCmsSlot(el.getAttribute("data-cms-key"), el);
    });
  });
  if (typeof window.cmsHydrate === "function") {
    window.cmsHydrate({ root: doc, page: "home", lang: CMS_EDIT_LANG, slots: cmsSlotMapForLang(CMS_EDIT_LANG) });
  }
}

function selectCmsSlot(key, elInFrame) {
  CMS_ACTIVE_KEY = key;
  const frame = document.getElementById("cmsFrame");
  if (frame && frame.contentDocument) {
    frame.contentDocument.querySelectorAll(".cms-slot-active").forEach((x) => x.classList.remove("cms-slot-active"));
  }
  if (elInFrame) elInFrame.classList.add("cms-slot-active");
  renderCmsPanel();
}

function renderCmsPanel() {
  const host = document.getElementById("cmsPanelBody");
  if (!host) return;
  const it = CMS_SLOTS[CMS_ACTIVE_KEY];
  if (!it) {
    host.innerHTML = '<p class="orders-lead">홈페이지와 동일한 화면에서 <strong>문구·이미지</strong>를 클릭하세요.</p>';
    return;
  }
  const readOnly = !canWrite();
  const type = it.type || "text";
  host.innerHTML = `
    <p class="muted" style="margin:0 0 8px;font-size:12px">${esc(it.label || it.key)} <code>${esc(it.key)}</code></p>
    <div class="cms-lang-tabs">
      <button type="button" class="cms-lang-tab ${CMS_EDIT_LANG === "ko" ? "active" : ""}" data-lang="ko">한국어</button>
      <button type="button" class="cms-lang-tab ${CMS_EDIT_LANG === "zh" ? "active" : ""}" data-lang="zh">中文</button>
      <button type="button" class="cms-lang-tab ${CMS_EDIT_LANG === "en" ? "active" : ""}" data-lang="en">English</button>
    </div>
    ${type === "image" ? `
      <div class="field"><label>이미지 URL</label>
        <input id="cms_val" value="${esc(it.valueKo || "")}" ${readOnly ? "disabled" : ""} placeholder="assets/... 또는 /api/images/..." />
      </div>
      ${readOnly ? "" : `<div class="field"><label>파일 업로드</label><input type="file" id="cms_imgFile" accept="image/*" /></div>`}
      <div class="field"><label>대체 텍스트(한국어)</label>
        <input id="cms_alt_ko" value="${esc((CMS_SLOTS["hero.ehaneulAlt"] || {}).valueKo || "")}" ${readOnly ? "disabled" : ""} />
      </div>
    ` : `
      <div class="field"><label>내용 (${CMS_EDIT_LANG})</label>
        <textarea id="cms_val" rows="${type === "html" ? 6 : 4}" ${readOnly ? "disabled" : ""}>${esc(
    CMS_EDIT_LANG === "zh" ? it.valueZh : CMS_EDIT_LANG === "en" ? it.valueEn : it.valueKo
  )}</textarea>
      </div>
      ${type === "html" ? '<p class="muted" style="font-size:12px">HTML 허용 (&lt;br&gt; 등)</p>' : ""}
    `}
    ${readOnly ? '<p class="orders-lead">슈퍼바이저는 조회만 가능합니다.</p>' : `
      <button type="button" class="btn btn-primary btn-block" id="cmsSaveBtn">저장</button>`}
  `;

  host.querySelectorAll(".cms-lang-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      CMS_EDIT_LANG = btn.getAttribute("data-lang");
      const frame = document.getElementById("cmsFrame");
      if (frame) wireCmsFrame(frame);
      renderCmsPanel();
    });
  });

  const saveBtn = document.getElementById("cmsSaveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveCmsSlot(it));
  }
  const imgFile = document.getElementById("cms_imgFile");
  if (imgFile) {
    imgFile.addEventListener("change", () => uploadCmsImage(imgFile, it));
  }
}

async function uploadCmsImage(input, it) {
  const file = input.files && input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/images", { method: "POST", credentials: "same-origin", headers: { "X-Session-Scope": "admin" }, body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error((data && data.error) || "업로드 실패");
  document.getElementById("cms_val").value = data.image.url;
  await saveCmsSlot(it, { valueKo: data.image.url, valueZh: data.image.url, valueEn: data.image.url });
  input.value = "";
}

async function saveCmsSlot(it, override) {
  try {
    const body = { type: it.type, label: it.label };
    if (override) Object.assign(body, override);
    else {
      const val = document.getElementById("cms_val").value;
      if (CMS_EDIT_LANG === "ko") body.valueKo = val;
      else if (CMS_EDIT_LANG === "zh") body.valueZh = val;
      else body.valueEn = val;
      if (it.type === "image") {
        body.valueKo = val;
        body.valueZh = val;
        body.valueEn = val;
        const altKo = document.getElementById("cms_alt_ko");
        if (altKo && CMS_SLOTS["hero.ehaneulAlt"]) {
          await api("/cms/admin/home/hero.ehaneulAlt", {
            method: "PUT",
            body: { type: "text", label: CMS_SLOTS["hero.ehaneulAlt"].label, valueKo: altKo.value.trim(), valueZh: altKo.value.trim(), valueEn: altKo.value.trim() },
          });
        }
      }
    }
    const res = await api("/cms/admin/home/" + encodeURIComponent(it.key), { method: "PUT", body });
    CMS_SLOTS[it.key] = res.item;
    toast("저장되었습니다.");
    const frame = document.getElementById("cmsFrame");
    if (frame) wireCmsFrame(frame);
    if (CMS_ACTIVE_KEY === it.key && frame && frame.contentDocument) {
      const el = frame.contentDocument.querySelector('[data-cms-key="' + CSS.escape(it.key) + '"]');
      if (el) el.classList.add("cms-slot-active");
    }
    renderCmsPanel();
  } catch (e) {
    toast(e.message);
  }
}

async function renderHomeCms() {
  const d = await api("/cms/admin/home");
  CMS_SLOTS = {};
  (d.items || []).forEach((it) => { CMS_SLOTS[it.key] = it; });
  CMS_ACTIVE_KEY = null;
  CMS_EDIT_LANG = "ko";

  content.innerHTML = `
    <p class="orders-lead">실제 홈페이지(<code>/index.html</code>)와 동일한 배치입니다. 편집할 문구·이미지를 <strong>클릭</strong>한 뒤 오른쪽에서 수정하세요.</p>
    <div class="cms-layout">
      <div class="cms-preview-wrap">
        <div class="cms-preview-toolbar">
          <span class="muted">미리보기 언어</span>
          <select id="cmsPreviewLang">
            <option value="ko">한국어</option>
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
          <a class="btn btn-sm" href="/" target="_blank" rel="noopener">공개 홈 새 창</a>
        </div>
        <iframe id="cmsFrame" class="cms-frame" title="홈페이지 미리보기" src="/index.html"></iframe>
      </div>
      <aside class="cms-panel" id="cmsPanel">
        <div class="cms-panel-head"><strong>슬롯 편집</strong></div>
        <div class="cms-panel-body" id="cmsPanelBody"></div>
      </aside>
    </div>`;

  const frame = document.getElementById("cmsFrame");
  const langSel = document.getElementById("cmsPreviewLang");
  langSel.addEventListener("change", () => {
    CMS_EDIT_LANG = langSel.value;
    wireCmsFrame(frame);
    renderCmsPanel();
  });

  frame.addEventListener("load", () => wireCmsFrame(frame));
  renderCmsPanel();
}
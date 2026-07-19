"use strict";

async function renderMemberFormsPanel() {
  const body = document.getElementById("infoPanelBody");
  if (!body) return;
  body.innerHTML = `<div class="state" style="padding:16px 0;font-size:13px">${mEsc(mT("common.loading"))}</div>`;
  let items = [];
  try {
    items = await fetchPublicForms();
  } catch (e) {
    body.innerHTML = `<p class="muted">${mEsc(e.message)}</p>`;
    return;
  }

  body.innerHTML = `
    <p class="info-panel-lead">${mEsc(mT("info.formsLead"))}</p>
    <div class="info-scroll">
      <table class="tbl info-tbl">
        <thead><tr><th>${mEsc(mT("info.formsCol"))}</th><th class="right">${mEsc(mT("common.download"))}</th></tr></thead>
        <tbody>${items.length ? items.map((f) => `
          <tr>
            <td>${mEsc(f.name)}</td>
            <td class="right nowrap">${f.downloadUrl
              ? `<a class="info-link" href="${mEsc(f.downloadUrl)}" download>${mEsc(mT("common.download"))}</a>`
              : `<span class="muted">${mEsc(mT("common.preparing"))}</span>`}</td>
          </tr>`).join("") : `<tr><td colspan="2">${mEsc(mT("common.none"))}</td></tr>`}
        </tbody>
      </table>
    </div>
    <p class="info-panel-note" data-mi18n="info.formsNote" data-mi18n-html="1">${mT("info.formsNote")}</p>`;
}

function renderMemberFacilityPanel() {
  return `
    <p class="info-panel-lead">${mEsc(mT("info.facilityLead"))}</p>
    <ul class="info-facility-list">${mFacilityItems().map((f) => `
      <li>
        <a href="${mEsc(f.href)}" target="_blank" rel="noopener">
          <b>${mEsc(f.title)}</b>
          <span>${mEsc(f.desc)}</span>
        </a>
      </li>`).join("")}
    </ul>
    <p class="info-panel-note" data-mi18n="info.facilityNote" data-mi18n-html="1">${mT("info.facilityNote")}</p>`;
}

function initMemberInfoPanel(activeTab) {
  const body = document.getElementById("infoPanelBody");
  const tabs = document.querySelectorAll("[data-info-tab]");
  if (!body || !tabs.length) return;

  async function show(tab) {
    tabs.forEach((t) => t.classList.toggle("active", t.getAttribute("data-info-tab") === tab));
    if (tab === "facility") body.innerHTML = renderMemberFacilityPanel();
    else await renderMemberFormsPanel();
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => show(t.getAttribute("data-info-tab")));
  });
  show(activeTab || "forms");
}

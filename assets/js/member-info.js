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

function renderMemberObituaryPanel() {
  return `
    <p class="info-panel-lead">${mEsc(mT("info.obituaryLead"))}</p>
    <div class="guide-block">
      <h4 class="section-h4">${mEsc(mT("info.obituaryStepsTitle"))}</h4>
      <ol class="guide-steps">
        <li><strong>${mEsc(mT("info.obituaryStep1"))}</strong><span>${mEsc(mT("info.obituaryStep1d"))}</span></li>
        <li><strong>${mEsc(mT("info.obituaryStep2"))}</strong><span>${mEsc(mT("info.obituaryStep2d"))}</span></li>
        <li><strong>${mEsc(mT("info.obituaryStep3"))}</strong><span>${mEsc(mT("info.obituaryStep3d"))}</span></li>
        <li><strong>${mEsc(mT("info.obituaryStep4"))}</strong><span>${mEsc(mT("info.obituaryStep4d"))}</span></li>
      </ol>
    </div>
    <div class="guide-block">
      <h4 class="section-h4">${mEsc(mT("info.obituarySampleTitle"))}</h4>
      <div class="guide-sample">
        <p>${mEsc(mT("info.obituarySample"))}</p>
        <p>${mEsc(mT("info.obituarySampleHall"))}</p>
        <p>${mEsc(mT("info.obituarySampleDate"))}</p>
        <p>${mEsc(mT("info.obituarySampleSite"))}</p>
        <p>${mEsc(mT("info.obituarySampleChief"))}</p>
      </div>
      <ul class="guide-dots">
        <li>${mEsc(mT("info.obituaryNote1"))}</li>
        <li>${mEsc(mT("info.obituaryNote2"))}</li>
      </ul>
    </div>`;
}

function initMemberInfoPanel(activeTab) {
  const body = document.getElementById("infoPanelBody");
  const tabs = document.querySelectorAll("[data-info-tab]");
  if (!body || !tabs.length) return;

  async function show(tab) {
    tabs.forEach((t) => t.classList.toggle("active", t.getAttribute("data-info-tab") === tab));
    if (tab === "facility") body.innerHTML = renderMemberFacilityPanel();
    else if (tab === "obituary") body.innerHTML = renderMemberObituaryPanel();
    else await renderMemberFormsPanel();
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => show(t.getAttribute("data-info-tab")));
  });
  show(activeTab || "forms");
}

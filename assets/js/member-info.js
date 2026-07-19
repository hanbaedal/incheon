"use strict";

const MEMBER_FACILITIES = [
  {
    title: "화장장 안내",
    desc: "인천가족공원(승화원) 및 e하늘 예약 안내",
    href: "/pages/support/crematory.html",
  },
  {
    title: "납골당 안내",
    desc: "봉안시설(납골당) 안치 안내",
    href: "/pages/support/columbarium.html",
  },
  {
    title: "공원묘지 안내",
    desc: "매장·자연장 장지 안내",
    href: "/pages/support/cemetery.html",
  },
  {
    title: "빈소·접객 안내",
    desc: "빈소 규격 및 접객 시설",
    href: "/pages/guide/binso.html",
  },
  {
    title: "장례 진행 시설",
    desc: "안치실·염습실·발인 준비 공간",
    href: "/pages/guide/annex.html",
  },
  {
    title: "주차 안내",
    desc: "조문객·유가족 주차 안내",
    href: "/pages/hall/parking.html",
  },
];

async function renderMemberFormsPanel() {
  const body = document.getElementById("infoPanelBody");
  if (!body) return;
  body.innerHTML = '<div class="state" style="padding:16px 0;font-size:13px">불러오는 중…</div>';
  let items = [];
  try {
    items = await fetchPublicForms();
  } catch (e) {
    body.innerHTML = `<p class="muted">${mEsc(e.message)}</p>`;
    return;
  }

  body.innerHTML = `
    <p class="info-panel-lead">장례와 관련된 행정업무에 필요한 각종 서식을 다운로드하실 수 있습니다.</p>
    <div class="info-scroll">
      <table class="tbl info-tbl">
        <thead><tr><th>서식명</th><th class="right">다운로드</th></tr></thead>
        <tbody>${items.length ? items.map((f) => `
          <tr>
            <td>${mEsc(f.name)}</td>
            <td class="right nowrap">${f.downloadUrl
              ? `<a class="info-link" href="${mEsc(f.downloadUrl)}" download>받기</a>`
              : '<span class="muted">준비중</span>'}</td>
          </tr>`).join("") : '<tr><td colspan="2">등록된 서식이 없습니다.</td></tr>'}
        </tbody>
      </table>
    </div>
    <p class="info-panel-note">전체 목록은 <a href="/pages/info/forms.html" target="_blank" rel="noopener">서식 자료실</a>에서도 확인할 수 있습니다.</p>`;
}

function renderMemberFacilityPanel() {
  return `
    <p class="info-panel-lead">화장·납골·장지 및 장례식장 부대시설 안내입니다.</p>
    <ul class="info-facility-list">${MEMBER_FACILITIES.map((f) => `
      <li>
        <a href="${mEsc(f.href)}" target="_blank" rel="noopener">
          <b>${mEsc(f.title)}</b>
          <span>${mEsc(f.desc)}</span>
        </a>
      </li>`).join("")}
    </ul>
    <p class="info-panel-note">상담: <b>032-524-4444</b> (24시간)</p>`;
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

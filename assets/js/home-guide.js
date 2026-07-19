(function () {
  "use strict";

  var DATA = {
    ko: {
      pickTitle: "빈소 평형을 선택해 주세요",
      pickLead: "인천병원장례식장(인천중앙병원장례식장) 관련 맞춤 안내를 위해 몇 가지 질문을 드립니다.",
      options: {
        "35": { label: "35평형", sub: "소규모 가족장" },
        "50": { label: "50평형", sub: "실속형" },
        "80": { label: "80평형", sub: "프리미엄" },
        none: { label: "무빈소", sub: "빈소 없이 진행" },
      },
      results: {
        "35": {
          title: "35평형 · 소규모 가족장",
          lead: "가까운 가족과 지인 중심의 작은 장례에 적합한 규모입니다.",
          items: [
            "조문객 50명 내외, 2~3일 빈소 운영에 알맞습니다.",
            "접객 음식·화환·장례 물품을 간소하게 구성할 수 있습니다.",
            "유가족 휴게 공간과 기본 제단 시설을 이용하실 수 있습니다.",
          ],
        },
        "50": {
          title: "50평형 · 실속형",
          lead: "가족·지인 조문을 실속 있게 준비하기에 가장 많이 선택하는 규모입니다.",
          items: [
            "조문객 80~100명 내외 수용에 적합합니다.",
            "제단·접객·화환 구성을 균형 있게 준비할 수 있습니다.",
            "빈소 운영 기간과 비용을 합리적으로 조절하기 좋습니다.",
          ],
        },
        "80": {
          title: "80평형 · 프리미엄",
          lead: "많은 조문객을 넉넉히 맞이하는 넓은 빈소가 필요할 때 추천드립니다.",
          items: [
            "조문객 120명 이상, 넓은 접객 공간이 필요한 경우에 적합합니다.",
            "프리미엄 제단·화환·전용 휴게 공간 구성이 가능합니다.",
            "장례식장 빈소 3개 중 가장 넓은 규모로 상담해 드립니다.",
          ],
        },
        none: {
          title: "무빈소 · 빈소 없이 진행",
          lead: "장례식장 빈소 없이 영안실·자택·교회 등에서 간소하게 진행하는 방식입니다.",
          items: [
            "화장·발인·운구 등 필수 절차 위주로 상담해 드립니다.",
            "관·수의·운구차 등 필요한 장례 물품만 선택하실 수 있습니다.",
            "진행 장소와 일정에 맞춰 맞춤 절차를 안내해 드립니다.",
          ],
        },
      },
      resultLabel: "맞춤 안내",
      retry: "다시 선택",
      consult: "전화 상담",
      links: {
        rooms: "빈소·객실 정보",
        process: "장례 진행 절차",
        qna: "온라인 문의",
      },
    },
    zh: {
      pickTitle: "请选择灵堂坪数",
      pickLead: "为提供仁川医院殡仪馆(仁川中央医院殡仪馆)的个性化指南，请先回答以下问题。",
      options: {
        "35": { label: "35坪", sub: "小型家庭葬礼" },
        "50": { label: "50坪", sub: "实惠型" },
        "80": { label: "80坪", sub: "高端型" },
        none: { label: "无灵堂", sub: "不设灵堂进行" },
      },
      results: {
        "35": {
          title: "35坪 · 小型家庭葬礼",
          lead: "适合以近亲好友为主的小型葬礼。",
          items: ["吊唁宾客约50人，适合2~3天灵堂运营。", "可精简餐饮、花圈及殡葬用品。", "可使用家属休息空间及基本祭坛设施。"],
        },
        "50": {
          title: "50坪 · 实惠型",
          lead: "兼顾亲友吊唁与合理预算，是最常选择的规模。",
          items: ["适合约80~100名吊唁宾客。", "祭坛、餐饮、花圈可均衡配置。", "便于调节灵堂使用期间与费用。"],
        },
        "80": {
          title: "80坪 · 高端型",
          lead: "需要宽敞灵堂、接待较多吊唁宾客时推荐。",
          items: ["适合120名以上吊唁宾客。", "可配置高端祭坛、花圈及专用休息空间。", "为本馆3间灵堂中最大规模。"],
        },
        none: {
          title: "无灵堂 · 不设灵堂进行",
          lead: "不在殡仪馆设灵堂，于停灵室、自宅、教会等地简办。",
          items: ["以火葬、出殡、运灵等必要程序为主咨询。", "可按需选择棺木、寿衣、灵车等用品。", "根据举行地点与日程提供定制流程。"],
        },
      },
      resultLabel: "个性化指南",
      retry: "重新选择",
      consult: "电话咨询",
      links: { rooms: "灵堂·客室信息", process: "殡葬流程", qna: "在线咨询" },
    },
    en: {
      pickTitle: "Choose a hall size",
      pickLead: "To provide tailored guidance for Incheon Hospital Funeral Hall, please answer a few questions.",
      options: {
        "35": { label: "35 pyeong", sub: "Small family service" },
        "50": { label: "50 pyeong", sub: "Value option" },
        "80": { label: "80 pyeong", sub: "Premium" },
        none: { label: "No hall", sub: "Without a funeral hall" },
      },
      results: {
        "35": {
          title: "35 pyeong · Small family service",
          lead: "Suited to an intimate service centered on close family and friends.",
          items: [
            "About 50 visitors; typically 2–3 days in the hall.",
            "Catering, wreaths, and supplies can be kept simple.",
            "Family rest areas and a standard altar are available.",
          ],
        },
        "50": {
          title: "50 pyeong · Value option",
          lead: "Our most popular size for a balanced, practical arrangement.",
          items: [
            "Suited to about 80–100 visitors.",
            "Altar, catering, and wreaths can be arranged evenly.",
            "Easier to manage duration and overall cost.",
          ],
        },
        "80": {
          title: "80 pyeong · Premium",
          lead: "Recommended when you need a spacious hall for many visitors.",
          items: [
            "Suited to 120+ visitors with generous reception space.",
            "Premium altar, wreaths, and private family rooms available.",
            "The largest of our three funeral halls.",
          ],
        },
        none: {
          title: "No hall · Without a funeral hall",
          lead: "A simplified service without a hall at the funeral home.",
          items: [
            "We guide essential steps such as cremation, procession, and transfer.",
            "Choose only the supplies you need (coffin, shroud, hearse, etc.).",
            "Custom guidance based on your venue and schedule.",
          ],
        },
      },
      resultLabel: "Your guide",
      retry: "Choose again",
      consult: "Call us",
      links: { rooms: "Halls & rooms", process: "Funeral process", qna: "Online inquiry" },
    },
  };

  function lang() {
    var l = document.documentElement.lang || "ko";
    return DATA[l] ? l : "ko";
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function renderPick(root, d) {
    var pick = root.querySelector("#guideStepPick");
    var result = root.querySelector("#guideStepResult");
    if (!pick || !result) return;

    pick.hidden = false;
    result.hidden = true;
    pick.querySelector(".guide-title").textContent = d.pickTitle;
    pick.querySelector(".guide-lead").textContent = d.pickLead;

    pick.querySelectorAll(".size-option").forEach(function (btn) {
      var key = btn.getAttribute("data-size");
      var opt = d.options[key];
      if (!opt) return;
      btn.querySelector("strong").textContent = opt.label;
      btn.querySelector("span").textContent = opt.sub;
      btn.classList.remove("is-active");
    });
  }

  function renderResult(root, d, key) {
    var pick = root.querySelector("#guideStepPick");
    var result = root.querySelector("#guideStepResult");
    var info = d.results[key];
    if (!pick || !result || !info) return;

    pick.hidden = true;
    result.hidden = false;

    result.querySelector(".guide-result-tag").textContent = d.resultLabel;
    result.querySelector(".guide-result-title").textContent = info.title;
    result.querySelector(".guide-result-lead").textContent = info.lead;
    result.querySelector(".guide-result-list").innerHTML = info.items
      .map(function (item) { return "<li>" + esc(item) + "</li>"; })
      .join("");

    result.querySelector(".guide-link-rooms").textContent = d.links.rooms;
    result.querySelector(".guide-link-process").textContent = d.links.process;
    result.querySelector(".guide-link-qna").textContent = d.links.qna;
    result.querySelector(".guide-retry").textContent = d.retry;
    result.querySelector(".guide-consult").textContent = d.consult;
  }

  function init() {
    var root = document.getElementById("hallSizeGuide");
    if (!root) return;

    var d = DATA[lang()];

    root.querySelectorAll(".size-option").forEach(function (btn) {
      btn.onclick = function () {
        root.querySelectorAll(".size-option").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        renderResult(root, d, btn.getAttribute("data-size"));
      };
    });

    var retry = root.querySelector(".guide-retry");
    if (retry) retry.onclick = function () { renderPick(root, d); };

    renderPick(root, d);
  }

  window.initHomeGuide = init;
})();

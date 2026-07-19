/* 근로복지공단 인천병원 장례식장 - 공통 사이트 스크립트 (다국어: 한국어 / 中文 / English)
 * 헤더/GNB/사이드바/브레드크럼/푸터를 단일 메뉴 구성(MENU)으로 렌더링한다.
 * 각 페이지는 window.SITE_BASE 와 window.SITE_PAGE 를 정의한 뒤 이 스크립트를 불러온다.
 * 각 페이지가 window.PAGE_I18N = { zh:"...html...", en:"...html..." } 을 정의하면
 * 해당 언어 선택 시 #pageContent 의 내용을 교체한다. (한국어는 원문 유지)
 */
(function () {
  "use strict";

  var BASE = window.SITE_BASE || "";
  var PAGE = window.SITE_PAGE || {}; // { home:true } 또는 { section:'guide', sub:'rooms' }

  var LANGS = ["ko", "zh", "en"];
  var LANG = "ko";
  try {
    var saved = localStorage.getItem("site_lang");
    if (saved && LANGS.indexOf(saved) !== -1) LANG = saved;
  } catch (e) {}

  // 다국어 텍스트 선택 헬퍼: 객체({ko,zh,en}) 또는 문자열 허용
  function t(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[LANG] != null ? v[LANG] : v.ko;
  }

  var SITE = {
    name: {
      ko: "인천병원장례식장",
      zh: "仁川医院殡仪馆",
      en: "Incheon Hospital Funeral Hall",
    },
    nameEn: "인천중앙병원장례식장",
    tel: "032-524-4444",
    tel24: {
      ko: "24시간 상담 : 032-524-4444",
      zh: "24小时咨询 : 032-524-4444",
      en: "24h Consultation : 032-524-4444",
    },
    address: {
      ko: "인천광역시 부평구 무네미로 446 (구산동, 인천중앙병원)",
      zh: "仁川广域市富平区无内美路446 (九山洞, 仁川中央医院)",
      en: "446 Munaemi-ro, Bupyeong-gu, Incheon (Gusan-dong, Incheon Central Hospital)",
    },
    email: "funeral@kcomwel.or.kr",
  };

  // UI(크롬) 문자열 사전
  var UI = {
    home: { ko: "HOME", zh: "首页", en: "HOME" },
    breadcrumbHome: { ko: "홈", zh: "首页", en: "Home" },
    utilSearch: { ko: "빈소 찾기", zh: "灵堂查询", en: "Find a Hall" },
    utilDirections: { ko: "찾아오시는 길", zh: "交通指南", en: "Directions" },
    utilCyber: { ko: "온라인 추모", zh: "网上吊唁", en: "Online Tribute" },
    utilMember: { ko: "로그인", zh: "登录", en: "Login" },
    consultTitle: { ko: "장례 상담", zh: "殡葬咨询", en: "Consultation" },
    consultDesc: { ko: "연중무휴 24시간 운영", zh: "全年无休 24小时", en: "Open 24/7, year-round" },
    footerCopy: {
      ko: "인천병원장례식장(인천중앙병원장례식장). All rights reserved.",
      zh: "仁川医院殡仪馆(仁川中央医院殡仪馆). 版权所有.",
      en: "Incheon Hospital Funeral Hall (Incheon Central Hospital). All rights reserved.",
    },
    langLabel: { ko: "언어", zh: "语言", en: "Language" },
  };

  var MENU = [
    {
      key: "funeral",
      label: { ko: "장례 절차 안내", zh: "殡葬流程指南", en: "Funeral Guide" },
      href: "pages/funeral/after-death.html",
      children: [
        {
          key: "progress", href: "pages/funeral/after-death.html",
          label: { ko: "장례진행", zh: "殡葬进行", en: "Funeral Progress" },
          children: [
            { key: "afterDeath", href: "pages/funeral/after-death.html", label: { ko: "임종직후", zh: "刚去世时", en: "Right After Passing" } },
            { key: "during", href: "pages/funeral/during.html", label: { ko: "장례진행중", zh: "殡葬进行中", en: "During the Funeral" } },
            { key: "afterProcession", href: "pages/funeral/after-procession.html", label: { ko: "발인직후", zh: "出殡后", en: "After Procession" } },
          ],
        },
        {
          key: "admin", href: "pages/funeral/death-report.html",
          label: { ko: "행정·서류", zh: "行政·文件", en: "Admin & Documents" },
          children: [
            { key: "deathReport", href: "pages/funeral/death-report.html", label: { ko: "사망신고(상속)", zh: "死亡申报(继承)", en: "Death Report" } },
            { key: "day49", href: "pages/funeral/day49.html", label: { ko: "49재", zh: "49祭", en: "49th-Day Rite" } },
          ],
        },
        {
          key: "inheritance", href: "pages/funeral/inheritance-decision.html",
          label: { ko: "상속·세무", zh: "继承·税务", en: "Inheritance & Tax" },
          children: [
            { key: "inheritDecision", href: "pages/funeral/inheritance-decision.html", label: { ko: "상속결정", zh: "继承决定", en: "Inheritance Decision" } },
            { key: "inheritTax", href: "pages/funeral/inheritance-tax.html", label: { ko: "상속세", zh: "继承税", en: "Inheritance Tax" } },
            { key: "acquisitionTax", href: "pages/funeral/acquisition-tax.html", label: { ko: "취득세", zh: "取得税", en: "Acquisition Tax" } },
          ],
        },
      ],
    },
    {
      key: "guide",
      label: { ko: "이용 정보", zh: "使用信息", en: "Guide" },
      href: "pages/guide/rooms.html",
      children: [
        {
          key: "rooms", href: "pages/guide/rooms.html",
          label: { ko: "빈소·객실 정보", zh: "灵堂·客室信息", en: "Halls & Rooms" },
          children: [
            { key: "binso", href: "pages/guide/binso.html", label: { ko: "빈소 소개", zh: "灵堂介绍", en: "Funeral Halls" } },
            { key: "room", href: "pages/guide/room.html", label: { ko: "가족 휴게실", zh: "家属休息室", en: "Family Lounge" } },
          ],
        },
        { key: "exhibition", href: "pages/guide/exhibition.html", label: { ko: "용품 전시관", zh: "用品展示厅", en: "Showroom" } },
        { key: "annex", href: "pages/guide/annex.html", label: { ko: "장례 진행 시설", zh: "殡葬设施", en: "Ceremony Facilities" } },
        { key: "convenience", href: "pages/guide/convenience.html", label: { ko: "편의 공간", zh: "便利设施", en: "Amenities" } },
        { key: "process", href: "pages/guide/process.html", label: { ko: "장례 진행 절차", zh: "殡葬流程", en: "Funeral Process" } },
        { key: "bydeath", href: "pages/guide/bydeath.html", label: { ko: "임종 상황별 안내", zh: "临终情况指南", en: "By Situation" } },
      ],
    },
    {
      key: "service",
      label: { ko: "장례 서비스", zh: "殡葬服务", en: "Services" },
      href: "pages/service/supplies.html",
      children: [
        {
          key: "supplies", href: "pages/service/supplies.html",
          label: { ko: "장례 물품", zh: "殡葬用品", en: "Supplies" },
          children: [
            { key: "coffin", href: "pages/service/coffin.html", label: { ko: "관·횡대", zh: "棺木·横帒", en: "Coffins" } },
            { key: "shroud", href: "pages/service/shroud.html", label: { ko: "수의(壽衣)", zh: "寿衣", en: "Shrouds" } },
            { key: "etc", href: "pages/service/etc.html", label: { ko: "염습·부속 용품", zh: "殓殡·附属用品", en: "Accessories" } },
          ],
        },
        { key: "food", href: "pages/service/food.html", label: { ko: "접객 음식", zh: "待客餐饮", en: "Catering" } },
        { key: "consumables", href: "pages/service/consumables.html", label: { ko: "공산품류", zh: "日用消费品", en: "Consumables" } },
        { key: "flower", href: "pages/service/flower.html", label: { ko: "근조 화환", zh: "花圈花篮", en: "Wreaths" } },
        { key: "photo", href: "pages/service/photo.html", label: { ko: "영정 사진", zh: "遗照制作", en: "Portrait Photo" } },
        { key: "dress", href: "pages/service/dress.html", label: { ko: "상복 대여", zh: "丧服租赁", en: "Mourning Attire" } },
        { key: "hearse", href: "pages/service/hearse.html", label: { ko: "운구·차량", zh: "灵车·车辆", en: "Hearse & Buses" } },
      ],
    },
    {
      key: "hall",
      label: { ko: "조문 안내", zh: "吊唁指南", en: "Visiting" },
      href: "pages/hall/search.html",
      children: [
        { key: "search", href: "pages/hall/search.html", label: { ko: "빈소 찾기", zh: "灵堂查询", en: "Find a Hall" } },
        {
          key: "cyber", href: "pages/hall/cyber.html",
          label: { ko: "온라인 추모", zh: "网上吊唁", en: "Online Tribute" },
          children: [
            { key: "write", href: "pages/hall/write.html", label: { ko: "추모글 남기기", zh: "撰写吊唁", en: "Leave a Message" } },
            { key: "confirm", href: "pages/hall/confirm.html", label: { ko: "빈소 정보 확인", zh: "灵堂信息查询", en: "Hall Information" } },
          ],
        },
        { key: "directions", href: "pages/hall/directions.html", label: { ko: "찾아오시는 길", zh: "交通指南", en: "Directions" } },
        { key: "parking", href: "pages/hall/parking.html", label: { ko: "주차 정보", zh: "停车信息", en: "Parking" } },
      ],
    },
    {
      key: "info",
      label: { ko: "장례 도움말", zh: "殡葬知识", en: "Resources" },
      href: "pages/info/knowledge.html",
      children: [
        { key: "knowledge", href: "pages/info/knowledge.html", label: { ko: "장례 기초 상식", zh: "殡葬常识", en: "Basics" } },
        { key: "jesa", href: "pages/info/jesa.html", label: { ko: "제례 안내", zh: "祭礼指南", en: "Ancestral Rites" } },
        { key: "bow", href: "pages/info/bow.html", label: { ko: "조문 예절", zh: "吊唁礼节", en: "Condolence Etiquette" } },
        { key: "general", href: "pages/info/general.html", label: { ko: "전통(유교)식", zh: "传统(儒教)式", en: "Confucian Rite" } },
        { key: "buddhist", href: "pages/info/buddhist.html", label: { ko: "불교식", zh: "佛教式", en: "Buddhist Rite" } },
        { key: "christian", href: "pages/info/christian.html", label: { ko: "기독교식", zh: "基督教式", en: "Christian Rite" } },
        { key: "catholic", href: "pages/info/catholic.html", label: { ko: "천주교식", zh: "天主教式", en: "Catholic Rite" } },
        { key: "forms", href: "pages/info/forms.html", label: { ko: "서식 자료실", zh: "表格资料室", en: "Documents" } },
        { key: "obituary", href: "pages/info/obituary.html", label: { ko: "신문 부고 안내", zh: "报纸讣告", en: "Newspaper Obituary" } },
      ],
    },
    {
      key: "support",
      label: { ko: "고객 지원", zh: "客户支持", en: "Support" },
      href: "pages/support/notice.html",
      children: [
        { key: "notice", href: "pages/support/notice.html", label: { ko: "알림 소식", zh: "通知公告", en: "Notices" } },
        { key: "faq", href: "pages/support/faq.html", label: { ko: "자주 하시는 질문", zh: "常见问题", en: "FAQ" } },
        { key: "qna", href: "pages/support/qna.html", label: { ko: "온라인 문의", zh: "在线咨询", en: "Inquiry" } },
        {
          key: "facility", href: "pages/support/crematory.html",
          label: { ko: "장사 시설 안내", zh: "殡葬设施指南", en: "Funeral Facilities" },
          children: [
            { key: "crematory", href: "pages/support/crematory.html", label: { ko: "화장장 안내", zh: "火葬场指南", en: "Crematorium" } },
            { key: "columbarium", href: "pages/support/columbarium.html", label: { ko: "납골당 안내", zh: "骨灰堂指南", en: "Columbarium" } },
            { key: "cemetery", href: "pages/support/cemetery.html", label: { ko: "공원묘지 안내", zh: "公园墓地指南", en: "Cemetery" } },
          ],
        },
      ],
    },
  ];

  function url(href) { return BASE + href; }

  function findSection(key) {
    for (var i = 0; i < MENU.length; i++) if (MENU[i].key === key) return MENU[i];
    return null;
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function setLang(lang) {
    try { localStorage.setItem("site_lang", lang); } catch (e) {}
    window.location.reload();
  }

  /* ---------------- 헤더 / GNB ---------------- */
  function buildHeader() {
    var header = el("header", "site-header");

    var langBtns = LANGS.map(function (l) {
      var names = { ko: "한국어", zh: "中文", en: "ENG" };
      var active = l === LANG ? " is-active" : "";
      return '<button type="button" class="lang-btn' + active + '" data-lang="' + l + '">' + names[l] + "</button>";
    }).join("");

    var topbar = el("div", "topbar");
    topbar.innerHTML =
      '<div class="container topbar-inner">' +
      '  <a href="' + url("index.html") + '" class="topbar-home">' + t(UI.home) + "</a>" +
      '  <div class="topbar-util">' +
      '    <span class="topbar-tel">' + t(SITE.tel24) + "</span>" +
      '    <a href="' + url("pages/hall/search.html") + '">' + t(UI.utilSearch) + "</a>" +
      '    <a href="' + url("pages/hall/directions.html") + '">' + t(UI.utilDirections) + "</a>" +
      '    <a href="' + url("pages/hall/cyber.html") + '">' + t(UI.utilCyber) + "</a>" +
      '    <a href="' + url("pages/member/login.html") + '" class="topbar-member">' + t(UI.utilMember) + "</a>" +
      '    <span class="lang-switch" role="group" aria-label="' + t(UI.langLabel) + '">' + langBtns + "</span>" +
      "  </div>" +
      "</div>";

    var main = el("div", "headbar");
    var inner = el("div", "container headbar-inner");

    var logo = el("a", "logo");
    logo.href = url("index.html");
    logo.innerHTML =
      '<span class="logo-mark">仁</span>' +
      '<span class="logo-text"><strong>' + t(SITE.name) + "</strong><em>" + SITE.nameEn + "</em></span>";

    var nav = el("nav", "gnb");
    nav.setAttribute("aria-label", "menu");
    var ul = el("ul", "gnb-list");

    MENU.forEach(function (sec) {
      var li = el("li", "gnb-item" + (PAGE.section === sec.key ? " is-active" : ""));
      var a = el("a", "gnb-link", t(sec.label));
      a.href = url(sec.href);
      li.appendChild(a);

      if (sec.children && sec.children.length) {
        var drop = el("div", "gnb-drop");
        var dul = el("ul");
        sec.children.forEach(function (c) {
          var dli = el("li");
          var da = el("a", null, t(c.label));
          da.href = url(c.href);
          dli.appendChild(da);
          if (c.children) {
            var sub = el("ul", "gnb-drop-sub");
            c.children.forEach(function (cc) {
              var sli = el("li");
              var sa = el("a", null, "- " + t(cc.label));
              sa.href = url(cc.href);
              sli.appendChild(sa);
              sub.appendChild(sli);
            });
            dli.appendChild(sub);
          }
          dul.appendChild(dli);
        });
        drop.appendChild(dul);
        li.appendChild(drop);
      }
      ul.appendChild(li);
    });
    nav.appendChild(ul);

    var toggle = el("button", "nav-toggle", "<span></span><span></span><span></span>");
    toggle.setAttribute("aria-label", "menu");
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      header.classList.toggle("mobile-open");
    });

    inner.appendChild(logo);
    inner.appendChild(nav);
    inner.appendChild(toggle);
    main.appendChild(inner);

    header.appendChild(topbar);
    header.appendChild(main);

    // 언어 버튼 이벤트
    header.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var l = btn.getAttribute("data-lang");
        if (l !== LANG) setLang(l);
      });
    });

    return header;
  }

  /* ---------------- 서브페이지 히어로 + 브레드크럼 ---------------- */
  function buildHero(sec, sub) {
    var current = sub || sec;
    var hero = el("section", "sub-hero");
    hero.innerHTML =
      '<div class="container">' +
      '  <p class="sub-hero-eyebrow">' + t(sec.label) + "</p>" +
      '  <h1 class="sub-hero-title">' + (current ? t(current.label) : t(sec.label)) + "</h1>" +
      "</div>";
    return hero;
  }

  function buildBreadcrumb(sec, sub, child) {
    var nav = el("nav", "breadcrumb");
    var parts = [];
    parts.push('<a href="' + url("index.html") + '">' + t(UI.breadcrumbHome) + "</a>");
    parts.push('<a href="' + url(sec.href) + '">' + t(sec.label) + "</a>");
    if (sub) parts.push('<a href="' + url(sub.href) + '">' + t(sub.label) + "</a>");
    if (child) parts.push("<span>" + t(child.label) + "</span>");
    else if (sub) parts[parts.length - 1] = "<span>" + t(sub.label) + "</span>";
    var wrap = el("div", "container");
    wrap.innerHTML = parts.join('<i class="bc-sep">›</i>');
    nav.appendChild(wrap);
    return nav;
  }

  /* ---------------- 좌측 사이드바 ---------------- */
  function buildSidebar(sec) {
    var aside = el("aside", "sidebar");
    var head = el("div", "sidebar-head", t(sec.label));
    aside.appendChild(head);
    var ul = el("ul", "sidebar-list");

    sec.children.forEach(function (c) {
      var li = el("li");
      var activeThis = PAGE.sub === c.key;
      var activeChild = c.children && c.children.some(function (cc) { return cc.key === PAGE.sub || cc.key === PAGE.child; });
      var a = el("a", activeThis || activeChild ? "is-active" : null, t(c.label));
      a.href = url(c.href);
      li.appendChild(a);

      if (c.children) {
        var sub = el("ul", "sidebar-sub");
        c.children.forEach(function (cc) {
          var sli = el("li");
          var sa = el("a", cc.key === PAGE.sub || cc.key === PAGE.child ? "is-active" : null, t(cc.label));
          sa.href = url(cc.href);
          sli.appendChild(sa);
          sub.appendChild(sli);
        });
        li.appendChild(sub);
      }
      ul.appendChild(li);
    });
    aside.appendChild(ul);

    var help = el("div", "sidebar-help");
    help.innerHTML =
      '<p class="sidebar-help-title">' + t(UI.consultTitle) + "</p>" +
      '<p class="sidebar-help-tel">' + SITE.tel + "</p>" +
      '<p class="sidebar-help-desc">' + t(UI.consultDesc) + "</p>";
    aside.appendChild(help);
    return aside;
  }

  /* ---------------- 푸터 ---------------- */
  function buildFooter() {
    var footer = el("footer", "site-footer");
    var links =
      '<div class="footer-links">' +
      '<a href="' + url("pages/support/notice.html") + '">' + t(findSection("support").children[0].label) + "</a>" +
      '<a href="' + url("pages/info/knowledge.html") + '">' + t(findSection("info").children[0].label) + "</a>" +
      '<a href="' + url("pages/hall/directions.html") + '">' + t(UI.utilDirections) + "</a>" +
      '<a href="' + url("pages/support/qna.html") + '">' + t(findSection("support").children[2].label) + "</a>" +
      "</div>";
    footer.innerHTML =
      '<div class="container footer-inner">' +
      links +
      '<div class="footer-info">' +
      '<p class="footer-name">' + t(SITE.name) + "</p>" +
      "<p>" + t(SITE.address) + " &nbsp;|&nbsp; TEL " + SITE.tel + " &nbsp;|&nbsp; " + SITE.email + "</p>" +
      '<p class="footer-copy">Copyright © ' + t(UI.footerCopy) + "</p>" +
      "</div>" +
      "</div>";
    return footer;
  }

  /* ---------------- 페이지 본문 언어 적용 ---------------- */
  function applyPageLang(content) {
    if (!content) return;
    if (LANG === "ko") return; // 한국어는 원문 유지
    var dict = window.PAGE_I18N;
    if (dict && typeof dict[LANG] === "string") {
      content.innerHTML = dict[LANG];
    }
  }

  /* ---------------- 초기화 ---------------- */
  function init() {
    document.documentElement.lang = LANG;
    var body = document.body;
    var content = document.getElementById("pageContent");

    applyPageLang(content);

    body.insertBefore(buildHeader(), body.firstChild);

    if (PAGE.home) {
      if (content) body.insertBefore(content, null);
    body.appendChild(buildFooter());
    wireHeaderScroll();
    if (typeof window.initHomeGuide === "function") window.initHomeGuide();
    return;
    }

    var sec = findSection(PAGE.section);
    if (!sec) { body.appendChild(buildFooter()); return; }

    var sub = null, child = null;
    (sec.children || []).forEach(function (c) {
      if (c.key === PAGE.sub) sub = c;
      if (c.children) c.children.forEach(function (cc) {
        if (cc.key === PAGE.sub) { sub = c; child = cc; }
        if (cc.key === PAGE.child) child = cc;
      });
    });

    body.appendChild(buildHero(sec, child || sub));
    body.appendChild(buildBreadcrumb(sec, sub, child));

    var section = el("div", "page-section");
    var container = el("div", "container page-layout");
    container.appendChild(buildSidebar(sec));

    var mainCol = el("div", "page-main");
    if (content) mainCol.appendChild(content);
    container.appendChild(mainCol);
    section.appendChild(container);
    body.appendChild(section);

    body.appendChild(buildFooter());
    wireHeaderScroll();
  }

  function wireHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      if (window.scrollY > 40) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.SITE = SITE;
})();

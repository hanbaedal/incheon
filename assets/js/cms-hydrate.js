"use strict";

(function () {
  function getLang() {
    try {
      const saved = localStorage.getItem("site_lang");
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) {}
    return "ko";
  }

  function applySlot(el, type, value, alt) {
    if (value == null || value === "") return;
    if (type === "html") {
      el.innerHTML = value;
      return;
    }
    if (type === "image") {
      if (el.tagName === "IMG") {
        el.src = value;
        if (alt) el.alt = alt;
      }
      return;
    }
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = value;
    else el.textContent = value;
  }

  async function cmsHydrate(opts) {
    opts = opts || {};
    const page = opts.page || window.CMS_PAGE || "home";
    const root = opts.root || document;
    const lang = opts.lang || getLang();
    let slots = opts.slots;
    if (!slots) {
      try {
        const res = await fetch("/api/cms/public/" + encodeURIComponent(page) + "?lang=" + encodeURIComponent(lang));
        if (!res.ok) return;
        const data = await res.json();
        slots = data.slots || {};
      } catch (e) {
        return;
      }
    }
    root.querySelectorAll("[data-cms-key]").forEach((el) => {
      const key = el.getAttribute("data-cms-key");
      const type = el.getAttribute("data-cms-type") || "text";
      const val = slots[key];
      let alt = null;
      if (type === "image") alt = slots[key + "_alt"] || slots[key.replace(/Img$/, "Alt")] || null;
      applySlot(el, type, val, alt);
    });
  }

  window.cmsHydrate = cmsHydrate;
})();
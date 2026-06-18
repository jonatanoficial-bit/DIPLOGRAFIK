const SETUP_SCREENS = Object.freeze(["menu", "create"]);
const PAGE_RATIO = 0.82;
let installed = false;
let activeScroller = null;

function currentScreenId() {
  return document.body?.dataset?.screen || document.querySelector(".screen.active")?.id || "menu";
}

function setupScroller(id = currentScreenId()) {
  return SETUP_SCREENS.includes(id) ? document.getElementById(id) : null;
}

function maxScroll(element) {
  return element ? Math.max(0, element.scrollHeight - element.clientHeight) : 0;
}

function updateAssist() {
  const create = document.getElementById("create");
  const assist = document.getElementById("createScrollAssist");
  const bar = assist?.querySelector(".scrollAssistBar > i");
  if (!create || !assist) return;
  const maximum = maxScroll(create);
  const ratio = maximum > 0 ? Math.min(1, Math.max(0, create.scrollTop / maximum)) : 1;
  assist.style.setProperty("--scroll-progress", `${Math.round(ratio * 100)}%`);
  assist.classList.toggle("is-hidden", maximum < 16 || ratio > 0.04);
  assist.setAttribute("aria-hidden", String(currentScreenId() !== "create"));
  const progress = assist.querySelector("[role='progressbar']");
  progress?.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  if (bar) bar.style.width = `${Math.max(5, Math.round(ratio * 100))}%`;
}

function activateScreen(id, { reset = true } = {}) {
  activeScroller = setupScroller(id);
  document.body?.classList.toggle("setup-scroll-active", Boolean(activeScroller));
  if (!activeScroller) return;
  activeScroller.dataset.scrollOwner = "true";
  requestAnimationFrame(() => {
    if (reset) activeScroller.scrollTop = 0;
    updateAssist();
  });
}

function isEditing(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

function keyScroll(event) {
  const scroller = setupScroller();
  if (!scroller || isEditing(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
  const page = Math.max(180, scroller.clientHeight * PAGE_RATIO);
  let top = null;
  if (event.key === "PageDown" || (event.key === " " && !event.shiftKey)) top = scroller.scrollTop + page;
  if (event.key === "PageUp" || (event.key === " " && event.shiftKey)) top = scroller.scrollTop - page;
  if (event.key === "Home") top = 0;
  if (event.key === "End") top = maxScroll(scroller);
  if (top === null) return;
  event.preventDefault();
  scroller.scrollTo({ top, behavior: "smooth" });
}

function focusIntoView(event) {
  const scroller = setupScroller();
  const target = event.target;
  if (!scroller || !target || !scroller.contains(target) || !isEditing(target)) return;
  window.setTimeout(() => target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }), 80);
}

function handleScreenChange(event) {
  activateScreen(event.detail?.id || currentScreenId(), { reset: true });
}

function refresh() {
  const next = setupScroller();
  if (next !== activeScroller) activeScroller = next;
  updateAssist();
}

export function installScrollExperience() {
  if (installed) return window.DIPLOCRAFT_SCROLL;
  installed = true;

  for (const id of SETUP_SCREENS) {
    const element = document.getElementById(id);
    element?.addEventListener("scroll", updateAssist, { passive: true });
  }
  document.addEventListener("keydown", keyScroll);
  document.addEventListener("focusin", focusIntoView);
  document.addEventListener("diplocraft:screenchange", handleScreenChange);
  window.addEventListener("resize", refresh, { passive: true });
  window.visualViewport?.addEventListener("resize", refresh, { passive: true });

  activateScreen(currentScreenId(), { reset: false });

  const api = Object.freeze({
    refresh,
    scrollToTop: () => setupScroller()?.scrollTo({ top: 0, behavior: "smooth" }),
    scrollToBottom: () => {
      const scroller = setupScroller();
      if (scroller) scroller.scrollTo({ top: maxScroll(scroller), behavior: "smooth" });
    },
    getStatus: () => {
      const scroller = setupScroller();
      return {
        installed,
        screen: currentScreenId(),
        owner: scroller?.id || null,
        scrollTop: scroller?.scrollTop || 0,
        clientHeight: scroller?.clientHeight || 0,
        scrollHeight: scroller?.scrollHeight || 0,
        scrollable: maxScroll(scroller) > 0
      };
    }
  });
  window.DIPLOCRAFT_SCROLL = api;
  return api;
}

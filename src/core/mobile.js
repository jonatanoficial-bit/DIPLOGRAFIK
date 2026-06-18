const MOBILE_QUERY = "(max-width: 880px)";
const KEYBOARD_THRESHOLD = 140;
const scrollPositions = new Map();
let baselineHeight = 0;
let installed = false;
let drawerOpen = false;
let gesture = null;

function isMobileViewport() {
  return window.matchMedia?.(MOBILE_QUERY).matches ?? window.innerWidth <= 880;
}

function orientationName() {
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

function activeTabId() {
  return document.querySelector(".tab.active")?.id?.replace(/^tab-/, "") || "dashboard";
}

function shell() {
  return document.querySelector(".shell");
}

function visualHeight() {
  return Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0);
}

function updateViewportMetrics({ forceBaseline = false } = {}) {
  const root = document.documentElement;
  const body = document.body;
  const height = visualHeight();
  const width = Math.round(window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || 0);
  const orientation = orientationName();
  const active = document.activeElement;
  const editing = Boolean(active?.matches?.("input, textarea, select, [contenteditable='true']"));

  if (forceBaseline || !baselineHeight || !editing || height > baselineHeight) baselineHeight = Math.max(height, window.innerHeight || 0);
  const keyboardHeight = Math.max(0, baselineHeight - height);
  const keyboardOpen = isMobileViewport() && editing && keyboardHeight >= KEYBOARD_THRESHOLD;

  root.style.setProperty("--app-height", `${height}px`);
  root.style.setProperty("--visual-width", `${width}px`);
  root.style.setProperty("--keyboard-height", `${keyboardOpen ? keyboardHeight : 0}px`);
  body.dataset.orientation = orientation;
  body.classList.toggle("is-mobile", isMobileViewport());
  body.classList.toggle("keyboard-open", keyboardOpen);
  body.classList.toggle("compact-height", height < 640);

  if (keyboardOpen && active) {
    window.setTimeout(() => active.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }), 40);
  }
  return { height, width, keyboardHeight: keyboardOpen ? keyboardHeight : 0, keyboardOpen, orientation };
}

function focusableInDrawer() {
  const drawer = document.getElementById("mobileDrawer") || document.querySelector(".side");
  if (!drawer) return [];
  return Array.from(drawer.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"))
    .filter(el => !el.hidden && el.getClientRects().length > 0);
}

function setDrawerState(open, { focus = true } = {}) {
  const body = document.body;
  const button = document.getElementById("mobileMenuBtn");
  const moreButton = document.getElementById("mobileMoreBtn");
  const drawer = document.getElementById("mobileDrawer") || document.querySelector(".side");
  const mobile = isMobileViewport();
  drawerOpen = Boolean(open && mobile);
  body.classList.toggle("nav-open", drawerOpen);
  button?.setAttribute("aria-expanded", String(drawerOpen));
  moreButton?.setAttribute("aria-expanded", String(drawerOpen));
  drawer?.setAttribute("aria-hidden", String(mobile ? !drawerOpen : false));

  if (drawerOpen && focus) {
    window.setTimeout(() => (document.getElementById("mobileCloseNav") || focusableInDrawer()[0])?.focus(), 20);
  } else if (!drawerOpen && focus && document.activeElement && drawer?.contains(document.activeElement)) {
    button?.focus();
  }
}

function toggleDrawer() {
  setDrawerState(!drawerOpen);
}

function saveTabScroll(tabId = activeTabId()) {
  const viewport = shell();
  if (viewport && tabId) scrollPositions.set(tabId, viewport.scrollTop);
}

function restoreTabScroll(tabId = activeTabId()) {
  const viewport = shell();
  if (!viewport) return;
  const position = scrollPositions.get(tabId) || 0;
  requestAnimationFrame(() => { viewport.scrollTop = position; });
}

function sectionLabel(tabId) {
  const source = document.querySelector(`.side [data-tab="${tabId}"]`) || document.querySelector(`.bottomNav [data-tab="${tabId}"]`);
  return source?.textContent?.replace(/\s+/g, " ").trim().replace(/^[^\p{L}\p{N}]+/u, "") || "Início";
}

function updateSection(tabId = activeTabId()) {
  const el = document.getElementById("mobileSection");
  if (el) el.textContent = sectionLabel(tabId);
}

function shouldIgnoreGesture(target) {
  return Boolean(target?.closest?.("input, textarea, select, canvas, [contenteditable='true'], input[type='range'], .tutorialOverlay, .errorOverlay, .audioPanel"));
}

function pointerDown(event) {
  if (!isMobileViewport() || shouldIgnoreGesture(event.target) || event.pointerType === "mouse") return;
  const x = event.clientX;
  const eligible = drawerOpen || x <= 28;
  if (!eligible) return;
  gesture = { id: event.pointerId, x, y: event.clientY, open: drawerOpen };
}

function pointerUp(event) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  const horizontal = Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.35;
  if (horizontal) {
    if (!gesture.open && dx > 0) setDrawerState(true);
    if (gesture.open && dx < 0) setDrawerState(false);
  }
  gesture = null;
}

function keyHandler(event) {
  if (event.key === "Escape" && drawerOpen) {
    event.preventDefault();
    setDrawerState(false);
    return;
  }
  if (event.key !== "Tab" || !drawerOpen) return;
  const items = focusableInDrawer();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function tabClickCapture(event) {
  const tab = event.target.closest?.("[data-tab]");
  if (!tab) return;
  saveTabScroll();
  const target = tab.dataset.tab;
  window.setTimeout(() => {
    updateSection(target);
    restoreTabScroll(target);
    setDrawerState(false, { focus: false });
  }, 0);
}

function screenChanged(event) {
  const id = event.detail?.id;
  if (id !== "game") setDrawerState(false, { focus: false });
  updateViewportMetrics({ forceBaseline: true });
}

function tabChanged(event) {
  const id = event.detail?.id || activeTabId();
  updateSection(id);
  restoreTabScroll(id);
}

export function installMobileExperience() {
  if (installed) return window.DIPLOCRAFT_MOBILE;
  installed = true;

  const menuButton = document.getElementById("mobileMenuBtn");
  const closeButton = document.getElementById("mobileCloseNav");
  const moreButton = document.getElementById("mobileMoreBtn");
  const overlay = document.getElementById("mobileOverlay");

  menuButton?.addEventListener("click", toggleDrawer);
  closeButton?.addEventListener("click", () => setDrawerState(false));
  moreButton?.addEventListener("click", () => setDrawerState(true));
  overlay?.addEventListener("click", () => setDrawerState(false));

  document.addEventListener("click", tabClickCapture, true);
  document.addEventListener("keydown", keyHandler);
  document.addEventListener("pointerdown", pointerDown, { passive: true });
  document.addEventListener("pointerup", pointerUp, { passive: true });
  document.addEventListener("pointercancel", () => { gesture = null; }, { passive: true });
  document.addEventListener("focusin", () => window.setTimeout(updateViewportMetrics, 20));
  document.addEventListener("focusout", () => window.setTimeout(() => updateViewportMetrics({ forceBaseline: true }), 80));
  document.addEventListener("diplocraft:screenchange", screenChanged);
  document.addEventListener("diplocraft:tabchange", tabChanged);

  window.addEventListener("resize", () => updateViewportMetrics());
  window.addEventListener("orientationchange", () => window.setTimeout(() => updateViewportMetrics({ forceBaseline: true }), 120));
  window.visualViewport?.addEventListener("resize", () => updateViewportMetrics());
  window.visualViewport?.addEventListener("scroll", () => updateViewportMetrics());
  window.matchMedia?.(MOBILE_QUERY).addEventListener?.("change", () => {
    setDrawerState(false, { focus: false });
    updateViewportMetrics({ forceBaseline: true });
  });

  updateViewportMetrics({ forceBaseline: true });
  updateSection();
  setDrawerState(false, { focus: false });

  const api = Object.freeze({
    openDrawer: () => setDrawerState(true),
    closeDrawer: () => setDrawerState(false),
    toggleDrawer,
    refreshViewport: options => updateViewportMetrics(options),
    saveTabScroll,
    restoreTabScroll,
    getStatus: () => ({
      installed,
      mobile: isMobileViewport(),
      drawerOpen,
      activeTab: activeTabId(),
      orientation: document.body.dataset.orientation,
      keyboardOpen: document.body.classList.contains("keyboard-open"),
      appHeight: getComputedStyle(document.documentElement).getPropertyValue("--app-height").trim()
    })
  });
  window.DIPLOCRAFT_MOBILE = api;
  return api;
}

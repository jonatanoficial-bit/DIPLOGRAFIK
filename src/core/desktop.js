import { translateText, translateElement } from "./i18n.js";
const DESKTOP_QUERY = "(min-width: 881px)";
const TABLET_RAIL_MAX = 1199;
const ULTRAWIDE_MIN = 2000;
const NAV_KEY = "diplocraft_desktop_nav_compact";
const DENSITY_KEY = "diplocraft_desktop_density";

let installed = false;
let paletteOpen = false;
let selectedIndex = 0;
let currentResults = [];

const TAB_SHORTCUTS = [
  "dashboard", "government", "economy", "diplomacy", "military",
  "intelligence", "projects", "press", "elections"
];

function isDesktop() {
  return window.matchMedia?.(DESKTOP_QUERY).matches ?? window.innerWidth >= 881;
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* preferences are optional */ }
}

function editingTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

function activeTabId() {
  return document.querySelector(".tab.active")?.id?.replace(/^tab-/, "") || "dashboard";
}

function navLabel(tabId) {
  const button = document.querySelector(`#mobileDrawer [data-tab="${tabId}"]`);
  return button?.querySelector(".navLabel")?.textContent?.trim()
    || button?.textContent?.replace(/\s+/g, " ").trim().replace(/^[^\p{L}\p{N}]+/u, "")
    || "Início";
}

function effectiveCompact() {
  const stored = safeGet(NAV_KEY);
  if (stored === "true" || stored === "false") return stored === "true";
  return window.innerWidth <= TABLET_RAIL_MAX;
}

function setCompact(compact, { persist = true } = {}) {
  const value = Boolean(compact && isDesktop());
  document.body.classList.toggle("desktop-nav-compact", value);
  if (persist) safeSet(NAV_KEY, String(value));
  const toggle = document.getElementById("desktopNavToggle");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(value));
    toggle.setAttribute("aria-label", translateText(value ? "Expandir navegação lateral" : "Compactar navegação lateral"));
    toggle.title = translateText(value ? "Expandir navegação lateral" : "Compactar navegação lateral");
    toggle.textContent = value ? "⇥" : "⇤";
  }
  document.dispatchEvent(new CustomEvent("diplocraft:desktop-status"));
}

function densityValue() {
  return safeGet(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
}

function setDensity(value, { persist = true } = {}) {
  const density = value === "compact" ? "compact" : "comfortable";
  document.body.classList.toggle("desktop-density-compact", density === "compact");
  document.body.dataset.desktopDensity = density;
  if (persist) safeSet(DENSITY_KEY, density);
  const button = document.getElementById("desktopDensityBtn");
  if (button) {
    button.setAttribute("aria-pressed", String(density === "compact"));
    button.innerHTML = `<span aria-hidden="true">${density === "compact" ? "▦" : "▤"}</span><span>${translateText(density === "compact" ? "Compacta" : "Confortável")}</span>`;
    button.title = `Densidade ${density}`;
  }
  document.dispatchEvent(new CustomEvent("diplocraft:desktop-status"));
}

function updateBreakpoints() {
  const width = Math.round(window.innerWidth || document.documentElement.clientWidth || 0);
  const desktop = isDesktop();
  document.body.classList.toggle("is-desktop", desktop);
  document.body.classList.toggle("desktop-tablet", desktop && width <= TABLET_RAIL_MAX);
  document.body.classList.toggle("desktop-wide", desktop && width >= 1440);
  document.body.classList.toggle("desktop-ultrawide", desktop && width >= ULTRAWIDE_MIN);
  const navigation = document.getElementById("mobileDrawer");
  if (navigation) navigation.setAttribute("aria-hidden", String(!desktop));
  if (!desktop) {
    document.body.classList.remove("desktop-nav-compact", "desktop-density-compact");
    closePalette({ focus: false });
  } else {
    setCompact(effectiveCompact(), { persist: false });
    setDensity(densityValue(), { persist: false });
  }
  return { desktop, width, tablet: desktop && width <= TABLET_RAIL_MAX, ultrawide: width >= ULTRAWIDE_MIN };
}

function updateSection(tabId = activeTabId()) {
  const label = navLabel(tabId);
  const section = document.getElementById("desktopSection");
  if (section) section.textContent = translateText(label);
  const crumb = document.getElementById("desktopBreadcrumb");
  if (crumb) crumb.setAttribute("aria-label", `Seção atual: ${label}`);
}

function commandItems() {
  const tabs = Array.from(document.querySelectorAll("#mobileDrawer [data-tab]")).map((button, index) => ({
    id: `tab:${button.dataset.tab}`,
    label: translateText(button.querySelector(".navLabel")?.textContent?.trim() || navLabel(button.dataset.tab)),
    detail: "Abrir sistema",
    icon: button.querySelector(".navIcon")?.textContent?.trim() || "•",
    keywords: `${button.dataset.tab} sistema navegação`,
    action: () => button.click(),
    shortcut: TAB_SHORTCUTS.includes(button.dataset.tab) ? `Alt+${TAB_SHORTCUTS.indexOf(button.dataset.tab) + 1}` : ""
  }));
  const actions = [
    { id:"action:save", label:"Salvar jogo", detail:"Criar save e snapshot", icon:"💾", keywords:"salvar save snapshot", shortcut:"Alt+S", selector:"#saveGame" },
    { id:"action:day", label:"Avançar um dia", detail:"Executar o próximo dia", icon:"＋", keywords:"dia tempo avançar", shortcut:"Alt+D", selector:"#advanceDay" },
    { id:"action:week", label:"Avançar sete dias", detail:"Executar uma semana", icon:"7", keywords:"semana tempo avançar", selector:"#advanceWeek" },
    { id:"action:audio", label:"Controles de áudio", detail:"Abrir painel de som", icon:"♫", keywords:"som música efeitos volume", selector:"#audioHud" },
    { id:"action:fullscreen", label:"Alternar tela cheia", detail:"Usar toda a tela disponível", icon:"⛶", keywords:"fullscreen tela cheia", selector:"#desktopFullscreen" },
    { id:"action:release", label:"Informações da build", detail:"Abrir Release e auditoria", icon:"✓", keywords:"release build versão auditoria", action:() => document.querySelector('#mobileDrawer [data-tab="release"]')?.click() }
  ].map(item => ({ ...item, action:item.action || (() => document.querySelector(item.selector)?.click()) }));
  return [...tabs, ...actions];
}

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filterCommands(query = "") {
  const term = normalize(query).trim();
  return commandItems().filter(item => !term || normalize(`${item.label} ${item.detail} ${item.keywords}`).includes(term)).slice(0, 16);
}

function renderCommands(query = "") {
  const results = document.getElementById("commandResults");
  if (!results) return;
  currentResults = filterCommands(query);
  selectedIndex = Math.min(selectedIndex, Math.max(0, currentResults.length - 1));
  results.innerHTML = currentResults.length ? currentResults.map((item, index) => `
    <button class="commandResult ${index === selectedIndex ? "selected" : ""}" data-command-index="${index}" type="button" role="option" aria-selected="${index === selectedIndex}">
      <span class="commandIcon" aria-hidden="true">${item.icon}</span>
      <span><b>${item.label}</b><small>${item.detail}</small></span>
      ${item.shortcut ? `<kbd>${item.shortcut}</kbd>` : ""}
    </button>`).join("") : `<p class="commandEmpty">Nenhum comando encontrado.</p>`;
  translateElement(results);
  results.querySelectorAll("[data-command-index]").forEach(button => {
    button.addEventListener("mouseenter", () => { selectedIndex = Number(button.dataset.commandIndex); renderCommands(document.getElementById("commandSearch")?.value || ""); });
    button.addEventListener("click", () => executeCommand(Number(button.dataset.commandIndex)));
  });
}

function executeCommand(index = selectedIndex) {
  const item = currentResults[index];
  if (!item) return;
  closePalette({ focus: false });
  item.action?.();
  document.getElementById("gameScroll")?.focus({ preventScroll: true });
}

function openPalette() {
  if (!isDesktop()) return false;
  const palette = document.getElementById("commandPalette");
  const search = document.getElementById("commandSearch");
  if (!palette || !search) return false;
  paletteOpen = true;
  selectedIndex = 0;
  palette.classList.add("open");
  palette.setAttribute("aria-hidden", "false");
  document.body.classList.add("command-palette-open");
  search.value = "";
  renderCommands();
  window.setTimeout(() => search.focus(), 20);
  return true;
}

function closePalette({ focus = true } = {}) {
  if (!paletteOpen && !document.getElementById("commandPalette")?.classList.contains("open")) return;
  paletteOpen = false;
  const palette = document.getElementById("commandPalette");
  palette?.classList.remove("open");
  palette?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("command-palette-open");
  if (focus) document.getElementById("desktopCommandBtn")?.focus();
}

function searchKeydown(event) {
  if (event.key === "ArrowDown") {
    event.preventDefault(); selectedIndex = Math.min(currentResults.length - 1, selectedIndex + 1); renderCommands(event.currentTarget.value);
  } else if (event.key === "ArrowUp") {
    event.preventDefault(); selectedIndex = Math.max(0, selectedIndex - 1); renderCommands(event.currentTarget.value);
  } else if (event.key === "Enter") {
    event.preventDefault(); executeCommand();
  } else if (event.key === "Escape") {
    event.preventDefault(); closePalette();
  }
}

function globalKeydown(event) {
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "k") {
    event.preventDefault(); paletteOpen ? closePalette() : openPalette(); return;
  }
  if (event.key === "Escape" && paletteOpen) { event.preventDefault(); closePalette(); return; }
  if (!isDesktop() || editingTarget(event.target) || !document.getElementById("game")?.classList.contains("active")) return;
  if (event.altKey && /^[1-9]$/.test(event.key)) {
    const tab = TAB_SHORTCUTS[Number(event.key) - 1];
    if (tab) { event.preventDefault(); document.querySelector(`#mobileDrawer [data-tab="${tab}"]`)?.click(); }
  } else if (event.altKey && key === "s") {
    event.preventDefault(); document.getElementById("saveGame")?.click();
  } else if (event.altKey && key === "d") {
    event.preventDefault(); document.getElementById("advanceDay")?.click();
  } else if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
    event.preventDefault(); openPalette();
  }
}

function bind() {
  document.getElementById("desktopNavToggle")?.addEventListener("click", () => setCompact(!document.body.classList.contains("desktop-nav-compact")));
  document.getElementById("desktopDensityBtn")?.addEventListener("click", () => setDensity(document.body.classList.contains("desktop-density-compact") ? "comfortable" : "compact"));
  document.getElementById("desktopCommandBtn")?.addEventListener("click", openPalette);
  document.getElementById("commandClose")?.addEventListener("click", () => closePalette());
  document.getElementById("commandPalette")?.addEventListener("click", event => { if (event.target.id === "commandPalette") closePalette(); });
  const search = document.getElementById("commandSearch");
  search?.addEventListener("input", event => { selectedIndex = 0; renderCommands(event.currentTarget.value); });
  search?.addEventListener("keydown", searchKeydown);
  document.addEventListener("keydown", globalKeydown);
  document.addEventListener("diplocraft:tabchange", event => updateSection(event.detail?.id));
  document.addEventListener("diplocraft:screenchange", event => { if (event.detail?.id !== "game") closePalette({ focus:false }); });
  window.addEventListener("resize", updateBreakpoints);
  window.matchMedia?.(DESKTOP_QUERY).addEventListener?.("change", updateBreakpoints);
}

export function installDesktopExperience() {
  if (installed) return window.DIPLOCRAFT_DESKTOP;
  installed = true;
  bind();
  updateBreakpoints();
  updateSection();
  const api = Object.freeze({
    openCommandPalette: openPalette,
    closeCommandPalette: closePalette,
    toggleNavigation: () => setCompact(!document.body.classList.contains("desktop-nav-compact")),
    setDensity,
    refresh: updateBreakpoints,
    getStatus: () => ({
      installed,
      desktop: isDesktop(),
      width: window.innerWidth,
      compactNavigation: document.body.classList.contains("desktop-nav-compact"),
      density: document.body.dataset.desktopDensity || "comfortable",
      paletteOpen,
      activeTab: activeTabId(),
      ultrawide: document.body.classList.contains("desktop-ultrawide")
    })
  });
  window.DIPLOCRAFT_DESKTOP = api;
  return api;
}

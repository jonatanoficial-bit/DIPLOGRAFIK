import { $$, $ } from "./dom.js";
import { applyResponsiveBackground, preloadBackground, TAB_BACKGROUND_KEYS } from "./assets.js";

export const backgroundByTab = TAB_BACKGROUND_KEYS;

export function showScreen(id) {
  $$(".screen").forEach(screen => {
    screen.classList.remove("active");
    screen.setAttribute("aria-hidden", "true");
  });
  const target = $("#" + id);
  if (target) {
    target.classList.add("active");
    target.setAttribute("aria-hidden", "false");
  }
  document.body.dataset.screen = id;
  document.body.classList.toggle("game-active", id === "game");
  document.body.classList.remove("nav-open");
  if (id === "create") preloadBackground("bg_main_menu_presidential_office_v1", "high");
  document.dispatchEvent(new CustomEvent("diplocraft:screenchange", { detail: { id } }));
}

export function showTab(id) {
  $$(".tab").forEach(tab => tab.classList.remove("active"));
  const tab = $("#tab-" + id);
  if (tab) tab.classList.add("active");
  $$("[data-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === id));
  const key = backgroundByTab[id];
  const bg = $("#gameBg");
  if (bg && key) {
    applyResponsiveBackground(bg, key);
    preloadBackground(key, "high");
  }
  document.dispatchEvent(new CustomEvent("diplocraft:tabchange", { detail: { id } }));
}

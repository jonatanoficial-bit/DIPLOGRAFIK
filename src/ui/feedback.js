import { $ } from "../core/dom.js";
import { playSfx } from "./audio.js";
import { translateText, t, formatNumber } from "../core/i18n.js";

export function showToast(message, type = "info") {
  const layer = document.getElementById("toastLayer");
  if (!layer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<b data-i18n-final="true">${label(type)}</b><span data-i18n-final="true">${translateText(message)}</span>`;
  layer.prepend(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

export function pulse(selector) {
  const el = $(selector);
  if (!el) return;
  el.classList.remove("pulseFx");
  void el.offsetWidth;
  el.classList.add("pulseFx");
}

export function impactFlash(type = "info") {
  const layer = document.getElementById("fxLayer");
  if (!layer) return;
  const flash = document.createElement("div");
  flash.className = `impactFlash ${type}`;
  layer.appendChild(flash);
  setTimeout(() => flash.remove(), 680);
}

export function countUp(el, from, to, duration = 420) {
  if (!el) return;
  const start = performance.now();
  const diff = Number(to) - Number(from);
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = formatNumber(Math.round(Number(from) + diff * eased));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function vibrate(type = "light") {
  if (!navigator.vibrate) return;
  const pattern = type === "negative" ? [30, 30, 45] : type === "positive" ? [18, 20, 18] : [12];
  navigator.vibrate(pattern);
}

export function feedback(message, type = "info") {
  showToast(message, type);
  impactFlash(type);
  playSfx(type);
  vibrate(type);
}

function label(type) {
  if (type === "positive") return translateText("SUCESSO");
  if (type === "negative") return translateText("ALERTA");
  if (type === "warning") return translateText("ATENÇÃO");
  return "INFO";
}
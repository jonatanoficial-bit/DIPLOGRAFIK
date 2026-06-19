import { $, $$ } from "../core/dom.js";
import { TUTORIAL_STEPS } from "../data/tutorialData.js";
import { showTab, showScreen } from "../core/router.js";
import { feedback } from "./feedback.js";
import { translateText, translateElement } from "../core/i18n.js";

let index = 0;
let onRender = null;

export function setupTutorial(renderCallback) {
  onRender = renderCallback;
  const btn = $("#tutorialBtn");
  const close = $("#tutorialClose");
  const skip = $("#tutorialSkip");
  const next = $("#tutorialNext");
  const prev = $("#tutorialPrev");

  if (btn) btn.onclick = () => startTutorial(true);
  if (close) close.onclick = closeTutorial;
  if (skip) skip.onclick = closeTutorial;
  if (next) next.onclick = nextStep;
  if (prev) prev.onclick = prevStep;
}

export function startTutorial(force = false) {
  if (!force && localStorage.getItem("diplocraft_tutorial_done_v178") === "1") return;
  index = 0;
  openStep();
}

export function maybeAutoTutorial() {
  if (localStorage.getItem("diplocraft_tutorial_done_v178") !== "1") {
    setTimeout(() => startTutorial(false), 600);
  }
}

function openStep() {
  const overlay = $("#tutorialOverlay");
  if (!overlay) return;

  const step = TUTORIAL_STEPS[index];
  showScreen("game");
  if (step.tab) showTab(step.tab);
  if (onRender) onRender();

  $("#tutorialTitle").textContent = translateText(step.title);
  $("#tutorialText").textContent = translateText(step.text);
  $("#tutorialPrev").disabled = index === 0;
  $("#tutorialNext").textContent = translateText(index === TUTORIAL_STEPS.length - 1 ? "CONCLUIR" : "PRÓXIMO");
  $("#tutorialProgress").innerHTML = TUTORIAL_STEPS.map((s, i) => `<i class="${i <= index ? "active" : ""}"></i>`).join("");

  translateElement(overlay);
  overlay.classList.add("open");
  highlight(step.focus);
}

function nextStep() {
  if (index >= TUTORIAL_STEPS.length - 1) {
    localStorage.setItem("diplocraft_tutorial_done_v178", "1");
    feedback("Tutorial concluído. Boa sorte no mandato.", "positive");
    closeTutorial();
    return;
  }
  index++;
  openStep();
}

function prevStep() {
  index = Math.max(0, index - 1);
  openStep();
}

function closeTutorial() {
  const overlay = $("#tutorialOverlay");
  if (overlay) overlay.classList.remove("open");
  clearHighlights();
}

function highlight(selector) {
  clearHighlights();
  const el = selector ? $(selector) : null;
  if (!el) return;
  el.classList.add("tutorialFocus");
  setTimeout(() => {
    try { el.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e) {}
  }, 120);
}

function clearHighlights() {
  $$(".tutorialFocus").forEach(el => el.classList.remove("tutorialFocus"));
}
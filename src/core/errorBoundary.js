import { recordIncident, restoreLatest, setSafeMode, exportDiagnostics, getResilienceStatus } from "./resilience.js";
import { translateText, translateElement } from "./i18n.js";

let showErrorHandler = null;

export function installErrorBoundary(options = {}) {
  const overlay = document.getElementById("errorOverlay");
  const text = document.getElementById("errorText");
  const reload = document.getElementById("reloadGame");
  const returnToMenu = document.getElementById("returnToMenu");
  const restore = document.getElementById("restoreSnapshot");
  const safeRestart = document.getElementById("safeModeRestart");
  const diagnostics = document.getElementById("exportDiagnostics");
  const build = document.getElementById("errorBuild");
  const incidentText = document.getElementById("errorIncident");
  const recoveryText = document.getElementById("errorRecoveryInfo");

  if (reload) reload.onclick = () => location.reload();
  if (returnToMenu) returnToMenu.onclick = () => recoverToMenu(overlay);
  if (restore) {
    restore.onclick = () => {
      const restored = restoreLatest();
      if (!restored) {
        if (recoveryText) recoveryText.textContent = translateText("Nenhum snapshot válido disponível.");
        return;
      }
      if (typeof options.onRestore === "function") options.onRestore(restored);
      if (recoveryText) recoveryText.textContent = translateText("Snapshot restaurado. O estado recuperado foi carregado.");
      recoverToMenu(overlay);
    };
  }
  if (safeRestart) safeRestart.onclick = () => { setSafeMode(true, "recuperação-manual"); location.reload(); };
  if (diagnostics) diagnostics.onclick = () => exportDiagnostics();

  showErrorHandler = (message, context = "", originalError = null) => {
    const normalized = String(message || "Erro desconhecido").slice(0, 900);
    const incident = recordIncident(originalError || new Error(normalized), context || "Falha de execução");
    console.error("[DIPLOCRAFT ERROR]", context, normalized, incident.id);
    if (!overlay || !text) return incident;
    document.getElementById("tutorialOverlay")?.classList.remove("open");
    document.getElementById("audioPanel")?.classList.remove("open");
    document.body.classList.remove("nav-open");
    text.textContent = translateText(context ? `${context}: ${normalized}` : normalized);
    if (incidentText) incidentText.textContent = `Incidente ${incident.id}`;
    if (build && window.DIPLOCRAFT_BUILD_LABEL) build.textContent = window.DIPLOCRAFT_BUILD_LABEL;
    const health = getResilienceStatus();
    if (recoveryText) recoveryText.textContent = health.snapshots.length ? `${health.snapshots.length} snapshot(s) disponível(is) para recuperação.` : "Nenhum snapshot disponível ainda.";
    translateElement(overlay);
    overlay.classList.add("open");
    return incident;
  };

  window.addEventListener("error", event => {
    if (event.target && event.target !== window) {
      console.warn("[DIPLOCRAFT ASSET WARNING]", event.target.src || event.target.href || event.target.tagName);
      return;
    }
    showErrorHandler(event.error?.message || event.message || "Erro desconhecido", "Falha de execução", event.error);
  });

  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason && (event.reason.message || String(event.reason));
    showErrorHandler(reason || "Falha assíncrona desconhecida", "Falha assíncrona", event.reason);
  });
}

export function reportFatalError(error, context = "Inicialização") {
  const message = error && (error.message || String(error));
  if (showErrorHandler) showErrorHandler(message || "Erro desconhecido", context, error);
  else console.error("[DIPLOCRAFT FATAL]", context, message);
}

function recoverToMenu(overlay) {
  document.body.classList.remove("nav-open", "game-active");
  document.body.dataset.screen = "menu";
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
    screen.setAttribute("aria-hidden", "true");
  });
  const menu = document.getElementById("menu");
  if (menu) {
    menu.classList.add("active");
    menu.setAttribute("aria-hidden", "false");
  }
  document.getElementById("tutorialOverlay")?.classList.remove("open");
  document.getElementById("audioPanel")?.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  document.dispatchEvent(new CustomEvent("diplocraft:screenchange", { detail: { id: "menu" } }));
}

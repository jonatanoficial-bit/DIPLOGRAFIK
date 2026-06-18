import { BUILD } from "./build.js";
import { translateText } from "./i18n.js";

let registration = null;
let deferredPrompt = null;
let reloadOnControllerChange = false;
let initialized = false;

const status = {
  supported: false,
  registered: false,
  ready: false,
  controlled: false,
  standalone: false,
  installed: false,
  installAvailable: false,
  updateAvailable: false,
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  cacheVersion: null,
  serviceWorkerVersion: null,
  lastCheckedAt: null,
  error: null,
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.navigator?.standalone
  );
}

function cloneStatus() {
  return Object.freeze({ ...status });
}

function setButtonState(id, { hidden = false, disabled = false, text = null } = {}) {
  const button = document.getElementById(id);
  if (!button) return;
  button.hidden = hidden;
  button.disabled = disabled;
  if (text) button.textContent = translateText(text);
}

function syncUI() {
  if (typeof document === "undefined") return;
  status.standalone = isStandaloneMode();
  status.installed = status.standalone;
  document.body.classList.toggle("pwa-standalone", status.standalone);
  document.body.classList.toggle("app-offline", !status.online);
  document.documentElement.dataset.network = status.online ? "online" : "offline";

  const canInstall = status.installAvailable && !status.installed;
  setButtonState("installAppBtn", {
    hidden: !canInstall,
    disabled: !canInstall,
    text: "INSTALAR APP",
  });
  setButtonState("installPwaRelease", {
    hidden: false,
    disabled: !canInstall,
    text: status.installed ? "APP INSTALADO" : canInstall ? "INSTALAR APP" : "INSTALAÇÃO INDISPONÍVEL",
  });
  setButtonState("applyPwaUpdate", {
    hidden: false,
    disabled: !status.updateAvailable,
    text: status.updateAvailable ? "APLICAR ATUALIZAÇÃO" : "SEM ATUALIZAÇÃO",
  });
  setButtonState("applyPwaUpdateBanner", { disabled: !status.updateAvailable });

  const banner = document.getElementById("pwaUpdateBanner");
  if (banner) {
    banner.classList.toggle("open", status.updateAvailable);
    banner.setAttribute("aria-hidden", status.updateAvailable ? "false" : "true");
  }
  const network = document.getElementById("networkStatus");
  if (network) {
    network.textContent = translateText(status.online ? (status.standalone ? "APP • ONLINE" : "ONLINE") : "OFFLINE • SAVE LOCAL");
    network.classList.toggle("offline", !status.online);
  }
  document.dispatchEvent(new CustomEvent("diplocraft:pwa-status", { detail: cloneStatus() }));
}

async function queryWorkerVersion(worker) {
  if (!worker || typeof MessageChannel === "undefined") return;
  try {
    const response = await new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => reject(new Error("service worker timeout")), 1600);
      channel.port1.onmessage = event => { clearTimeout(timer); resolve(event.data || {}); };
      worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
    });
    status.serviceWorkerVersion = response.version || null;
    status.cacheVersion = response.cache || null;
  } catch (_) {}
}

function observeRegistration(reg) {
  const evaluate = async worker => {
    if (!worker) return;
    if (worker.state === "installed" && navigator.serviceWorker.controller) {
      status.updateAvailable = true;
      await queryWorkerVersion(worker);
      syncUI();
    }
  };
  if (reg.waiting) {
    status.updateAvailable = true;
    queryWorkerVersion(reg.waiting).finally(syncUI);
  }
  reg.addEventListener("updatefound", () => {
    const installing = reg.installing;
    installing?.addEventListener("statechange", () => evaluate(installing));
  });
}

export function getPWAStatus() {
  return cloneStatus();
}

export async function promptPWAInstall() {
  if (!deferredPrompt) return { accepted: false, reason: "unavailable" };
  try {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    const accepted = choice?.outcome === "accepted";
    deferredPrompt = null;
    status.installAvailable = false;
    if (accepted) status.installed = true;
    syncUI();
    return { accepted, outcome: choice?.outcome || "dismissed" };
  } catch (error) {
    status.error = String(error?.message || error);
    syncUI();
    return { accepted: false, reason: "error" };
  }
}

export async function checkPWAUpdate() {
  status.lastCheckedAt = Date.now();
  if (!registration) {
    syncUI();
    return false;
  }
  try {
    await registration.update();
    if (registration.waiting) status.updateAvailable = true;
    syncUI();
    return status.updateAvailable;
  } catch (error) {
    status.error = String(error?.message || error);
    syncUI();
    return false;
  }
}

export function applyPWAUpdate() {
  const worker = registration?.waiting;
  if (!worker) return false;
  reloadOnControllerChange = true;
  worker.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export async function installPWA() {
  if (initialized || typeof window === "undefined") return cloneStatus();
  initialized = true;
  status.supported = "serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol);
  status.standalone = isStandaloneMode();
  status.installed = status.standalone;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    status.installAvailable = true;
    syncUI();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    status.installed = true;
    status.installAvailable = false;
    syncUI();
  });
  window.addEventListener("online", () => { status.online = true; syncUI(); });
  window.addEventListener("offline", () => { status.online = false; syncUI(); });
  window.matchMedia?.("(display-mode: standalone)").addEventListener?.("change", () => syncUI());

  if (!status.supported) {
    status.error = location.protocol === "file:" ? "Sirva o jogo por HTTP/HTTPS para instalar o app." : "Service Worker não suportado.";
    syncUI();
    return cloneStatus();
  }

  try {
    registration = await navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" });
    status.registered = true;
    observeRegistration(registration);
    await navigator.serviceWorker.ready;
    status.ready = true;
    status.controlled = Boolean(navigator.serviceWorker.controller);
    await queryWorkerVersion(registration.active || navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      status.controlled = true;
      status.updateAvailable = false;
      syncUI();
      if (reloadOnControllerChange) location.reload();
    });
    syncUI();
    return cloneStatus();
  } catch (error) {
    status.error = String(error?.message || error);
    syncUI();
    return cloneStatus();
  }
}

export const PWA = Object.freeze({
  install: promptPWAInstall,
  checkUpdate: checkPWAUpdate,
  applyUpdate: applyPWAUpdate,
  getStatus: getPWAStatus,
});

if (typeof window !== "undefined") window.DIPLOCRAFT_PWA = PWA;

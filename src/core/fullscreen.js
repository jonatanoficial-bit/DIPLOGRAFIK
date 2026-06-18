function isStandalone() {
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.navigator?.standalone
  );
}

export function getFullscreenStatus() {
  const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  return {
    active,
    standalone: isStandalone(),
    supported: Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen),
  };
}

function syncFullscreenUI() {
  const current = getFullscreenStatus();
  document.body.classList.toggle("native-fullscreen", current.active);
  document.body.classList.toggle("pwa-standalone", current.standalone);
  if (!current.active) document.body.classList.remove("fullscreen-mode");
  const label = current.standalone ? "MODO APP" : current.active ? "SAIR DA TELA CHEIA" : current.supported ? "TELA CHEIA" : "TELA AMPLIADA";
  ["fullscreenBtn", "fullscreenHud"].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.textContent = label;
  });
  const mobile = document.getElementById("mobileFullscreen");
  if (mobile) {
    mobile.textContent = current.standalone ? "APP" : current.active ? "×" : "⛶";
    mobile.setAttribute("aria-label", label);
  }
  document.dispatchEvent(new CustomEvent("diplocraft:fullscreen-status", { detail: current }));
}

export async function enterFullscreen() {
  const doc = document;
  const el = document.documentElement;
  if (isStandalone()) {
    syncFullscreenUI();
    return true;
  }
  try {
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      syncFullscreenUI();
      return false;
    }
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else document.body.classList.add("fullscreen-mode");
    syncFullscreenUI();
    return true;
  } catch (_) {
    document.body.classList.add("fullscreen-mode");
    syncFullscreenUI();
    return false;
  }
}

export function installViewportFix() {
  const set = () => {
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
    document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
    syncFullscreenUI();
  };
  set();
  window.addEventListener("resize", set);
  window.addEventListener("orientationchange", () => window.setTimeout(set, 100));
  window.visualViewport?.addEventListener("resize", set);
  document.addEventListener("fullscreenchange", syncFullscreenUI);
  document.addEventListener("webkitfullscreenchange", syncFullscreenUI);
  window.matchMedia?.("(display-mode: standalone)").addEventListener?.("change", syncFullscreenUI);
}

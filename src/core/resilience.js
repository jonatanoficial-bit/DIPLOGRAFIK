import { BUILD } from "./build.js";
import { saveGame, createSnapshot, saveEmergencySnapshot, restoreLatestSnapshot, getStorageDiagnostics } from "./storage.js";

const HEALTH_KEY = "diplocraft_resilience_health_v1";
const INCIDENT_KEY = "diplocraft_runtime_incidents_v1";
const SAFE_MODE_KEY = "diplocraft_safe_mode_v1";
const BOOT_GUARD_KEY = "diplocraft_boot_guard_v1";
const MAX_INCIDENTS = 12;
const AUTOSAVE_DELAY = 900;
const AUTOSAVE_INTERVAL = 30000;

let getState = () => null;
let applyRestoredState = () => {};
let autosaveTimer = null;
let periodicTimer = null;
let watchdogTimer = null;
let lastFingerprint = "";
let lastHeartbeat = Date.now();
let lastTick = Date.now();
let safeMode = false;
let health = readJSON(HEALTH_KEY, defaultHealth());

export function installResilience(options = {}) {
  getState = typeof options.getState === "function" ? options.getState : getState;
  applyRestoredState = typeof options.applyRestoredState === "function" ? options.applyRestoredState : applyRestoredState;
  safeMode = readSafeMode() || detectBootLoop();
  applySafeModeClass();
  markBootStarting();

  periodicTimer = setInterval(() => {
    if (document.visibilityState === "visible") scheduleAutosave(getState(), "periodic");
  }, AUTOSAVE_INTERVAL);

  watchdogTimer = setInterval(() => {
    const now = Date.now();
    const eventLoopLag = Math.max(0, now - lastTick - 2000);
    lastTick = now;
    health.lastWatchdogAt = new Date(now).toISOString();
    health.eventLoopLagMs = eventLoopLag;
    health.lastHeartbeatAgeMs = now - lastHeartbeat;
    if (eventLoopLag > 8000) recordIncident(new Error(`Event loop bloqueado por ${eventLoopLag}ms`), "Watchdog", { severity: "warning", snapshot: false });
    persistHealth();
    updateBanner();
  }, 2000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAutosave("visibility-hidden");
  });
  window.addEventListener("pagehide", () => flushAutosave("pagehide"));

  setTimeout(() => markBootStable(), 3500);
  exposeDiagnosticsAPI();
  updateBanner();
  return getResilienceController();
}

export function getResilienceController() {
  return {
    heartbeat,
    checkpoint,
    scheduleAutosave,
    flushAutosave,
    recordIncident,
    restoreLatest: restoreLatest,
    setSafeMode,
    exportDiagnostics,
    status: getResilienceStatus,
    destroy: stopResilience
  };
}

export function heartbeat(context = "render") {
  lastHeartbeat = Date.now();
  health.lastHeartbeatAt = new Date(lastHeartbeat).toISOString();
  health.lastContext = context;
  persistHealth();
}

export function scheduleAutosave(state, reason = "state-change") {
  if (!state || typeof state !== "object") return;
  const fingerprint = stateFingerprint(state);
  if (fingerprint === lastFingerprint && reason !== "manual") return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    const current = getState() || state;
    if (saveGame(current, { reason: `autosave:${reason}` })) {
      lastFingerprint = stateFingerprint(current);
      health.lastAutosaveAt = new Date().toISOString();
      health.autosaveCount = Number(health.autosaveCount || 0) + 1;
      persistHealth();
    }
  }, safeMode ? 1600 : AUTOSAVE_DELAY);
}

export function flushAutosave(reason = "flush") {
  clearTimeout(autosaveTimer);
  const state = getState();
  if (!state || typeof state !== "object") return false;
  const ok = saveGame(state, { reason: `autosave:${reason}` });
  if (ok) {
    lastFingerprint = stateFingerprint(state);
    health.lastAutosaveAt = new Date().toISOString();
    health.autosaveCount = Number(health.autosaveCount || 0) + 1;
    persistHealth();
  }
  return ok;
}

export function checkpoint(reason = "checkpoint") {
  const state = getState();
  if (!state) return false;
  return createSnapshot(state, reason);
}

export function recordIncident(error, context = "Runtime", options = {}) {
  const incident = {
    id: incidentId(),
    at: new Date().toISOString(),
    build: BUILD.version,
    context,
    severity: options.severity || "fatal",
    message: String(error?.message || error || "Erro desconhecido").slice(0, 1200),
    stack: String(error?.stack || "").slice(0, 5000),
    safeMode
  };
  const incidents = getIncidents();
  incidents.unshift(incident);
  writeJSON(INCIDENT_KEY, incidents.slice(0, MAX_INCIDENTS));
  health.lastIncident = incident;
  health.incidentCount = Number(health.incidentCount || 0) + 1;
  health.status = incident.severity === "fatal" ? "degraded" : health.status;
  persistHealth();
  if (options.snapshot !== false) saveEmergencySnapshot(getState(), `${context}:${incident.id}`);
  if (recentFatalCount(incidents) >= 3) setSafeMode(true, "falhas-repetidas");
  updateBanner();
  return incident;
}

export function restoreLatest() {
  const restored = restoreLatestSnapshot({ writePrimary: true, includeEmergency: true });
  if (!restored) return null;
  try {
    applyRestoredState(restored);
    health.lastRecoveryAt = new Date().toISOString();
    health.recoveryCount = Number(health.recoveryCount || 0) + 1;
    health.status = "recovered";
    persistHealth();
    heartbeat("snapshot-restored");
    return restored;
  } catch (error) {
    recordIncident(error, "Aplicação do snapshot restaurado", { snapshot: false });
    return null;
  }
}

export function setSafeMode(enabled, reason = "manual") {
  safeMode = Boolean(enabled);
  try { localStorage.setItem(SAFE_MODE_KEY, JSON.stringify({ enabled: safeMode, reason, at: new Date().toISOString(), build: BUILD.version })); } catch (error) {}
  health.safeMode = safeMode;
  health.safeModeReason = safeMode ? reason : null;
  if (safeMode) {
    document.body.classList.add("safe-mode");
    const audio = document.getElementById("audioPanel");
    if (audio) audio.classList.remove("open");
  } else {
    document.body.classList.remove("safe-mode");
  }
  persistHealth();
  updateBanner();
  return safeMode;
}

export function getResilienceStatus() {
  const incidents = getIncidents();
  const storage = getStorageDiagnostics();
  return {
    installed: Boolean(watchdogTimer),
    status: health.status || "healthy",
    safeMode,
    safeModeReason: health.safeModeReason || null,
    lastHeartbeatAt: health.lastHeartbeatAt || null,
    heartbeatAgeMs: Date.now() - lastHeartbeat,
    eventLoopLagMs: health.eventLoopLagMs || 0,
    lastAutosaveAt: health.lastAutosaveAt || null,
    autosaveCount: health.autosaveCount || 0,
    recoveryCount: health.recoveryCount || 0,
    incidentCount: health.incidentCount || incidents.length,
    recentIncidents: incidents.slice(0, 5),
    snapshots: storage.snapshots,
    lastRecovery: storage.lastRecovery,
    lastStorageError: storage.lastError,
    build: BUILD.version
  };
}

export function exportDiagnostics() {
  const payload = {
    generatedAt: new Date().toISOString(),
    build: BUILD,
    resilience: getResilienceStatus(),
    storage: getStorageDiagnostics(),
    userAgent: navigator.userAgent,
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio || 1 },
    online: navigator.onLine,
    visibility: document.visibilityState
  };
  const text = JSON.stringify(payload, null, 2);
  try {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `DIPLOCRAFT_diagnostico_v${BUILD.version}_${Date.now()}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.info("[DIPLOCRAFT DIAGNOSTICS]", text);
  }
  return payload;
}

export function stopResilience() {
  clearTimeout(autosaveTimer);
  clearInterval(periodicTimer);
  clearInterval(watchdogTimer);
  periodicTimer = null;
  watchdogTimer = null;
}

function markBootStarting() {
  const previous = readJSON(BOOT_GUARD_KEY, { attempts: 0 });
  writeJSON(BOOT_GUARD_KEY, { status: "starting", attempts: Number(previous.attempts || 0) + 1, at: Date.now(), build: BUILD.version });
  health.bootAttempts = Number(previous.attempts || 0) + 1;
  persistHealth();
}

function markBootStable() {
  writeJSON(BOOT_GUARD_KEY, { status: "stable", attempts: 0, at: Date.now(), build: BUILD.version });
  health.status = safeMode ? "safe-mode" : "healthy";
  health.bootStableAt = new Date().toISOString();
  persistHealth();
  updateBanner();
}

function detectBootLoop() {
  const guard = readJSON(BOOT_GUARD_KEY, null);
  if (!guard || guard.status !== "starting") return false;
  const recent = Date.now() - Number(guard.at || 0) < 120000;
  return recent && Number(guard.attempts || 0) >= 2;
}

function readSafeMode() {
  const stored = readJSON(SAFE_MODE_KEY, null);
  return Boolean(stored?.enabled);
}

function applySafeModeClass() {
  document.body.classList.toggle("safe-mode", safeMode);
}

function updateBanner() {
  const banner = document.getElementById("safeModeBanner");
  if (!banner) return;
  banner.classList.toggle("open", safeMode);
  const text = banner.querySelector("span");
  if (text) text.textContent = safeMode ? `Modo seguro ativo${health.safeModeReason ? ` • ${health.safeModeReason}` : ""}` : "";
}

function exposeDiagnosticsAPI() {
  window.DIPLOCRAFT_RESILIENCE = Object.freeze({
    getStatus: getResilienceStatus,
    restoreLatest,
    setSafeMode,
    exportDiagnostics,
    checkpoint,
    recordTestIncident: message => recordIncident(new Error(message || "teste"), "Teste controlado", { snapshot: false })
  });
}

function recentFatalCount(incidents) {
  const cutoff = Date.now() - 5 * 60 * 1000;
  return incidents.filter(item => item.severity === "fatal" && (Date.parse(item.at) || 0) >= cutoff).length;
}

function stateFingerprint(state) {
  return [state.day, state.month, state.year, state.treasury, state.approval, state.politicalCapital, state.feed?.length || 0, state.projects?.length || 0].join("|");
}

function incidentId() {
  return `INC-${BUILD.stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function getIncidents() {
  const value = readJSON(INCIDENT_KEY, []);
  return Array.isArray(value) ? value : [];
}

function defaultHealth() {
  return { status: "starting", incidentCount: 0, autosaveCount: 0, recoveryCount: 0, safeMode: false };
}

function persistHealth() {
  health.safeMode = safeMode;
  writeJSON(HEALTH_KEY, health);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
}

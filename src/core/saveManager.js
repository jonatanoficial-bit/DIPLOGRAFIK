import {
  MAX_PROFILES,
  ensureSaveArchitecture,
  getCareerRegistry,
  getActiveCareer,
  selectActiveCareer,
  createProfile,
  renameProfile,
  deleteProfile,
  renameSlot,
  saveGame,
  loadGame,
  deleteSave,
  createManualBackup,
  listManualBackups,
  restoreManualBackup,
  deleteManualBackup,
  exportCareerBundle,
  importCareerBundle,
  getCareerHistory,
  getStorageDiagnostics,
  getLastStorageError
} from "./storage.js";
import { t, translateElement, getLocale } from "./i18n.js";
import { BUILD } from "./build.js";

let getState = () => null;
let applyState = () => false;
let notify = () => {};
let afterLoad = () => {};
let installed = false;

export function installSaveManager(options = {}) {
  getState = typeof options.getState === "function" ? options.getState : getState;
  applyState = typeof options.applyState === "function" ? options.applyState : applyState;
  notify = typeof options.feedback === "function" ? options.feedback : notify;
  afterLoad = typeof options.afterLoad === "function" ? options.afterLoad : afterLoad;
  ensureSaveArchitecture();
  if (!installed) bindStaticEvents();
  installed = true;
  refreshSaveManager();
  const publicApi = Object.freeze({
    open: openSaveManager,
    close: closeSaveManager,
    refresh: refreshSaveManager,
    diagnostics: getStorageDiagnostics,
    registry: getCareerRegistry,
    active: getActiveCareer,
    select: selectActiveCareer,
    createProfile,
    renameProfile,
    deleteProfile,
    renameSlot,
    save: (state, options = {}) => saveGame(state ?? getState(), options),
    load: loadGame,
    clear: deleteSave,
    createBackup: (label, options = {}) => createManualBackup(getState(), label, options),
    backups: listManualBackups,
    restoreBackup: restoreManualBackup,
    deleteBackup: deleteManualBackup,
    exportBundle: exportCareerBundle,
    importBundle: importCareerBundle,
    history: getCareerHistory
  });
  if (typeof window !== "undefined") window.DIPLOCRAFT_SAVE_ARCHITECTURE = publicApi;
  return publicApi;
}


export function quickBackupCurrent(label = t("save.defaultBackupName")) {
  const active = getActiveCareer();
  if (!active) return null;
  const backup = createManualBackup(getState(), label, active);
  if (backup) { notify(t("save.backupSuccess"), "positive"); refreshSaveManager(); }
  else notify(getLastStorageError() || t("runtime.saveFail"), "negative");
  return backup;
}

export function quickExportActive() {
  const active = getActiveCareer();
  if (!active) return false;
  try {
    downloadText(exportCareerBundle(active), exportFilename(active.profileId, active.slotId));
    notify(t("save.exportSuccess"), "positive");
    refreshSaveManager();
    return true;
  } catch (error) { notify(String(error.message || error), "negative"); return false; }
}

export function openSaveManager() {
  const overlay = document.getElementById("saveManagerOverlay");
  if (!overlay) return false;
  refreshSaveManager();
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("save-manager-open");
  setTimeout(() => document.getElementById("saveManagerClose")?.focus(), 20);
  return true;
}

export function closeSaveManager() {
  const overlay = document.getElementById("saveManagerOverlay");
  if (!overlay) return false;
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("save-manager-open");
  return true;
}

export function refreshSaveManager() {
  const profileSelect = document.getElementById("saveProfileSelect");
  const slots = document.getElementById("saveSlots");
  if (!profileSelect || !slots) return;
  const registry = getCareerRegistry();
  const active = getActiveCareer();
  profileSelect.innerHTML = registry.profiles.map(profile => `<option value="${escapeHTML(profile.id)}" ${profile.id === active?.profileId ? "selected" : ""}>${escapeHTML(profile.name)}</option>`).join("");
  profileSelect.setAttribute("aria-label", t("save.profileSelect"));
  document.getElementById("saveProfileLimit").textContent = t("save.profileCount", { count: registry.profiles.length, max: MAX_PROFILES });

  const profile = registry.profiles.find(item => item.id === active?.profileId) || registry.profiles[0];
  slots.innerHTML = profile.slots.map(slot => renderSlot(profile, slot, active)).join("");
  renderBackups(active);
  renderHistory();
  renderHealth();
  bindDynamicEvents();
  translateElement(document.getElementById("saveManagerOverlay"));
}

function bindStaticEvents() {
  document.getElementById("saveManagerClose")?.addEventListener("click", closeSaveManager);
  document.getElementById("saveManagerOverlay")?.addEventListener("click", event => {
    if (event.target.id === "saveManagerOverlay") closeSaveManager();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.getElementById("saveManagerOverlay")?.classList.contains("open")) closeSaveManager();
  });
  document.getElementById("saveProfileSelect")?.addEventListener("change", event => {
    const registry = getCareerRegistry();
    const profile = registry.profiles.find(item => item.id === event.target.value);
    if (!profile) return;
    selectActiveCareer(profile.id, profile.slots[0].id);
    notify(t("save.profileActivated", { name: profile.name }), "info");
    refreshSaveManager();
  });
  document.getElementById("saveProfileCreate")?.addEventListener("click", () => {
    const name = prompt(t("save.promptProfileName"), t("save.defaultProfileName"));
    if (name === null) return;
    try {
      const profile = createProfile(name);
      notify(t("save.profileCreated", { name: profile.name }), "positive");
      refreshSaveManager();
    } catch (error) { notify(String(error.message || error), "warning"); }
  });
  document.getElementById("saveProfileRename")?.addEventListener("click", () => {
    const active = getActiveCareer();
    if (!active) return;
    const name = prompt(t("save.promptRenameProfile"), active.profile.name);
    if (name === null) return;
    try { renameProfile(active.profileId, name); notify(t("save.profileRenamed"), "positive"); refreshSaveManager(); }
    catch (error) { notify(String(error.message || error), "warning"); }
  });
  document.getElementById("saveProfileDelete")?.addEventListener("click", () => {
    const active = getActiveCareer();
    if (!active || !confirm(t("save.confirmDeleteProfile", { name: active.profile.name }))) return;
    try { deleteProfile(active.profileId); notify(t("save.profileDeleted"), "warning"); refreshSaveManager(); }
    catch (error) { notify(String(error.message || error), "warning"); }
  });
  document.getElementById("importCareerBtn")?.addEventListener("click", () => document.getElementById("importCareerInput")?.click());
  document.getElementById("importCareerInput")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const active = getActiveCareer();
      if (!active) throw new Error(t("save.noActiveCareer"));
      if (active.slot.hasSave && !confirm(t("save.confirmOverwriteImport", { slot: active.slot.name }))) return;
      const imported = importCareerBundle(await file.text(), { profileId: active.profileId, slotId: active.slotId, overwrite: true });
      applyState(imported);
      afterLoad(imported, { source: "import" });
      notify(t("save.importSuccess"), "positive");
      refreshSaveManager();
    } catch (error) { notify(t("save.importFailed", { error: error.message || error }), "negative"); }
  });
  document.addEventListener("diplocraft:storagechange", () => {
    if (document.getElementById("saveManagerOverlay")?.classList.contains("open")) refreshSaveManager();
  });
  document.addEventListener("diplocraft:localechange", () => refreshSaveManager());
}

function bindDynamicEvents() {
  document.querySelectorAll("[data-save-action]").forEach(button => {
    button.onclick = () => handleSlotAction(button.dataset.saveAction, button.dataset.profileId, button.dataset.slotId);
  });
  document.querySelectorAll("[data-backup-action]").forEach(button => {
    button.onclick = () => handleBackupAction(button.dataset.backupAction, button.dataset.backupId);
  });
}

function handleSlotAction(action, profileId, slotId) {
  try {
    if (action === "activate") {
      selectActiveCareer(profileId, slotId);
      notify(t("save.slotActivated"), "info");
    } else if (action === "load") {
      selectActiveCareer(profileId, slotId);
      const loaded = loadGame({ profileId, slotId });
      if (!loaded) throw new Error(getLastStorageError() || t("save.emptySlot"));
      applyState(loaded);
      afterLoad(loaded, { source: "slot", profileId, slotId });
      closeSaveManager();
      notify(t("save.loadSuccess"), "positive");
    } else if (action === "save") {
      selectActiveCareer(profileId, slotId);
      if (!saveGame(getState(), { profileId, slotId, reason: "manual-slot" })) throw new Error(getLastStorageError() || t("runtime.saveFail"));
      notify(t("save.saveSuccess"), "positive");
    } else if (action === "backup") {
      selectActiveCareer(profileId, slotId);
      const label = prompt(t("save.promptBackupName"), t("save.defaultBackupName"));
      if (label === null) return;
      const backup = createManualBackup(getState(), label, { profileId, slotId });
      if (!backup) throw new Error(getLastStorageError());
      notify(t("save.backupSuccess"), "positive");
    } else if (action === "export") {
      const text = exportCareerBundle({ profileId, slotId });
      downloadText(text, exportFilename(profileId, slotId));
      notify(t("save.exportSuccess"), "positive");
    } else if (action === "rename") {
      const registry = getCareerRegistry();
      const slot = registry.profiles.find(item => item.id === profileId)?.slots.find(item => item.id === slotId);
      const name = prompt(t("save.promptRenameSlot"), slot?.name || "");
      if (name === null) return;
      renameSlot(profileId, slotId, name);
      notify(t("save.slotRenamed"), "positive");
    } else if (action === "clear") {
      const registry = getCareerRegistry();
      const slot = registry.profiles.find(item => item.id === profileId)?.slots.find(item => item.id === slotId);
      if (!confirm(t("save.confirmClearSlot", { slot: slot?.name || "" }))) return;
      deleteSave({ profileId, slotId });
      notify(t("save.slotCleared"), "warning");
    }
    refreshSaveManager();
  } catch (error) {
    notify(String(error.message || error), "negative");
  }
}

function handleBackupAction(action, backupId) {
  const active = getActiveCareer();
  if (!active) return;
  try {
    if (action === "restore") {
      if (!confirm(t("save.confirmRestoreBackup"))) return;
      const restored = restoreManualBackup(backupId, active);
      if (!restored) throw new Error(t("save.backupInvalid"));
      applyState(restored);
      afterLoad(restored, { source: "manual-backup" });
      notify(t("save.backupRestored"), "positive");
      closeSaveManager();
    } else if (action === "delete") {
      if (!confirm(t("save.confirmDeleteBackup"))) return;
      deleteManualBackup(backupId, active);
      notify(t("save.backupDeleted"), "warning");
    }
    refreshSaveManager();
  } catch (error) { notify(String(error.message || error), "negative"); }
}

function renderSlot(profile, slot, active) {
  const isActive = profile.id === active?.profileId && slot.id === active?.slotId;
  const date = slot.gameDate ? `${String(slot.gameDate.day).padStart(2, "0")}/${String(slot.gameDate.month).padStart(2, "0")}/${slot.gameDate.year}` : t("save.noGameDate");
  const savedAt = slot.savedAt ? new Date(slot.savedAt).toLocaleString(getLocale()) : t("save.neverSaved");
  return `<article class="saveSlotCard ${isActive ? "active" : ""} ${slot.hasSave ? "occupied" : "empty"}">
    <header><div><small>${isActive ? t("save.activeSlot") : t("save.slot")}</small><h4>${escapeHTML(slot.name)}</h4></div><span class="saveSlotState">${slot.hasSave ? t("save.occupied") : t("save.empty")}</span></header>
    <div class="saveSlotSummary"><b>${escapeHTML(slot.leader || t("save.noLeader"))}</b><span>${escapeHTML(slot.party || "—")} • ${date}</span><small>${savedAt}${slot.build ? ` • v${escapeHTML(slot.build)}` : ""}</small></div>
    <div class="saveSlotActions">
      <button class="dark" data-save-action="activate" data-profile-id="${escapeHTML(profile.id)}" data-slot-id="${escapeHTML(slot.id)}" type="button">${isActive ? t("save.active") : t("save.activate")}</button>
      <button class="gold" data-save-action="load" data-profile-id="${escapeHTML(profile.id)}" data-slot-id="${escapeHTML(slot.id)}" ${slot.hasSave ? "" : "disabled"} type="button">${t("save.load")}</button>
      <button class="dark" data-save-action="save" data-profile-id="${escapeHTML(profile.id)}" data-slot-id="${escapeHTML(slot.id)}" type="button">${t("save.saveHere")}</button>
      <button class="dark" data-save-action="backup" data-profile-id="${escapeHTML(profile.id)}" data-slot-id="${escapeHTML(slot.id)}" type="button">${t("save.backup")}</button>
      <button class="ghost" data-save-action="export" data-profile-id="${escapeHTML(profile.id)}" data-slot-id="${escapeHTML(slot.id)}" ${slot.hasSave ? "" : "disabled"} type="button">${t("save.export")}</button>
      <button class="ghost" data-save-action="rename" data-profile-id="${escapeHTML(profile.id)}" data-slot-id="${escapeHTML(slot.id)}" type="button">${t("save.rename")}</button>
      <button class="danger" data-save-action="clear" data-profile-id="${escapeHTML(profile.id)}" data-slot-id="${escapeHTML(slot.id)}" ${slot.hasSave || (slot.manualBackups || []).length ? "" : "disabled"} type="button">${t("save.clear")}</button>
    </div>
  </article>`;
}

function renderBackups(active) {
  const container = document.getElementById("saveBackups");
  if (!container || !active) return;
  const backups = listManualBackups(active);
  container.innerHTML = backups.length ? backups.map(item => `<div class="saveBackupItem"><div><b>${escapeHTML(item.label)}</b><span>${new Date(item.savedAt).toLocaleString(getLocale())}</span><small>${escapeHTML(item.leader || "")} • v${escapeHTML(item.build || "?")}</small></div><div><button class="dark" data-backup-action="restore" data-backup-id="${escapeHTML(item.id)}" type="button">${t("save.restore")}</button><button class="danger" data-backup-action="delete" data-backup-id="${escapeHTML(item.id)}" type="button">${t("save.delete")}</button></div></div>`).join("") : `<p class="saveEmptyNote">${t("save.noBackups")}</p>`;
}

function renderHistory() {
  const container = document.getElementById("saveHistory");
  if (!container) return;
  const history = getCareerHistory(20);
  container.innerHTML = history.length ? history.map(item => `<div class="saveHistoryItem"><b>${escapeHTML(historyLabel(item.action))}</b><span>${escapeHTML(item.profileName)} • ${escapeHTML(item.slotName)}</span><small>${new Date(item.at).toLocaleString(getLocale())}${item.detail ? ` • ${escapeHTML(item.detail)}` : ""}</small></div>`).join("") : `<p class="saveEmptyNote">${t("save.noHistory")}</p>`;
}

function renderHealth() {
  const container = document.getElementById("saveManagerHealth");
  if (!container) return;
  const info = getStorageDiagnostics();
  container.innerHTML = `<div><b>${t("save.profiles")}</b><span>${info.profileCount}/${MAX_PROFILES}</span></div><div><b>${t("save.occupiedSlots")}</b><span>${info.occupiedSlots}</span></div><div><b>${t("save.schema")}</b><span>${info.saveSchema}</span></div><div><b>${t("save.snapshots")}</b><span>${info.snapshots.length}</span></div>`;
}

function historyLabel(action) {
  const key = `save.history.${action}`;
  const translated = t(key, {}, action);
  return translated === key ? action : translated;
}

function exportFilename(profileId, slotId) {
  const registry = getCareerRegistry();
  const profile = registry.profiles.find(item => item.id === profileId);
  const slot = profile?.slots.find(item => item.id === slotId);
  const safe = `${profile?.name || "perfil"}_${slot?.name || "carreira"}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `DIPLOCRAFT_${safe || "carreira"}_v${BUILD.version}_${Date.now()}.json`;
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

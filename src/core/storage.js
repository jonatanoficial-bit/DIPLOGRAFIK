import { BUILD } from "./build.js";

// Fase 13 — Save Architecture
// O save legado continua reconhecido, mas toda gravação nova é isolada por perfil e slot.
const LEGACY_SAVE_KEY = BUILD.saveKey || "diplocraft_save_v101";
const OLD_KEYS = ["diplocraft_save_v071", "diplocraft_save_v070", "diplocraft_save_v061", "diplocraft_save_v05", "diplocraft_save"];
const REGISTRY_KEY = "diplocraft_save_registry_v1";
const MIGRATION_KEY = "diplocraft_save_architecture_migration_v1";
const LEGACY_BACKUP_KEY = `${LEGACY_SAVE_KEY}_schema2_rollback_backup`;
const CORRUPT_PREFIX = "diplocraft_corrupt_backup_";
const REGISTRY_FORMAT = "diplocraft-save-registry";
const EXPORT_FORMAT = "diplocraft-career-export";
const REGISTRY_SCHEMA = 1;
const EXPORT_SCHEMA = 1;
export const MAX_PROFILES = 4;
export const SLOTS_PER_PROFILE = 3;
const MAX_SNAPSHOTS = 3;
const MAX_MANUAL_BACKUPS = 5;
const MAX_HISTORY = 60;

let lastStorageError = "";
let lastRecovery = null;
let architectureReady = false;

export function ensureSaveArchitecture() {
  if (architectureReady) return getCareerRegistry();
  let data = readRegistryData();
  if (!data) {
    data = defaultRegistryData();
    writeRegistryData(data);
  }
  migrateLegacyStorage(data);
  architectureReady = true;
  return clone(data);
}

export function getCareerRegistry() {
  const data = readRegistryData() || defaultRegistryData();
  return clone(data);
}

export function getActiveCareer() {
  const data = readRegistryData() || defaultRegistryData();
  const profile = data.profiles.find(item => item.id === data.activeProfileId) || data.profiles[0];
  const slot = profile?.slots.find(item => item.id === data.activeSlotId) || profile?.slots[0] || null;
  return profile && slot ? { profileId: profile.id, slotId: slot.id, profile: clone(profile), slot: clone(slot) } : null;
}

export function selectActiveCareer(profileId, slotId) {
  const data = requireRegistry();
  const target = resolveTarget(data, profileId, slotId);
  data.activeProfileId = target.profile.id;
  data.activeSlotId = target.slot.id;
  target.profile.updatedAt = nowISO();
  recordHistory(data, "career-selected", target, `${target.profile.name} • ${target.slot.name}`);
  writeRegistryData(data);
  recoverPendingTransaction(target);
  return clone({ profileId: target.profile.id, slotId: target.slot.id, profile: target.profile, slot: target.slot });
}

export function createProfile(name = "") {
  const data = requireRegistry();
  if (data.profiles.length >= MAX_PROFILES) throw new Error(`limite de ${MAX_PROFILES} perfis atingido`);
  const id = uniqueId("profile");
  const profile = makeProfile(id, sanitizeName(name, `Perfil ${data.profiles.length + 1}`));
  data.profiles.push(profile);
  data.activeProfileId = profile.id;
  data.activeSlotId = profile.slots[0].id;
  recordHistory(data, "profile-created", { profile, slot: profile.slots[0] }, profile.name);
  writeRegistryData(data);
  return clone(profile);
}

export function renameProfile(profileId, name) {
  const data = requireRegistry();
  const profile = data.profiles.find(item => item.id === profileId);
  if (!profile) throw new Error("perfil não encontrado");
  profile.name = sanitizeName(name, profile.name);
  profile.updatedAt = nowISO();
  const slot = profile.slots.find(item => item.id === data.activeSlotId) || profile.slots[0];
  recordHistory(data, "profile-renamed", { profile, slot }, profile.name);
  writeRegistryData(data);
  return clone(profile);
}

export function deleteProfile(profileId) {
  const data = requireRegistry();
  if (data.profiles.length <= 1) throw new Error("o último perfil não pode ser excluído");
  const index = data.profiles.findIndex(item => item.id === profileId);
  if (index < 0) throw new Error("perfil não encontrado");
  const [profile] = data.profiles.splice(index, 1);
  profile.slots.forEach(slot => removeSlotStorage(profile.id, slot.id, true));
  if (data.activeProfileId === profile.id) {
    data.activeProfileId = data.profiles[0].id;
    data.activeSlotId = data.profiles[0].slots[0].id;
  }
  recordHistory(data, "profile-deleted", { profile, slot: profile.slots[0] }, profile.name);
  writeRegistryData(data);
  return true;
}

export function renameSlot(profileId, slotId, name) {
  const data = requireRegistry();
  const target = resolveTarget(data, profileId, slotId);
  target.slot.name = sanitizeName(name, target.slot.name);
  target.slot.updatedAt = nowISO();
  recordHistory(data, "slot-renamed", target, target.slot.name);
  writeRegistryData(data);
  return clone(target.slot);
}

export function saveGame(state, options = {}) {
  const reason = options.reason || "manual";
  try {
    const data = requireRegistry();
    const target = resolveTarget(data, options.profileId, options.slotId);
    const keys = slotKeys(target.profile.id, target.slot.id);
    const normalized = prepareState(state, target);
    const envelope = makeEnvelope(normalized, reason, false, target);
    const serialized = JSON.stringify(envelope);
    const previous = safeGet(keys.primary);

    localStorage.setItem(keys.pending, serialized);
    const pending = parseEnvelope(localStorage.getItem(keys.pending), keys.pending, false);
    if (!pending) throw new Error("falha ao validar a gravação temporária");

    if (previous) rotateSnapshotRaw(previous, reason === "manual" ? "pre-manual-save" : "pre-save", target);
    localStorage.setItem(keys.primary, serialized);
    localStorage.removeItem(keys.pending);
    updateSlotSummary(target.slot, envelope);
    target.profile.updatedAt = envelope.savedAt;
    data.activeProfileId = target.profile.id;
    data.activeSlotId = target.slot.id;
    recordHistory(data, reason.startsWith("autosave:") ? "autosave" : "save", target, reason, envelope.savedAt);
    writeRegistryData(data);
    lastStorageError = "";
    lastRecovery = { type: "save", reason, savedAt: envelope.savedAt, profileId: target.profile.id, slotId: target.slot.id };
    return true;
  } catch (error) {
    lastStorageError = `Não foi possível salvar: ${error?.message || error}`;
    console.error("[DIPLOCRAFT STORAGE]", lastStorageError);
    return false;
  }
}

export function loadGame(options = {}) {
  lastStorageError = "";
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  recoverPendingTransaction(target);
  const keys = slotKeys(target.profile.id, target.slot.id);
  const raw = safeGet(keys.primary);
  if (raw) {
    const parsed = parseEnvelope(raw, keys.primary, true);
    if (parsed) {
      updateSlotSummary(target.slot, parsed);
      data.activeProfileId = target.profile.id;
      data.activeSlotId = target.slot.id;
      recordHistory(data, "load", target, parsed.reason || "primary", parsed.savedAt);
      writeRegistryData(data);
      lastRecovery = { type: "primary", source: keys.primary, savedAt: parsed.savedAt || null, profileId: target.profile.id, slotId: target.slot.id };
      return parsed.state;
    }
  }

  const recovered = restoreLatestSnapshot({ profileId: target.profile.id, slotId: target.slot.id, writePrimary: true, includeEmergency: true });
  if (recovered) {
    lastStorageError = "O save principal estava indisponível. O snapshot mais recente deste slot foi restaurado automaticamente.";
    return recovered;
  }
  return null;
}

export function hasActiveSave() {
  const data = requireRegistry();
  const target = resolveTarget(data);
  return Boolean(safeGet(slotKeys(target.profile.id, target.slot.id).primary));
}

export function hasAnyCareerSave() {
  const data = requireRegistry();
  return data.profiles.some(profile => profile.slots.some(slot => Boolean(safeGet(slotKeys(profile.id, slot.id).primary))));
}

export function createSnapshot(state, reason = "manual-snapshot", options = {}) {
  try {
    const data = requireRegistry();
    const target = resolveTarget(data, options.profileId, options.slotId);
    const envelope = makeEnvelope(prepareState(state, target), reason, false, target);
    rotateSnapshotRaw(JSON.stringify(envelope), reason, target);
    recordHistory(data, "snapshot-created", target, reason, envelope.savedAt);
    writeRegistryData(data);
    lastStorageError = "";
    return true;
  } catch (error) {
    lastStorageError = `Não foi possível criar snapshot: ${error?.message || error}`;
    return false;
  }
}

export function saveEmergencySnapshot(state, reason = "runtime-failure", options = {}) {
  try {
    const data = requireRegistry();
    const target = resolveTarget(data, options.profileId, options.slotId);
    const envelope = makeEnvelope(prepareState(state, target), reason, true, target);
    localStorage.setItem(slotKeys(target.profile.id, target.slot.id).emergency, JSON.stringify(envelope));
    recordHistory(data, "emergency-snapshot", target, reason, envelope.savedAt);
    writeRegistryData(data);
    return true;
  } catch (error) {
    console.error("[DIPLOCRAFT STORAGE] Falha no snapshot de emergência", error);
    return false;
  }
}

export function restoreLatestSnapshot(options = {}) {
  const writePrimary = options.writePrimary !== false;
  const includeEmergency = options.includeEmergency !== false;
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  const keys = slotKeys(target.profile.id, target.slot.id);
  const candidates = [];
  if (includeEmergency) candidates.push({ key: keys.emergency, priority: 100 });
  keys.snapshots.forEach((key, index) => candidates.push({ key, priority: 50 - index }));

  const valid = candidates.map(item => {
    const raw = safeGet(item.key);
    if (!raw) return null;
    const parsed = parseEnvelope(raw, item.key, false);
    if (!parsed) return null;
    return { ...item, raw, parsed, time: Date.parse(parsed.savedAt || 0) || item.priority };
  }).filter(Boolean).sort((a, b) => b.time - a.time || b.priority - a.priority);

  const selected = valid[0];
  if (!selected) return null;
  try {
    if (writePrimary) localStorage.setItem(keys.primary, selected.raw);
    updateSlotSummary(target.slot, selected.parsed);
    target.profile.updatedAt = nowISO();
    recordHistory(data, "snapshot-restored", target, selected.key, selected.parsed.savedAt);
    writeRegistryData(data);
    lastRecovery = { type: "snapshot", source: selected.key, savedAt: selected.parsed.savedAt || null, profileId: target.profile.id, slotId: target.slot.id };
    lastStorageError = "";
    return selected.parsed.state;
  } catch (error) {
    lastStorageError = `Falha ao restaurar snapshot: ${error?.message || error}`;
    return null;
  }
}

export function getSnapshotSummary(options = {}) {
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  const keys = slotKeys(target.profile.id, target.slot.id);
  const snapshots = [];
  for (const key of [keys.emergency, ...keys.snapshots]) {
    const raw = safeGet(key);
    if (!raw) continue;
    const parsed = parseEnvelope(raw, key, false);
    if (!parsed) continue;
    snapshots.push({ key, savedAt: parsed.savedAt, reason: parsed.reason, build: parsed.build, schema: parsed.schema, emergency: Boolean(parsed.emergency), profileId: target.profile.id, slotId: target.slot.id });
  }
  return snapshots.sort((a, b) => (Date.parse(b.savedAt || 0) || 0) - (Date.parse(a.savedAt || 0) || 0));
}

export function createManualBackup(state, label = "Backup manual", options = {}) {
  try {
    const data = requireRegistry();
    const target = resolveTarget(data, options.profileId, options.slotId);
    const backupId = uniqueId("backup");
    const envelope = makeEnvelope(prepareState(state, target), `manual-backup:${sanitizeName(label, "Backup manual")}`, false, target);
    const key = manualBackupKey(target.profile.id, target.slot.id, backupId);
    localStorage.setItem(key, JSON.stringify(envelope));
    target.slot.manualBackups = Array.isArray(target.slot.manualBackups) ? target.slot.manualBackups : [];
    target.slot.manualBackups.unshift({ id: backupId, key, label: sanitizeName(label, "Backup manual"), savedAt: envelope.savedAt, leader: envelope.state.leader, build: envelope.build });
    while (target.slot.manualBackups.length > MAX_MANUAL_BACKUPS) {
      const removed = target.slot.manualBackups.pop();
      if (removed?.key) safeRemove(removed.key);
    }
    recordHistory(data, "manual-backup-created", target, label, envelope.savedAt);
    writeRegistryData(data);
    return clone(target.slot.manualBackups[0]);
  } catch (error) {
    lastStorageError = `Não foi possível criar backup manual: ${error?.message || error}`;
    return null;
  }
}

export function listManualBackups(options = {}) {
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  const records = Array.isArray(target.slot.manualBackups) ? target.slot.manualBackups : [];
  return records.filter(item => {
    const raw = safeGet(item.key || manualBackupKey(target.profile.id, target.slot.id, item.id));
    return Boolean(raw && parseEnvelope(raw, item.key || "manual-backup", false));
  }).map(clone);
}

export function restoreManualBackup(backupId, options = {}) {
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  const record = (target.slot.manualBackups || []).find(item => item.id === backupId);
  if (!record) return null;
  const raw = safeGet(record.key || manualBackupKey(target.profile.id, target.slot.id, backupId));
  const parsed = raw ? parseEnvelope(raw, record.key || "manual-backup", false) : null;
  if (!parsed) return null;
  const keys = slotKeys(target.profile.id, target.slot.id);
  const previous = safeGet(keys.primary);
  if (previous) rotateSnapshotRaw(previous, "before-manual-restore", target);
  localStorage.setItem(keys.primary, raw);
  updateSlotSummary(target.slot, parsed);
  recordHistory(data, "manual-backup-restored", target, record.label, parsed.savedAt);
  writeRegistryData(data);
  lastRecovery = { type: "manual-backup", source: backupId, savedAt: parsed.savedAt, profileId: target.profile.id, slotId: target.slot.id };
  return parsed.state;
}

export function deleteManualBackup(backupId, options = {}) {
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  const index = (target.slot.manualBackups || []).findIndex(item => item.id === backupId);
  if (index < 0) return false;
  const [record] = target.slot.manualBackups.splice(index, 1);
  safeRemove(record.key || manualBackupKey(target.profile.id, target.slot.id, backupId));
  recordHistory(data, "manual-backup-deleted", target, record.label);
  writeRegistryData(data);
  return true;
}

export function exportCareerBundle(options = {}) {
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  const keys = slotKeys(target.profile.id, target.slot.id);
  const raw = safeGet(keys.primary);
  const primary = raw ? parseEnvelope(raw, keys.primary, false) : null;
  if (!primary) throw new Error("este slot não possui carreira para exportar");
  const snapshots = [keys.emergency, ...keys.snapshots].map(key => safeGet(key)).filter(Boolean).map(value => JSON.parse(value));
  const backups = listManualBackups({ profileId: target.profile.id, slotId: target.slot.id }).map(item => ({ metadata: item, envelope: JSON.parse(safeGet(item.key)) }));
  const core = {
    format: EXPORT_FORMAT,
    schema: EXPORT_SCHEMA,
    exportedAt: nowISO(),
    exportedByBuild: BUILD.version,
    sourceProfile: { id: target.profile.id, name: target.profile.name },
    sourceSlot: { id: target.slot.id, name: target.slot.name },
    save: primary,
    snapshots,
    manualBackups: backups
  };
  const bundle = { ...core, checksum: checksum(JSON.stringify(core)) };
  recordHistory(data, "career-exported", target, `${target.profile.name} • ${target.slot.name}`, core.exportedAt);
  writeRegistryData(data);
  return JSON.stringify(bundle, null, 2);
}

export function importCareerBundle(text, options = {}) {
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  const bundle = parseExportBundle(text);
  const keys = slotKeys(target.profile.id, target.slot.id);
  if (safeGet(keys.primary) && options.overwrite === false) throw new Error("o slot de destino já está ocupado");

  const parsedPrimary = parseEnvelope(JSON.stringify(bundle.save), "import-primary", false);
  if (!parsedPrimary) throw new Error("save principal do pacote é inválido");
  const importedState = { ...parsedPrimary.state, importedAt: nowISO(), importedFromBuild: bundle.exportedByBuild || parsedPrimary.build };
  if (!saveGame(importedState, { profileId: target.profile.id, slotId: target.slot.id, reason: "career-import" })) throw new Error(lastStorageError || "falha ao gravar carreira importada");

  // Reabre o registro, pois saveGame já o atualizou.
  const refreshed = requireRegistry();
  const refreshedTarget = resolveTarget(refreshed, target.profile.id, target.slot.id);
  const refreshedKeys = slotKeys(target.profile.id, target.slot.id);
  (bundle.snapshots || []).slice(0, MAX_SNAPSHOTS).forEach((snapshot, index) => {
    const parsed = parseEnvelope(JSON.stringify(snapshot), `import-snapshot-${index}`, false);
    if (parsed) localStorage.setItem(refreshedKeys.snapshots[index], JSON.stringify(snapshot));
  });
  refreshedTarget.slot.manualBackups = [];
  (bundle.manualBackups || []).slice(0, MAX_MANUAL_BACKUPS).forEach((entry, index) => {
    const envelope = entry?.envelope;
    const parsed = envelope ? parseEnvelope(JSON.stringify(envelope), `import-backup-${index}`, false) : null;
    if (!parsed) return;
    const id = uniqueId("backup");
    const key = manualBackupKey(refreshedTarget.profile.id, refreshedTarget.slot.id, id);
    localStorage.setItem(key, JSON.stringify(envelope));
    refreshedTarget.slot.manualBackups.push({ id, key, label: sanitizeName(entry?.metadata?.label, `Backup importado ${index + 1}`), savedAt: parsed.savedAt, leader: parsed.state.leader, build: parsed.build });
  });
  recordHistory(refreshed, "career-imported", refreshedTarget, `${bundle.sourceProfile?.name || "Perfil"} • ${bundle.sourceSlot?.name || "Slot"}`);
  writeRegistryData(refreshed);
  lastRecovery = { type: "import", source: bundle.exportedByBuild || "unknown", savedAt: bundle.exportedAt, profileId: target.profile.id, slotId: target.slot.id };
  return importedState;
}

export function getCareerHistory(limit = 30) {
  const data = requireRegistry();
  return clone((data.history || []).slice(0, Math.max(1, Number(limit) || 30)));
}

export function getStorageDiagnostics() {
  const data = requireRegistry();
  const target = resolveTarget(data);
  const keys = slotKeys(target.profile.id, target.slot.id);
  return {
    architecture: "profiles-slots-v1",
    registrySchema: REGISTRY_SCHEMA,
    saveSchema: BUILD.saveSchema,
    legacySaveKey: LEGACY_SAVE_KEY,
    activeProfileId: target.profile.id,
    activeProfileName: target.profile.name,
    activeSlotId: target.slot.id,
    activeSlotName: target.slot.name,
    profileCount: data.profiles.length,
    occupiedSlots: data.profiles.flatMap(profile => profile.slots).filter(slot => slot.hasSave).length,
    hasPrimary: Boolean(safeGet(keys.primary)),
    hasPending: Boolean(safeGet(keys.pending)),
    snapshots: getSnapshotSummary({ profileId: target.profile.id, slotId: target.slot.id }),
    manualBackups: listManualBackups({ profileId: target.profile.id, slotId: target.slot.id }),
    historyCount: (data.history || []).length,
    lastError: lastStorageError,
    lastRecovery
  };
}

export function deleteSave(options = {}) {
  const data = requireRegistry();
  const target = resolveTarget(data, options.profileId, options.slotId);
  const preserveRecovery = Boolean(options.preserveRecovery);
  removeSlotStorage(target.profile.id, target.slot.id, !preserveRecovery);
  clearSlotSummary(target.slot, preserveRecovery);
  recordHistory(data, "slot-cleared", target, preserveRecovery ? "recovery-preserved" : "complete");
  writeRegistryData(data);
  lastStorageError = "";
  return true;
}

export function resetSaveArchitecture() {
  const data = readRegistryData();
  if (data) data.profiles.forEach(profile => profile.slots.forEach(slot => removeSlotStorage(profile.id, slot.id, true)));
  [REGISTRY_KEY, MIGRATION_KEY, LEGACY_BACKUP_KEY, LEGACY_SAVE_KEY, ...OLD_KEYS].forEach(safeRemove);
  architectureReady = false;
}

export function getLastStorageError() {
  return lastStorageError;
}

function requireRegistry() {
  if (!architectureReady) ensureSaveArchitecture();
  let data = readRegistryData();
  if (!data) {
    data = defaultRegistryData();
    writeRegistryData(data);
  }
  repairRegistry(data);
  return data;
}

function defaultRegistryData() {
  const profile = makeProfile("profile-1", "Perfil 1");
  return { createdAt: nowISO(), updatedAt: nowISO(), activeProfileId: profile.id, activeSlotId: profile.slots[0].id, profiles: [profile], history: [] };
}

function makeProfile(id, name) {
  const at = nowISO();
  return {
    id,
    name,
    createdAt: at,
    updatedAt: at,
    slots: Array.from({ length: SLOTS_PER_PROFILE }, (_, index) => ({
      id: `slot-${index + 1}`,
      name: `Carreira ${index + 1}`,
      createdAt: at,
      updatedAt: at,
      hasSave: false,
      savedAt: null,
      leader: null,
      party: null,
      gameDate: null,
      build: null,
      schema: null,
      manualBackups: []
    }))
  };
}

function repairRegistry(data) {
  if (!Array.isArray(data.profiles) || !data.profiles.length) Object.assign(data, defaultRegistryData());
  data.profiles = data.profiles.slice(0, MAX_PROFILES);
  data.profiles.forEach((profile, profileIndex) => {
    profile.id = profile.id || `profile-${profileIndex + 1}`;
    profile.name = sanitizeName(profile.name, `Perfil ${profileIndex + 1}`);
    profile.slots = Array.isArray(profile.slots) ? profile.slots.slice(0, SLOTS_PER_PROFILE) : [];
    while (profile.slots.length < SLOTS_PER_PROFILE) {
      const index = profile.slots.length;
      profile.slots.push({ ...makeProfile("temp", "temp").slots[index], id: `slot-${index + 1}` });
    }
    profile.slots.forEach((slot, slotIndex) => {
      slot.id = slot.id || `slot-${slotIndex + 1}`;
      slot.name = sanitizeName(slot.name, `Carreira ${slotIndex + 1}`);
      slot.manualBackups = Array.isArray(slot.manualBackups) ? slot.manualBackups.slice(0, MAX_MANUAL_BACKUPS) : [];
    });
  });
  const activeProfile = data.profiles.find(item => item.id === data.activeProfileId) || data.profiles[0];
  data.activeProfileId = activeProfile.id;
  if (!activeProfile.slots.some(item => item.id === data.activeSlotId)) data.activeSlotId = activeProfile.slots[0].id;
  data.history = Array.isArray(data.history) ? data.history.slice(0, MAX_HISTORY) : [];
}

function readRegistryData() {
  const raw = safeGet(REGISTRY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.format !== REGISTRY_FORMAT || parsed.schema !== REGISTRY_SCHEMA || !parsed.data) throw new Error("registro de carreiras inválido");
    const { checksum: storedChecksum, ...core } = parsed;
    if (checksum(JSON.stringify(core)) !== storedChecksum) throw new Error("checksum do registro divergente");
    repairRegistry(parsed.data);
    return parsed.data;
  } catch (error) {
    quarantine(raw, REGISTRY_KEY, error);
    return null;
  }
}

function writeRegistryData(data) {
  repairRegistry(data);
  data.updatedAt = nowISO();
  const core = { format: REGISTRY_FORMAT, schema: REGISTRY_SCHEMA, updatedAt: data.updatedAt, data };
  const envelope = { ...core, checksum: checksum(JSON.stringify(core)) };
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(envelope));
  if (typeof document !== "undefined") {
    queueMicrotask(() => document.dispatchEvent(new CustomEvent("diplocraft:storagechange", { detail: { updatedAt: data.updatedAt } })));
  }
}

function resolveTarget(data, profileId, slotId) {
  const profile = data.profiles.find(item => item.id === (profileId || data.activeProfileId)) || data.profiles[0];
  if (!profile) throw new Error("nenhum perfil disponível");
  const slot = profile.slots.find(item => item.id === (slotId || (profile.id === data.activeProfileId ? data.activeSlotId : profile.slots[0]?.id))) || profile.slots[0];
  if (!slot) throw new Error("nenhum slot disponível");
  return { profile, slot };
}

function slotKeys(profileId, slotId) {
  const base = `${LEGACY_SAVE_KEY}__${profileId}__${slotId}`;
  return {
    base,
    primary: base,
    pending: `${base}_pending`,
    emergency: `${base}_emergency`,
    snapshots: Array.from({ length: MAX_SNAPSHOTS }, (_, index) => `${base}_snapshot_${index}`)
  };
}

function manualBackupKey(profileId, slotId, backupId) {
  return `${LEGACY_SAVE_KEY}__${profileId}__${slotId}_manual_${backupId}`;
}

function prepareState(state, target) {
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("estado ausente ou inválido");
  const copy = clone(state);
  copy.version = BUILD.version;
  copy.saveSchema = BUILD.saveSchema;
  copy.savedAt = nowISO();
  copy.career = { profileId: target.profile.id, profileName: target.profile.name, slotId: target.slot.id, slotName: target.slot.name };
  validateState(copy);
  return copy;
}

function validateState(state) {
  const requiredStrings = ["leader", "party"];
  const requiredNumbers = ["day", "month", "year", "treasury", "approval", "economy", "stability"];
  for (const key of requiredStrings) if (typeof state[key] !== "string" || !state[key].trim()) throw new Error(`campo obrigatório inválido: ${key}`);
  for (const key of requiredNumbers) if (!Number.isFinite(Number(state[key]))) throw new Error(`campo numérico inválido: ${key}`);
  if (Number(state.day) < 1 || Number(state.month) < 1 || Number(state.month) > 12 || Number(state.year) < 2020) throw new Error("data do jogo inválida");
}

function makeEnvelope(state, reason, emergency = false, target = null) {
  const core = {
    format: "diplocraft-save-envelope",
    schema: BUILD.saveSchema,
    build: BUILD.version,
    savedAt: nowISO(),
    reason,
    emergency,
    career: target ? { profileId: target.profile.id, slotId: target.slot.id } : state.career || null,
    state
  };
  return { ...core, checksum: checksum(JSON.stringify(core)) };
}

function parseEnvelope(raw, key, quarantineOnFailure) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && !parsed.format) {
      validateState(parsed);
      return { state: parsed, savedAt: parsed.savedAt || null, reason: "legacy-direct", build: parsed.version || "legacy", schema: parsed.saveSchema || 1 };
    }
    if (!parsed || parsed.format !== "diplocraft-save-envelope" || typeof parsed.state !== "object") throw new Error("envelope inválido");
    const { checksum: storedChecksum, ...core } = parsed;
    if (checksum(JSON.stringify(core)) !== storedChecksum) throw new Error("checksum divergente");
    validateState(parsed.state);
    return parsed;
  } catch (error) {
    if (quarantineOnFailure) quarantine(typeof raw === "string" ? raw : JSON.stringify(raw), key, error);
    return null;
  }
}

function parseExportBundle(text) {
  let parsed;
  try { parsed = typeof text === "string" ? JSON.parse(text) : text; }
  catch (_) { throw new Error("arquivo JSON inválido"); }
  if (!parsed || parsed.format !== EXPORT_FORMAT || parsed.schema !== EXPORT_SCHEMA || !parsed.save) throw new Error("pacote de carreira incompatível");
  const { checksum: storedChecksum, ...core } = parsed;
  if (checksum(JSON.stringify(core)) !== storedChecksum) throw new Error("checksum do pacote divergente");
  if (!parseEnvelope(JSON.stringify(parsed.save), "export-bundle", false)) throw new Error("save exportado inválido");
  return parsed;
}

function recoverPendingTransaction(target) {
  const keys = slotKeys(target.profile.id, target.slot.id);
  const raw = safeGet(keys.pending);
  if (!raw) return;
  const pending = parseEnvelope(raw, keys.pending, false);
  if (!pending) {
    quarantine(raw, keys.pending, new Error("transação pendente inválida"));
    return;
  }
  try {
    const currentRaw = safeGet(keys.primary);
    const current = currentRaw ? parseEnvelope(currentRaw, keys.primary, false) : null;
    const pendingTime = Date.parse(pending.savedAt || 0) || 0;
    const currentTime = current ? Date.parse(current.savedAt || 0) || 0 : -1;
    if (!current || pendingTime >= currentTime) localStorage.setItem(keys.primary, raw);
    localStorage.removeItem(keys.pending);
    lastRecovery = { type: "transaction", source: keys.pending, savedAt: pending.savedAt || null, profileId: target.profile.id, slotId: target.slot.id };
  } catch (error) {
    lastStorageError = `Não foi possível concluir uma gravação interrompida: ${error?.message || error}`;
  }
}

function rotateSnapshotRaw(raw, reason, target) {
  const parsed = parseEnvelope(raw, "snapshot-source", false);
  if (!parsed) return false;
  const keys = slotKeys(target.profile.id, target.slot.id);
  for (let index = MAX_SNAPSHOTS - 1; index > 0; index -= 1) {
    const previous = safeGet(keys.snapshots[index - 1]);
    if (previous) localStorage.setItem(keys.snapshots[index], previous);
    else safeRemove(keys.snapshots[index]);
  }
  const snapshot = parsed.format ? { ...parsed, reason: reason || parsed.reason } : makeEnvelope(parsed.state, reason || "snapshot", false, target);
  if (snapshot.format && snapshot.checksum) {
    const { checksum: ignored, ...core } = snapshot;
    snapshot.checksum = checksum(JSON.stringify(core));
  }
  localStorage.setItem(keys.snapshots[0], JSON.stringify(snapshot));
  return true;
}

function updateSlotSummary(slot, envelope) {
  const state = envelope.state || {};
  slot.hasSave = true;
  slot.savedAt = envelope.savedAt || state.savedAt || nowISO();
  slot.updatedAt = slot.savedAt;
  slot.leader = state.leader || null;
  slot.party = state.party || null;
  slot.gameDate = { day: Number(state.day || 1), month: Number(state.month || 1), year: Number(state.year || 2026) };
  slot.build = envelope.build || state.version || BUILD.version;
  slot.schema = envelope.schema || state.saveSchema || BUILD.saveSchema;
}

function clearSlotSummary(slot, preserveRecovery = false) {
  slot.hasSave = false;
  slot.savedAt = null;
  slot.leader = null;
  slot.party = null;
  slot.gameDate = null;
  slot.build = null;
  slot.schema = null;
  slot.updatedAt = nowISO();
  if (!preserveRecovery) slot.manualBackups = [];
}

function removeSlotStorage(profileId, slotId, includeRecovery = true) {
  const keys = slotKeys(profileId, slotId);
  [keys.primary, keys.pending].forEach(safeRemove);
  if (includeRecovery) {
    [keys.emergency, ...keys.snapshots].forEach(safeRemove);
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(`${LEGACY_SAVE_KEY}__${profileId}__${slotId}_manual_`)) safeRemove(key);
    }
  }
}

function migrateLegacyStorage(data) {
  if (safeGet(MIGRATION_KEY)) return;
  const target = resolveTarget(data);
  const targetKeys = slotKeys(target.profile.id, target.slot.id);
  const legacyCandidates = [LEGACY_SAVE_KEY, ...OLD_KEYS];
  let migrated = false;
  for (const key of legacyCandidates) {
    const raw = safeGet(key);
    if (!raw) continue;
    const parsed = parseEnvelope(raw, key, false);
    if (!parsed) continue;
    try {
      if (!safeGet(targetKeys.primary)) {
        localStorage.setItem(targetKeys.primary, raw);
        updateSlotSummary(target.slot, parsed);
        localStorage.setItem(LEGACY_BACKUP_KEY, raw);
        recordHistory(data, "legacy-migrated", target, key, parsed.savedAt);
        migrated = true;
      }
      if (key !== LEGACY_BACKUP_KEY) safeRemove(key);
      break;
    } catch (_) {}
  }
  const legacyEmergency = safeGet(`${LEGACY_SAVE_KEY}_emergency`);
  if (legacyEmergency && parseEnvelope(legacyEmergency, "legacy-emergency", false)) localStorage.setItem(targetKeys.emergency, legacyEmergency);
  for (let index = 0; index < MAX_SNAPSHOTS; index += 1) {
    const raw = safeGet(`${LEGACY_SAVE_KEY}_snapshot_${index}`);
    if (raw && parseEnvelope(raw, `legacy-snapshot-${index}`, false)) localStorage.setItem(targetKeys.snapshots[index], raw);
  }
  [`${LEGACY_SAVE_KEY}_pending`, `${LEGACY_SAVE_KEY}_emergency`, ...Array.from({ length: MAX_SNAPSHOTS }, (_, index) => `${LEGACY_SAVE_KEY}_snapshot_${index}`)].forEach(safeRemove);
  safeSet(MIGRATION_KEY, JSON.stringify({ migrated, at: nowISO(), build: BUILD.version, target: { profileId: target.profile.id, slotId: target.slot.id } }));
  writeRegistryData(data);
}

function recordHistory(data, action, target, detail = "", at = nowISO()) {
  data.history = Array.isArray(data.history) ? data.history : [];
  data.history.unshift({ id: uniqueId("history"), at: at || nowISO(), action, profileId: target.profile.id, profileName: target.profile.name, slotId: target.slot.id, slotName: target.slot.name, detail: String(detail || "").slice(0, 180), build: BUILD.version });
  data.history = data.history.slice(0, MAX_HISTORY);
}

function quarantine(raw, key, error) {
  lastStorageError = "Um arquivo de save corrompido foi isolado. O jogo tentará usar uma recuperação válida do mesmo slot.";
  try {
    localStorage.setItem(`${CORRUPT_PREFIX}${Date.now()}`, JSON.stringify({ source: key, isolatedAt: nowISO(), raw }));
    localStorage.removeItem(key);
  } catch (_) {}
  console.error("[DIPLOCRAFT STORAGE] Save corrompido isolado", key, error);
}

function sanitizeName(value, fallback) {
  const normalized = String(value || "").replace(/[<>\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 32);
  return normalized || fallback;
}

function uniqueId(prefix) {
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 10) || Math.random().toString(36).slice(2, 12);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function nowISO() { return new Date().toISOString(); }

function safeGet(key) {
  try { return localStorage.getItem(key); }
  catch (error) { lastStorageError = `Armazenamento local indisponível: ${error?.message || error}`; return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (error) { lastStorageError = `Armazenamento local indisponível: ${error?.message || error}`; return false; }
}
function safeRemove(key) { try { localStorage.removeItem(key); } catch (_) {} }

function checksum(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";

class MemoryStorage {
  #data = new Map();
  get length() { return this.#data.size; }
  key(index) { return [...this.#data.keys()][index] ?? null; }
  getItem(key) { return this.#data.has(String(key)) ? this.#data.get(String(key)) : null; }
  setItem(key, value) { this.#data.set(String(key), String(value)); }
  removeItem(key) { this.#data.delete(String(key)); }
  clear() { this.#data.clear(); }
}

globalThis.localStorage = new MemoryStorage();
const storage = await import("../../src/core/storage.js");
const LEGACY_KEY = "diplocraft_save_v101";

beforeEach(() => {
  storage.resetSaveArchitecture();
  localStorage.clear();
  storage.ensureSaveArchitecture();
});

test("default architecture exposes one profile with three slots", () => {
  const registry = storage.getCareerRegistry();
  assert.equal(registry.profiles.length, 1);
  assert.equal(registry.profiles[0].slots.length, 3);
  assert.equal(storage.getStorageDiagnostics().saveSchema, 3);
});

test("different slots keep independent careers", () => {
  const active = storage.getActiveCareer();
  storage.saveGame(createNewState({ leader: "Líder A", treasury: 111 }), { reason: "slot-a" });
  storage.selectActiveCareer(active.profileId, "slot-2");
  storage.saveGame(createNewState({ leader: "Líder B", treasury: 222 }), { reason: "slot-b" });
  assert.equal(storage.loadGame().leader, "Líder B");
  storage.selectActiveCareer(active.profileId, "slot-1");
  const first = storage.loadGame();
  assert.equal(first.leader, "Líder A");
  assert.equal(first.treasury, 111);
});

test("four profiles are allowed and the fifth is blocked", () => {
  storage.createProfile("Perfil 2");
  storage.createProfile("Perfil 3");
  storage.createProfile("Perfil 4");
  assert.equal(storage.getCareerRegistry().profiles.length, 4);
  assert.throws(() => storage.createProfile("Perfil 5"), /limite de 4 perfis/);
});

test("manual backups are created, restored and deleted", () => {
  storage.saveGame(createNewState({ leader: "Base", treasury: 100 }), { reason: "base" });
  const backup = storage.createManualBackup(createNewState({ leader: "Backup", treasury: 444 }), "Antes da crise");
  assert.ok(backup?.id);
  assert.equal(storage.listManualBackups().length, 1);
  const restored = storage.restoreManualBackup(backup.id);
  assert.equal(restored.leader, "Backup");
  assert.equal(restored.treasury, 444);
  assert.equal(storage.deleteManualBackup(backup.id), true);
  assert.equal(storage.listManualBackups().length, 0);
});

test("export and import transfer a career to another slot", () => {
  const active = storage.getActiveCareer();
  storage.saveGame(createNewState({ leader: "Exportado", treasury: 777 }), { reason: "export-source" });
  storage.createManualBackup(createNewState({ leader: "Backup exportado" }), "Backup de viagem");
  const bundle = storage.exportCareerBundle();
  storage.selectActiveCareer(active.profileId, "slot-3");
  const imported = storage.importCareerBundle(bundle, { overwrite: true });
  assert.equal(imported.leader, "Exportado");
  assert.equal(storage.loadGame().treasury, 777);
  assert.equal(storage.listManualBackups().length, 1);
});

test("tampered export is rejected by checksum", () => {
  storage.saveGame(createNewState({ leader: "Original" }), { reason: "source" });
  const parsed = JSON.parse(storage.exportCareerBundle());
  parsed.save.state.leader = "Adulterado";
  assert.throws(() => storage.importCareerBundle(JSON.stringify(parsed)), /checksum do pacote divergente/);
});

test("legacy direct save is migrated into default profile and slot", () => {
  storage.resetSaveArchitecture();
  localStorage.clear();
  localStorage.setItem(LEGACY_KEY, JSON.stringify(createNewState({ leader: "Legado" })));
  storage.ensureSaveArchitecture();
  assert.equal(storage.loadGame().leader, "Legado");
  assert.equal(localStorage.getItem(LEGACY_KEY), null);
  assert.ok(localStorage.getItem(`${LEGACY_KEY}_schema2_rollback_backup`));
});

test("clearing one slot does not remove another career", () => {
  const active = storage.getActiveCareer();
  storage.saveGame(createNewState({ leader: "Preservado" }), { reason: "slot-1" });
  storage.selectActiveCareer(active.profileId, "slot-2");
  storage.saveGame(createNewState({ leader: "Apagar" }), { reason: "slot-2" });
  storage.deleteSave();
  assert.equal(storage.loadGame(), null);
  storage.selectActiveCareer(active.profileId, "slot-1");
  assert.equal(storage.loadGame().leader, "Preservado");
});

test("registry history records save, backup, export and restore actions", () => {
  storage.saveGame(createNewState({ leader: "Histórico" }), { reason: "manual" });
  const backup = storage.createManualBackup(createNewState({ leader: "Histórico 2" }), "Ponto seguro");
  storage.exportCareerBundle();
  storage.restoreManualBackup(backup.id);
  const actions = storage.getCareerHistory().map(item => item.action);
  assert.ok(actions.includes("save"));
  assert.ok(actions.includes("manual-backup-created"));
  assert.ok(actions.includes("career-exported"));
  assert.ok(actions.includes("manual-backup-restored"));
});

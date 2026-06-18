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

function activeKeys() {
  const active = storage.getActiveCareer();
  const base = `${LEGACY_KEY}__${active.profileId}__${active.slotId}`;
  return { primary: base, pending: `${base}_pending`, snapshot0: `${base}_snapshot_0` };
}

beforeEach(() => {
  storage.resetSaveArchitecture();
  localStorage.clear();
  storage.ensureSaveArchitecture();
});

test("save and load round-trip uses schema 3 scoped envelope", () => {
  const state = createNewState({ leader: "Teste QA" });
  assert.equal(storage.saveGame(state, { reason: "unit" }), true);
  const raw = JSON.parse(localStorage.getItem(activeKeys().primary));
  assert.equal(raw.format, "diplocraft-save-envelope");
  assert.equal(raw.schema, 3);
  assert.equal(typeof raw.checksum, "string");
  assert.equal(raw.career.slotId, "slot-1");
  assert.equal(storage.loadGame().leader, "Teste QA");
});

test("pending transaction is promoted inside the active slot", () => {
  storage.saveGame(createNewState({ leader: "Pending" }), { reason: "unit" });
  const keys = activeKeys();
  const raw = localStorage.getItem(keys.primary);
  localStorage.setItem(keys.pending, raw);
  localStorage.removeItem(keys.primary);
  const restored = storage.loadGame();
  assert.equal(restored.leader, "Pending");
  assert.ok(localStorage.getItem(keys.primary));
  assert.equal(localStorage.getItem(keys.pending), null);
});

test("corrupt primary is quarantined and same-slot snapshot is restored", () => {
  storage.saveGame(createNewState({ leader: "Snapshot A" }), { reason: "first" });
  storage.saveGame(createNewState({ leader: "Primary B" }), { reason: "second" });
  const keys = activeKeys();
  assert.ok(localStorage.getItem(keys.snapshot0));
  localStorage.setItem(keys.primary, "{bad json");
  const restored = storage.loadGame();
  assert.equal(restored.leader, "Snapshot A");
  assert.ok([...Array(localStorage.length).keys()].map(i => localStorage.key(i)).some(key => key.startsWith("diplocraft_corrupt_backup_")));
});

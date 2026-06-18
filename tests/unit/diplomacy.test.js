import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { applyTreaty, globalRisk } from "../../src/systems/diplomacy.js";
import { TREATIES } from "../../src/data/diplomacyData.js";

test("same treaty with same country can only be signed once", () => {
  const state = createNewState({ treasury: 500 });
  const treaty = TREATIES.find(item => item.id === "trade");
  const initial = state.treasury;
  const first = applyTreaty(state, "usa", treaty, () => {});
  const afterFirst = state.treasury;
  const second = applyTreaty(state, "usa", treaty, () => {});
  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(initial - afterFirst, treaty.cost);
  assert.equal(state.treasury, afterFirst);
  assert.equal(state.treaties.length, 1);
});

test("defense treaty affects the canonical global tension field", () => {
  const state = createNewState({ treasury: 500, globalTension: 35 });
  const treaty = TREATIES.find(item => item.id === "defense");
  applyTreaty(state, "usa", treaty, () => {});
  assert.ok(state.globalTension > 35);
  assert.equal(Object.hasOwn(state, "tension"), false);
  assert.ok(globalRisk(state) >= 0 && globalRisk(state) <= 100);
});

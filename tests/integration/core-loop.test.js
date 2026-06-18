import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { advanceDay, ensureCoreLoopState, queueConsequence, consumeActionCapacity, canHoldElection, resolveCareerOutcome } from "../../src/systems/coreLoop.js";
import { seededRandom, withRandom } from "../helpers/random.js";
import { assertStateInvariants } from "../helpers/invariants.js";

test("ten deterministic years complete without invalid state in balance simulation mode", () => {
  const state = createNewState();
  withRandom(seededRandom(20260612), () => {
    for (let day = 0; day < 3650; day += 1) {
      advanceDay(state, () => {}, 1, { ignoreOutcomes: true });
      if (day % 30 === 0) assertStateInvariants(state, `day ${day}`);
    }
  });
  assertStateInvariants(state, "ten years final");
  assert.ok(state.year >= 2036);
  assert.equal(state.governance.totalDays, 3650);
});

test("weekly cycle replenishes strategic action capacity", () => {
  const state = createNewState();
  const gov = ensureCoreLoopState(state);
  assert.equal(consumeActionCapacity(state, 4, () => {}, "test"), true);
  const afterSpend = gov.actionPoints;
  advanceDay(state, () => {}, 7, { ignoreOutcomes: true });
  assert.ok(gov.actionPoints > afterSpend);
  assert.ok(gov.reports.weekly);
});

test("delayed consequences mature on the scheduled day", () => {
  const state = createNewState();
  const before = state.economy;
  queueConsequence(state, { id:"test-lag", title:"Test", days:3, effects:{ economy:4 } });
  advanceDay(state, () => {}, 2, { ignoreOutcomes: true });
  assert.ok(state.governance.pendingConsequences.some(item => item.id === "test-lag"));
  advanceDay(state, () => {}, 1, { ignoreOutcomes: true });
  assert.ok(!state.governance.pendingConsequences.some(item => item.id === "test-lag"));
  assert.ok(state.economy > before + 3);
});

test("official election remains locked before the final thirty days", () => {
  const state = createNewState();
  assert.equal(canHoldElection(state), false);
  state.electionDays = 30;
  assert.equal(canHoldElection(state), true);
});

test("career outcomes stop normal time progression", () => {
  const state = createNewState();
  resolveCareerOutcome(state, "defeat", "Teste", "Encerramento controlado", () => {});
  const before = state.day;
  assert.equal(advanceDay(state, () => {}, 1), 0);
  assert.equal(state.day, before);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { DEFENSE_DOCTRINES, DEFENSE_INTELLIGENCE_ACTIONS } from "../../src/data/defenseIntelligenceData.js";
import { ensureDefenseIntelligenceState, calculateDefenseIntelligenceSnapshot, defenseHealthScore, setDefenseDoctrine, applyDefenseIntelligenceEffects, processDefenseIntelligenceMonth } from "../../src/systems/defenseIntelligence.js";

test("defense intelligence state initializes full strategic structure", () => {
  const state = createNewState();
  const defense = ensureDefenseIntelligenceState(state);
  assert.equal(defense.branches.length, 6);
  assert.equal(defense.desks.length, 6);
  assert.equal(DEFENSE_DOCTRINES.length, 4);
  assert.equal(DEFENSE_INTELLIGENCE_ACTIONS.length, 8);
  assert.equal(typeof defenseHealthScore(state), "number");
});

test("doctrine and actions alter defense metrics safely", () => {
  const state = createNewState();
  ensureDefenseIntelligenceState(state);
  const before = calculateDefenseIntelligenceSnapshot(state);
  const selected = setDefenseDoctrine(state, "cyber_sovereignty");
  assert.equal(selected.id, "cyber_sovereignty");
  const legacy = applyDefenseIntelligenceEffects(state, { cyberResilience: 8, intelCoverage: 3, security: 2 });
  assert.equal(legacy.security, 2);
  const after = calculateDefenseIntelligenceSnapshot(state);
  assert.ok(after.intelligenceEdge >= before.intelligenceEdge - 10);
  assert.ok(state.defenseIntelligence.cyberResilience >= 0 && state.defenseIntelligence.cyberResilience <= 100);
});

test("monthly cycle keeps histories bounded and metrics normalized", () => {
  const state = createNewState({ globalTension: 70, crisis: 2 });
  ensureDefenseIntelligenceState(state);
  for (let i = 0; i < 50; i += 1) {
    state.month = (i % 12) + 1;
    state.year = 2026 + Math.floor(i / 12);
    state.governance.totalDays = i * 30;
    processDefenseIntelligenceMonth(state, { monthlyBalance: i % 3 === 0 ? -120 : 25 });
  }
  const defense = ensureDefenseIntelligenceState(state);
  assert.ok(defense.history.length <= 36);
  assert.ok(defense.incidents.length <= 16);
  for (const key of ["defenseReadiness", "cyberResilience", "threatLevel", "operationalRisk", "deterrence"]) {
    assert.ok(defense[key] >= 0 && defense[key] <= 100, `${key} outside bounds`);
  }
});

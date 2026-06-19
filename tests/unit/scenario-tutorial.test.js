import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { ensureScenarioTutorialState, calculateScenarioTutorialSnapshot, setScenarioPack, setTutorialTrack, applyScenarioTutorialEffects, processScenarioTutorialMonth, scenarioTutorialHealthScore } from "../../src/systems/scenarioTutorial.js";

test("scenario tutorial state migrates additively and bounds history", () => {
  const state = createNewState({ scenarioTutorial: { schema:0, tutorialDepth:77, history:Array.from({length:80}, (_, i)=>({i})) } });
  const st = ensureScenarioTutorialState(state);
  assert.equal(st.schema, 1);
  assert.equal(st.tutorialDepth, 77);
  assert.ok(st.history.length <= 36);
  assert.equal(st.missions.length, 8);
});

test("scenario packs and tutorial tracks produce finite readiness", () => {
  const state = createNewState();
  const pack = setScenarioPack(state, "global_tension");
  const track = setTutorialTrack(state, "crisis_commander");
  assert.equal(pack.id, "global_tension");
  assert.equal(track.id, "crisis_commander");
  const snapshot = calculateScenarioTutorialSnapshot(state);
  assert.ok(Number.isFinite(snapshot.readiness));
  assert.ok(scenarioTutorialHealthScore(state) >= 0 && scenarioTutorialHealthScore(state) <= 100);
});

test("scenario effects bridge only legacy keys back to global state", () => {
  const state = createNewState();
  const legacy = applyScenarioTutorialEffects(state, { tutorialDepth:5, approval:2, debt:-1 });
  assert.ok(state.scenarioTutorial.tutorialDepth > 48);
  assert.deepEqual(legacy, { approval:2, debt:-1 });
});

test("monthly scenario tutorial cycle completes missions without invalid values", () => {
  const state = createNewState({ approval:70, economy:68, stability:72, influence:66, campaign:60, prestige:64, crisis:1 });
  for (let i=0;i<24;i+=1) {
    const report = processScenarioTutorialMonth(state, {});
    assert.ok(Number.isFinite(report.health));
    assert.ok(state.scenarioTutorial.history.length <= 36);
  }
  assert.ok(state.scenarioTutorial.missions.some(m => m.done));
});

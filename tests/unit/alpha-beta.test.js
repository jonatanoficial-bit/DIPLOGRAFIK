import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { ensureAlphaBetaState, calculateAlphaBetaSnapshot, setBetaChannel, applyAlphaBetaEffects, processAlphaBetaMonth, alphaBetaHealthScore } from "../../src/systems/alphaBeta.js";

test("alpha beta state migrates additively and keeps bounded history", () => {
  const state = createNewState({ alphaBeta: { schema:0, qaCoverage:82, history:Array.from({length:80}, (_,i)=>({i})) } });
  const ab = ensureAlphaBetaState(state);
  assert.equal(ab.schema, 1);
  assert.equal(ab.qaCoverage, 82);
  assert.ok(ab.history.length <= 36);
});

test("alpha beta snapshot improves with high readiness values", () => {
  const weak = createNewState({ stability:38, crisis:6, alphaBeta:{ qaCoverage:25, crashFreeSessions:55, mobileStability:45, performanceScore:42, buildConfidence:38, gameplayBalance:34, releaseReadiness:30, betaFeedback:18, telemetryQuality:20, publicRisk:70 } });
  const strong = createNewState({ stability:82, crisis:0, economy:75, alphaBeta:{ qaCoverage:90, crashFreeSessions:99, mobileStability:92, performanceScore:90, buildConfidence:88, gameplayBalance:86, releaseReadiness:84, betaFeedback:70, telemetryQuality:82, publicRisk:12 } });
  assert.ok(calculateAlphaBetaSnapshot(strong).goldReadiness > calculateAlphaBetaSnapshot(weak).goldReadiness);
});

test("channel and action effects adjust readiness without swallowing legacy effects", () => {
  const state = createNewState();
  const channel = setBetaChannel(state, "device_lab");
  assert.equal(channel.id, "device_lab");
  const legacy = applyAlphaBetaEffects(state, { mobileStability:5, approval:2, playerGuidance:3 });
  assert.equal(legacy.approval, 2);
  assert.equal(legacy.playerGuidance, 3);
  assert.ok(state.alphaBeta.mobileStability > 84);
});

test("monthly alpha beta cycle remains finite and bounded", () => {
  const state = createNewState();
  for (let i=0;i<60;i+=1) {
    const report = processAlphaBetaMonth(state, { monthlyBalance:20 });
    assert.ok(Number.isFinite(report.health));
    assert.ok(state.alphaBeta.history.length <= 36);
  }
  assert.ok(alphaBetaHealthScore(state) >= 0 && alphaBetaHealthScore(state) <= 100);
});

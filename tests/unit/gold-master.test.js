import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { GOLD_RELEASE_TRACKS, GOLD_CERTIFICATION_GATES, GOLD_MASTER_ACTIONS } from "../../src/data/goldMasterData.js";
import { ensureGoldMasterState, calculateGoldMasterSnapshot, setGoldTrack, applyGoldMasterEffects, processGoldMasterMonth, goldMasterHealthScore } from "../../src/systems/goldMaster.js";

test("gold master state migrates additively and keeps bounded history", () => {
  const state = createNewState({ goldMaster: { schema:0, storeReadiness:82, history:Array.from({length:80}, (_,i)=>({i})) } });
  const gold = ensureGoldMasterState(state);
  assert.equal(gold.schema, 1);
  assert.equal(gold.storeReadiness, 82);
  assert.ok(gold.history.length <= 36);
});

test("gold master data exposes full launch structure", () => {
  assert.equal(GOLD_RELEASE_TRACKS.length, 4);
  assert.equal(GOLD_CERTIFICATION_GATES.length, 8);
  assert.equal(GOLD_MASTER_ACTIONS.length, 8);
});

test("gold snapshot improves under strong publication readiness", () => {
  const weak = createNewState({ stability:38, crisis:6, alphaBeta:{ qaCoverage:25, crashFreeSessions:55, mobileStability:45, performanceScore:42, buildConfidence:38, gameplayBalance:34, releaseReadiness:30, betaFeedback:18, telemetryQuality:20, publicRisk:70 }, goldMaster:{ technicalCertification:35, mobileCertification:38, balanceCertification:30, storeReadiness:20, legalCompliance:35, launchOps:22, supportReadiness:20, rollbackReadiness:24, launchRisk:78 } });
  const strong = createNewState({ stability:84, crisis:0, economy:78, alphaBeta:{ qaCoverage:94, crashFreeSessions:99, mobileStability:94, performanceScore:92, buildConfidence:90, gameplayBalance:88, releaseReadiness:86, betaFeedback:76, telemetryQuality:85, publicRisk:10 }, goldMaster:{ technicalCertification:92, mobileCertification:93, balanceCertification:88, storeReadiness:86, legalCompliance:90, launchOps:84, supportReadiness:86, rollbackReadiness:88, telemetryBaseline:84, rolloutReadiness:87, goldStampReadiness:90, launchRisk:8 } });
  assert.ok(calculateGoldMasterSnapshot(strong).goldScore > calculateGoldMasterSnapshot(weak).goldScore);
});

test("track and effects alter gold metrics safely", () => {
  const state = createNewState();
  const track = setGoldTrack(state, "store_packaging");
  assert.equal(track.id, "store_packaging");
  const legacy = applyGoldMasterEffects(state, { storeReadiness:5, approval:2, commercialScore:3 });
  assert.equal(legacy.approval, 2);
  assert.equal(legacy.commercialScore, 3);
  assert.ok(state.goldMaster.storeReadiness > 48);
});

test("monthly gold cycle remains finite and bounded", () => {
  const state = createNewState();
  for (let i=0;i<60;i+=1) {
    state.month = (i % 12) + 1;
    state.year = 2026 + Math.floor(i/12);
    const report = processGoldMasterMonth(state, { monthlyBalance:20 });
    assert.ok(Number.isFinite(report.score));
    assert.ok(state.goldMaster.history.length <= 36);
  }
  assert.ok(goldMasterHealthScore(state) >= 0 && goldMasterHealthScore(state) <= 100);
});

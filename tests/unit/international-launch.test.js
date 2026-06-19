import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { INTERNATIONAL_MARKETS, INTERNATIONAL_GATES, INTERNATIONAL_LAUNCH_ACTIONS } from "../../src/data/internationalLaunchData.js";
import { ensureInternationalLaunchState, calculateInternationalLaunchSnapshot, setInternationalMarket, applyInternationalLaunchEffects, processInternationalLaunchMonth, internationalLaunchHealthScore } from "../../src/systems/internationalLaunch.js";

test("international launch state migrates additively and keeps bounded history", () => {
  const state = createNewState({ internationalLaunch: { schema:0, supportCoverage:88, history:Array.from({length:90}, (_,i)=>({i})) } });
  const intl = ensureInternationalLaunchState(state);
  assert.equal(intl.schema, 1);
  assert.equal(intl.supportCoverage, 88);
  assert.ok(intl.history.length <= 40);
});

test("international launch data exposes complete global release structure", () => {
  assert.equal(INTERNATIONAL_MARKETS.length, 4);
  assert.equal(INTERNATIONAL_GATES.length, 8);
  assert.equal(INTERNATIONAL_LAUNCH_ACTIONS.length, 8);
});

test("global launch snapshot improves under mature international readiness", () => {
  const weak = createNewState({ internationalLaunch:{ localizationDepth:30, complianceCoverage:25, supportCoverage:20, storePresence:18, culturalFit:25, privacyReadiness:28, monetizationReadiness:18, globalOps:20, marketReach:12, communityMomentum:10, marketRisk:78 }, goldMaster:{ technicalCertification:40, mobileCertification:42, storeReadiness:25, legalCompliance:32, launchOps:22, supportReadiness:18, rollbackReadiness:28, launchRisk:70 } });
  const strong = createNewState({ internationalLaunch:{ localizationDepth:92, complianceCoverage:90, supportCoverage:86, storePresence:88, culturalFit:85, privacyReadiness:91, monetizationReadiness:83, globalOps:87, marketReach:80, communityMomentum:78, marketRisk:8 }, goldMaster:{ technicalCertification:94, mobileCertification:94, localizationCertification:95, balanceCertification:90, storeReadiness:88, legalCompliance:92, launchOps:90, supportReadiness:88, rollbackReadiness:90, telemetryBaseline:88, rolloutReadiness:90, goldStampReadiness:94, launchRisk:6 } });
  assert.ok(calculateInternationalLaunchSnapshot(strong).globalScore > calculateInternationalLaunchSnapshot(weak).globalScore);
});

test("market and effects alter international metrics safely", () => {
  const state = createNewState();
  const market = setInternationalMarket(state, "europe");
  assert.equal(market.id, "europe");
  const legacy = applyInternationalLaunchEffects(state, { complianceCoverage:5, approval:2, marketReach:3 });
  assert.equal(legacy.approval, 2);
  assert.ok(state.internationalLaunch.complianceCoverage > 72);
});

test("monthly international cycle remains finite and bounded", () => {
  const state = createNewState();
  for (let i=0;i<72;i+=1) {
    state.month = (i % 12) + 1;
    state.year = 2026 + Math.floor(i/12);
    const report = processInternationalLaunchMonth(state, { monthlyBalance:15 });
    assert.ok(Number.isFinite(report.score));
    assert.ok(state.internationalLaunch.history.length <= 40);
  }
  assert.ok(internationalLaunchHealthScore(state) >= 0 && internationalLaunchHealthScore(state) <= 100);
});

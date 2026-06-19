import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { ensureElectoralCareerState, calculateElectoralSnapshot, setElectoralStrategy, applyElectoralCareerEffects, processElectoralCareerMonth, electoralHealthScore, registerElectionResult } from "../../src/systems/electoralCareer.js";

test("electoral career state migrates additively and keeps bounded history", () => {
  const state = createNewState({ electoralCareer: { schema:0, campaignFund:70, history:Array.from({length:80}, (_,i)=>({i})) } });
  const ec = ensureElectoralCareerState(state);
  assert.equal(ec.schema, 1);
  assert.equal(ec.campaignFund, 70);
  assert.ok(ec.history.length <= 36);
  assert.equal(ec.regions.length, 5);
});

test("electoral snapshot reacts to strong campaign machine", () => {
  const weak = createNewState({ approval:38, campaign:25, rejection:56, electoralCareer:{ groundGame:25, digitalMobilization:24, coalitionEndorsements:22, partyUnity:25, ethicsRisk:70 } });
  const strong = createNewState({ approval:62, campaign:72, rejection:24, electoralCareer:{ groundGame:78, digitalMobilization:76, coalitionEndorsements:74, partyUnity:70, ethicsRisk:12, debatePreparedness:70 } });
  assert.ok(calculateElectoralSnapshot(strong).victoryPath > calculateElectoralSnapshot(weak).victoryPath);
});

test("strategy and actions adjust electoral fields without phantom legacy effects", () => {
  const state = createNewState();
  const strategy = setElectoralStrategy(state, "data_driven_campaign");
  assert.equal(strategy.id, "data_driven_campaign");
  const legacy = applyElectoralCareerEffects(state, { digitalMobilization:4, campaign:2, rejection:-1 });
  assert.equal(legacy.campaign, 2);
  assert.equal(legacy.rejection, -1);
  assert.ok(state.electoralCareer.digitalMobilization > 50);
});

test("monthly electoral cycle remains finite and result registry is bounded", () => {
  const state = createNewState();
  for (let i=0;i<60;i+=1) {
    const report = processElectoralCareerMonth(state, {});
    assert.ok(Number.isFinite(report.victory));
    assert.ok(state.electoralCareer.history.length <= 36);
  }
  registerElectionResult(state, { won:true, incumbentVote:54, opponentVote:43 });
  assert.ok(electoralHealthScore(state) >= 0 && electoralHealthScore(state) <= 100);
  assert.equal(state.electoralCareer.results.length, 1);
});

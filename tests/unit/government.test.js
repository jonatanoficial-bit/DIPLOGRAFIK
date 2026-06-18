import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { voteLaw, votingPower } from "../../src/systems/government.js";
import { LAW_PROJECTS } from "../../src/data/governmentData.js";
import { withRandom } from "../helpers/random.js";

test("an approved law cannot be farmed repeatedly", () => {
  const state = createNewState({ politicalCapital: 100, coalition: 100, stability: 100, media: 100, corruption: 0 });
  const law = LAW_PROJECTS[0];
  const log = () => {};
  const first = withRandom(() => 0, () => voteLaw(state, law, log));
  const capitalAfterFirst = state.politicalCapital;
  const second = withRandom(() => 0, () => voteLaw(state, law, log));
  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(state.approvedLawIds.filter(id => id === law.id).length, 1);
  assert.equal(state.politicalCapital, capitalAfterFirst);
});

test("voting power is bounded", () => {
  assert.ok(votingPower(createNewState({ coalition: 1000, politicalCapital: 1000 })) <= 100);
  assert.ok(votingPower(createNewState({ coalition: -1000, politicalCapital: -1000 })) >= 0);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { runIntelOperation, calculateCoupRisk, calculateInternalThreat } from "../../src/systems/security.js";
import { INTEL_OPERATIONS } from "../../src/data/securityData.js";
import { withRandom } from "../helpers/random.js";

test("successful intelligence operation charges exactly one cost", () => {
  const state = createNewState({ treasury: 500, intelligence: 100, stability: 100 });
  const operation = INTEL_OPERATIONS[0];
  const initial = state.treasury;
  withRandom(() => 0, () => runIntelOperation(state, operation, () => {}));
  assert.equal(initial - state.treasury, operation.cost);
  assert.equal(state.activeOperations[0].result, "sucesso");
});

test("failed intelligence operation also charges exactly one cost", () => {
  const state = createNewState({ treasury: 500, intelligence: 0, stability: 0 });
  const operation = INTEL_OPERATIONS[3];
  const initial = state.treasury;
  withRandom(() => 0.999, () => runIntelOperation(state, operation, () => {}));
  assert.equal(initial - state.treasury, operation.cost);
  assert.equal(state.activeOperations[0].result, "falha");
});

test("security risk functions are bounded", () => {
  const state = createNewState({ loyalty: -500, stability: -500, crisis: 500 });
  assert.ok(calculateCoupRisk(state) >= 0 && calculateCoupRisk(state) <= 100);
  assert.ok(calculateInternalThreat(state) >= 0 && calculateInternalThreat(state) <= 100);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { monthlyEconomy } from "../../src/systems/economy.js";
import { ensureDeepEconomyState, calculateDeepEconomySnapshot, setFiscalRule, setMonetaryPolicy, applyDeepEconomyActionEffects, economicHealthScore } from "../../src/systems/economyDeep.js";
import { normalizeState } from "../../src/systems/calculations.js";

test("deep economy state migrates additively and preserves legacy fields", () => {
  const state = createNewState({ deepEconomy: { schema: 0, realGdp: 2500, monthlyHistory: Array.from({ length: 80 }, (_, i) => ({ i })) } });
  const econ = ensureDeepEconomyState(state);
  assert.equal(econ.schema, 1);
  assert.equal(econ.realGdp, 2500);
  assert.ok(econ.monthlyHistory.length <= 48);
  assert.equal(state.saveSchema ?? undefined, undefined);
});

test("deep economy monthly cycle remains finite and history is bounded", () => {
  const state = createNewState();
  for (let i = 0; i < 120; i += 1) {
    const report = monthlyEconomy(state);
    normalizeState(state);
    assert.ok(Number.isFinite(report.deep.annualizedGrowth));
    assert.ok(state.deepEconomy.monthlyHistory.length <= 48);
    assert.ok(state.deepEconomy.quarterHistory.length <= 24);
  }
  assert.ok(Number.isInteger(state.gdp));
  assert.equal(state.gdp, state.deepEconomy.realGdp);
  assert.ok(economicHealthScore(state) >= 0 && economicHealthScore(state) <= 100);
});

test("fiscal and monetary policies change the economic stance without phantom fields", () => {
  const state = createNewState();
  const fiscal = setFiscalRule(state, "productive_investment");
  const monetary = setMonetaryPolicy(state, "growth_credit");
  assert.equal(fiscal.id, "productive_investment");
  assert.equal(monetary.id, "growth_credit");
  const legacy = applyDeepEconomyActionEffects(state, { productivity: 2, privateInvestment: 3, approval: 1 });
  assert.ok(state.deepEconomy.productivity > 49.5);
  assert.deepEqual(legacy, { approval: 1 });
});

test("deep economy snapshot reacts differently to fiscal stress and boom conditions", () => {
  const stress = createNewState({ debt: 120, inflation: 14, marketConfidence: 25, deepEconomy: { businessConfidence: 25, privateInvestment: 22 } });
  const boom = createNewState({ debt: 35, inflation: 4, marketConfidence: 82, tradeBalance: 75, industry: 72, services: 74, technology: 68, deepEconomy: { businessConfidence: 80, privateInvestment: 78, productivity: 72 } });
  assert.ok(calculateDeepEconomySnapshot(boom).annualizedGrowth > calculateDeepEconomySnapshot(stress).annualizedGrowth);
});

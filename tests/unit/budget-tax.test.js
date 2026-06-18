import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { assertStateInvariants } from "../helpers/invariants.js";
import { ensureBudgetTaxState, calculateBudgetTaxSnapshot, setTaxRate, setSpendingRule, applyBudgetTaxEffects, processBudgetTaxMonth, budgetTaxHealthScore } from "../../src/systems/budgetTax.js";

test("budget and tax state is created and bounded", () => {
  const state = createNewState();
  const bt = ensureBudgetTaxState(state);
  assert.equal(bt.schema, 1);
  setTaxRate(state, "consumptionTax", 99);
  assert.equal(state.budgetTax.taxRates.consumptionTax, 35);
  setTaxRate(state, "wealthTax", -10);
  assert.equal(state.budgetTax.taxRates.wealthTax, 0);
  assertStateInvariants(state, "budget tax bounded");
});

test("budget rule and fiscal actions affect snapshot without invalid values", () => {
  const state = createNewState();
  setSpendingRule(state, "investment_budget");
  const legacy = applyBudgetTaxEffects(state, { taxCompliance: 5, evasionRate: -3, privateInvestment: 2, economy: 1 });
  assert.equal(state.budgetTax.activeSpendingRule, "investment_budget");
  assert.equal(legacy.economy, 1);
  const snapshot = calculateBudgetTaxSnapshot(state);
  for (const value of Object.values(snapshot)) if (typeof value === "number") assert.ok(Number.isFinite(value));
  processBudgetTaxMonth(state, { taxIncome: 120, spending: 110 });
  assert.ok(state.budgetTax.history.length === 1);
  assert.ok(budgetTaxHealthScore(state) >= 0 && budgetTaxHealthScore(state) <= 100);
  assertStateInvariants(state, "budget tax month");
});

import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { calculateMonthlyEconomy, monthlyEconomy, applyTaxProfile } from "../../src/systems/economy.js";
import { TAX_PROFILES } from "../../src/data/economyData.js";
import { assertStateInvariants } from "../helpers/invariants.js";

test("austerity changes publicSpending instead of creating a phantom field", () => {
  const state = createNewState();
  const before = state.publicSpending;
  const profile = TAX_PROFILES.find(item => item.id === "austerity");
  applyTaxProfile(state, profile);
  assert.equal(state.publicSpending, before - 5);
  assert.equal(Object.hasOwn(state, "spending"), false);
});

test("monthly economy report and mutation remain finite", () => {
  const state = createNewState();
  const preview = calculateMonthlyEconomy(state);
  for (const value of Object.values(preview)) assert.ok(Number.isFinite(value));
  monthlyEconomy(state);
  assertStateInvariants(state, "monthly economy");
});

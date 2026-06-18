import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { normalizeState, applyEffects, impeachmentRisk, commercialScore } from "../../src/systems/calculations.js";
import { assertStateInvariants } from "../helpers/invariants.js";

test("normalizeState contains invalid and extreme metrics", () => {
  const state = createNewState({
    approval: 900, economy: -20, politicalCapital: -1000, loyalty: 300,
    globalTension: Number.POSITIVE_INFINITY, treasury: -400, gdp: Number.NaN,
    crisis: 99, debt: 999, inflation: -2, unemployment: 99,
    leaderXP: -3, softCurrency: -10
  });
  normalizeState(state);
  assertStateInvariants(state, "normalized");
  assert.equal(state.approval, 100);
  assert.equal(state.economy, 0);
  assert.equal(state.politicalCapital, 0);
  assert.equal(state.loyalty, 100);
  assert.equal(state.globalTension, 50);
  assert.equal(state.treasury, 0);
  assert.equal(state.gdp, 0);
});

test("applyEffects never leaves bounded metrics outside their contracts", () => {
  const state = createNewState();
  applyEffects(state, { approval: 1000, rejection: -1000, globalTension: 500, treasury: -5000 });
  assert.equal(state.approval, 100);
  assert.equal(state.rejection, 0);
  assert.equal(state.globalTension, 100);
  assert.equal(state.treasury, 0);
});

test("risk and commercial score remain finite", () => {
  const state = createNewState();
  assert.ok(Number.isFinite(impeachmentRisk(state)));
  assert.ok(Number.isFinite(commercialScore(state)));
});

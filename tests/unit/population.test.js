import test from "node:test";
import assert from "node:assert/strict";
import { createNewState } from "../../src/core/stateFactory.js";
import { POPULATION_POLICIES } from "../../src/data/populationData.js";
import {
  createPopulationState,
  ensurePopulationState,
  runPopulationPolicy,
  processPopulationDay,
  weeklyPopulationCycle,
  monthlyPopulationCycle,
  populationSummary
} from "../../src/systems/population.js";

test("population state starts with complete regional and social structure", () => {
  const population = createPopulationState();
  assert.equal(population.schema, 1);
  assert.equal(population.regions.length, 5);
  assert.equal(population.groups.length, 6);
  assert.equal(Object.keys(population.demographics).length, 13);
  assert.ok(population.regions.every(region => region.populationShare > 0));
  assert.ok(population.groups.every(group => group.share > 0));
});

test("population migration repairs partial and invalid legacy state", () => {
  const state = createNewState();
  state.population = { demographics: { poverty: 999 }, regions: [{ id: "north", health: -100 }] };
  const population = ensurePopulationState(state);
  assert.equal(population.regions.length, 5);
  assert.equal(population.groups.length, 6);
  assert.equal(population.demographics.poverty, 100);
  assert.equal(population.regions.find(region => region.id === "north").health, 0);
  assert.ok(Number.isFinite(population.nationalSatisfaction));
});

test("public program targets vulnerable regions and matures without duplication", () => {
  const state = createNewState({ treasury: 2000 });
  const policy = { ...POPULATION_POLICIES.find(item => item.id === "family_health"), duration: 2, cooldown: 3 };
  const before = state.population.regions.map(region => ({ id: region.id, health: region.health }));
  assert.equal(runPopulationPolicy(state, policy), true);
  assert.equal(state.population.activePrograms.length, 1);
  assert.equal(state.treasury, 2000 - policy.cost);
  const targets = [...state.population.activePrograms[0].targets];
  assert.equal(targets.length, 2);
  processPopulationDay(state);
  assert.equal(state.population.activePrograms.length, 1);
  processPopulationDay(state);
  assert.equal(state.population.activePrograms.length, 0);
  assert.equal(state.population.completedPrograms.length, 1);
  for (const id of targets) {
    const previous = before.find(region => region.id === id).health;
    assert.ok(state.population.regions.find(region => region.id === id).health > previous);
  }
  processPopulationDay(state);
  assert.equal(state.population.completedPrograms.length, 1);
});

test("weekly and monthly population cycles remain bounded and affect government", () => {
  const state = createNewState({ economy: 62, approval: 58, unemployment: 8.2 });
  const beforeApproval = state.approval;
  weeklyPopulationCycle(state);
  monthlyPopulationCycle(state, { monthlyBalance: 20 });
  const summary = populationSummary(state);
  assert.ok(summary.nationalSatisfaction >= 0 && summary.nationalSatisfaction <= 100);
  assert.ok(summary.qualityOfLife >= 0 && summary.qualityOfLife <= 100);
  assert.ok(summary.regionalInequality >= 0 && summary.regionalInequality <= 100);
  assert.ok(summary.regions.every(region => ["satisfaction","income","employment","education","health","security","infrastructure","housing","environment"].every(key => region[key] >= 0 && region[key] <= 100)));
  assert.ok(Number.isFinite(state.approval));
  assert.notEqual(state.approval, beforeApproval);
});

import assert from "node:assert/strict";

export const PERCENT_KEYS = [
  "approval","economy","stability","influence","coalition","media","elite","military",
  "diplomacy","intelligence","technology","environment","prestige","opposition","security","coupRisk",
  "marketConfidence","industry","agribusiness","services","energy","campaign","rejection","loyalty",
  "govNarrative","globalTension","politicalCapital","congressPressure","tradeBalance","inequality"
];

export function assertStateInvariants(state, label = "state") {
  assert.ok(state && typeof state === "object", `${label}: state object required`);
  assert.ok(Number.isInteger(state.day) && state.day >= 1 && state.day <= 30, `${label}: invalid day ${state.day}`);
  assert.ok(Number.isInteger(state.month) && state.month >= 1 && state.month <= 12, `${label}: invalid month ${state.month}`);
  assert.ok(Number.isInteger(state.year) && state.year >= 2020, `${label}: invalid year ${state.year}`);

  for (const [key, value] of Object.entries(state)) {
    if (typeof value === "number") assert.ok(Number.isFinite(value), `${label}: ${key} is not finite`);
  }
  for (const key of PERCENT_KEYS) {
    assert.ok(Number.isFinite(state[key]), `${label}: ${key} is not finite`);
    assert.ok(state[key] >= 0 && state[key] <= 100, `${label}: ${key} out of range: ${state[key]}`);
  }

  assert.ok(state.crisis >= 0 && state.crisis <= 10, `${label}: crisis out of range`);
  assert.ok(state.debt >= 0 && state.debt <= 160, `${label}: debt out of range`);
  assert.ok(state.inflation >= 0 && state.inflation <= 45, `${label}: inflation out of range`);
  assert.ok(state.unemployment >= 0 && state.unemployment <= 35, `${label}: unemployment out of range`);
  assert.ok(state.interestRate >= 0 && state.interestRate <= 30, `${label}: interestRate out of range`);
  assert.ok(state.taxBurden >= 5 && state.taxBurden <= 60, `${label}: taxBurden out of range`);
  assert.ok(state.publicSpending >= 5 && state.publicSpending <= 70, `${label}: publicSpending out of range`);
  assert.ok(state.treasury >= 0 && Number.isInteger(state.treasury), `${label}: invalid treasury`);
  assert.ok(state.gdp >= 0 && Number.isInteger(state.gdp), `${label}: invalid GDP`);

  assert.ok(Array.isArray(state.projects) && state.projects.length <= 3, `${label}: project queue overflow`);
  assert.ok(Array.isArray(state.treaties) && state.treaties.length <= 24, `${label}: treaty history overflow`);
  assert.ok(Array.isArray(state.activeOperations) && state.activeOperations.length <= 10, `${label}: operations overflow`);
  assert.ok(Array.isArray(state.crisisHistory) && state.crisisHistory.length <= 15, `${label}: crisis history overflow`);


  const population = state.population;
  assert.ok(population && typeof population === "object", `${label}: population state required`);
  assert.equal(population.schema, 1, `${label}: population schema mismatch`);
  assert.ok(Array.isArray(population.regions) && population.regions.length === 5, `${label}: population regions mismatch`);
  assert.ok(Array.isArray(population.groups) && population.groups.length === 6, `${label}: population groups mismatch`);
  for (const key of ["nationalSatisfaction", "qualityOfLife", "regionalInequality", "serviceCoverage"]) {
    assert.ok(Number.isFinite(population[key]) && population[key] >= 0 && population[key] <= 100, `${label}: population ${key} out of range`);
  }
  for (const region of population.regions) {
    for (const key of ["satisfaction","income","employment","education","health","security","infrastructure","housing","environment"]) {
      assert.ok(Number.isFinite(region[key]) && region[key] >= 0 && region[key] <= 100, `${label}: region ${region.id}/${key} out of range`);
    }
  }
  for (const group of population.groups) {
    for (const key of ["satisfaction","trust","incomeSecurity"]) {
      assert.ok(Number.isFinite(group[key]) && group[key] >= 0 && group[key] <= 100, `${label}: group ${group.id}/${key} out of range`);
    }
  }
  const demographics = population.demographics || {};
  for (const key of ["populationMillions","populationGrowth","urbanization","lifeExpectancy","literacy","poverty","extremePoverty","hunger","sanitation","housingDeficit","birthRate","migrationBalance","medianAge"]) {
    assert.ok(Number.isFinite(demographics[key]), `${label}: demographic ${key} is not finite`);
  }
  assert.ok(Array.isArray(population.activePrograms) && population.activePrograms.length <= 12, `${label}: population program queue overflow`);
  assert.ok(Array.isArray(population.completedPrograms) && population.completedPrograms.length <= 24, `${label}: completed population program overflow`);

  for (const country of state.aiCountries || []) {
    assert.ok(Number.isFinite(country.relation) && country.relation >= 0 && country.relation <= 100, `${label}: country relation out of range`);
    assert.ok(Number.isFinite(country.tension) && country.tension >= 0 && country.tension <= 100, `${label}: country tension out of range`);
  }
}

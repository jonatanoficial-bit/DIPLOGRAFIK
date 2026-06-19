import fs from "node:fs";
import { createNewState } from "../src/core/stateFactory.js";
import { advanceDay } from "../src/systems/coreLoop.js";
import { normalizeState } from "../src/systems/calculations.js";
import { seededRandom, withRandom } from "./helpers/random.js";
import { assertStateInvariants, PERCENT_KEYS } from "./helpers/invariants.js";

const years = 30;
const daysPerYear = 360;
const totalDays = years * daysPerYear;
const seeds = [11, 29, 47, 83, 101, 211, 307, 509, 701, 907, 1201];
const profiles = [
  { id: "baseline", overrides: {} },
  { id: "institutional_stress", overrides: { approval: 28, economy: 32, stability: 30, coalition: 27, corruption: 68, crisis: 4, loyalty: 35 } },
  { id: "economic_boom", overrides: { approval: 74, economy: 78, stability: 70, coalition: 68, corruption: 12, marketConfidence: 82, tradeBalance: 72 } }
];

const globalMin = {};
const globalMax = {};
for (const key of PERCENT_KEYS) {
  globalMin[key] = Number.POSITIVE_INFINITY;
  globalMax[key] = Number.NEGATIVE_INFINITY;
}

const cases = [];
let failed = false;
for (let index = 0; index < seeds.length; index += 1) {
  const seed = seeds[index];
  const profile = profiles[index % profiles.length];
  const state = createNewState(profile.overrides);
  normalizeState(state);
  const messages = { total: 0, positive: 0, negative: 0, warning: 0, info: 0 };
  const log = (_message, type = "info") => {
    messages.total += 1;
    messages[type] = (messages[type] || 0) + 1;
  };
  const startedAt = Date.now();
  let error = null;

  try {
    withRandom(seededRandom(seed), () => {
      for (let day = 1; day <= totalDays; day += 1) {
        advanceDay(state, log, 1, { ignoreOutcomes: true });
        if (day % 30 === 0 || day === totalDays) {
          assertStateInvariants(state, `${profile.id}/seed-${seed}/day-${day}`);
          for (const key of PERCENT_KEYS) {
            globalMin[key] = Math.min(globalMin[key], state[key]);
            globalMax[key] = Math.max(globalMax[key], state[key]);
          }
        }
      }
    });
  } catch (exception) {
    error = String(exception?.stack || exception);
    failed = true;
  }

  cases.push({
    seed,
    profile: profile.id,
    simulated_days: totalDays,
    simulated_years: years,
    duration_ms: Date.now() - startedAt,
    passed: !error,
    error,
    final: {
      date: `${state.day}/${state.month}/${state.year}`,
      approval: state.approval,
      economy: state.economy,
      stability: state.stability,
      politicalCapital: state.politicalCapital,
      loyalty: state.loyalty,
      globalTension: state.globalTension,
      treasury: state.treasury,
      gdp: state.gdp,
      debt: state.debt,
      crisis: state.crisis,
      electionDays: state.electionDays,
      treaties: state.treaties.length,
      activeOperations: state.activeOperations.length,
      crisisHistory: state.crisisHistory.length,
      populationSatisfaction: state.population.nationalSatisfaction,
      qualityOfLife: state.population.qualityOfLife,
      regionalInequality: state.population.regionalInequality,
      poverty: state.population.demographics.poverty
    },
    messages
  });
}

const averages = {};
for (const key of ["approval", "economy", "stability", "politicalCapital", "loyalty", "globalTension", "treasury", "gdp", "debt", "crisis", "populationSatisfaction", "qualityOfLife", "regionalInequality", "poverty"]) {
  averages[key] = Number((cases.reduce((sum, item) => sum + Number(item.final[key] || 0), 0) / cases.length).toFixed(3));
}

const balanceWarnings = [];
if (averages.approval < 18) balanceWarnings.push("Average approval remains below the Core Loop 2.0 recovery floor.");
if (averages.stability < 18) balanceWarnings.push("Average stability remains below the Core Loop 2.0 recovery floor.");
if (averages.politicalCapital < 2) balanceWarnings.push("Average political capital remains functionally exhausted.");
if (averages.crisis > 7.5) balanceWarnings.push("Average crisis severity remains structurally excessive.");
if (averages.debt >= 145) balanceWarnings.push("Debt converges near its upper cap without player intervention.");
if (averages.globalTension >= 90) balanceWarnings.push("Global tension converges near its upper cap in idle simulations.");
if (averages.gdp > 15000) balanceWarnings.push("GDP compounding is outside the expected thirty-year envelope.");
if (averages.populationSatisfaction < 15) balanceWarnings.push("Average population satisfaction falls below the emergency floor.");
if (averages.qualityOfLife < 20) balanceWarnings.push("Average quality of life falls below the long-term floor.");
if (averages.regionalInequality > 75) balanceWarnings.push("Regional inequality remains structurally excessive.");
if (averages.poverty > 80) balanceWarnings.push("Poverty remains structurally excessive.");
for (const item of cases) {
  if (item.final.stability < 8) balanceWarnings.push(`Seed ${item.seed}/${item.profile} ended below the emergency stability floor.`);
  if (item.final.crisis > 9.2) balanceWarnings.push(`Seed ${item.seed}/${item.profile} ended with crisis locked near the cap.`);
}
const uniqueWarnings = [...new Set(balanceWarnings)];

const report = {
  project: "DIPLOCRAFT",
  suite: "deterministic-long-term-simulation",
  matrix_cases: cases.length,
  years_per_case: years,
  total_simulated_days: totalDays * cases.length,
  seeds,
  profiles: profiles.map(item => item.id),
  invariants_checked_every_days: 30,
  metric_bounds_observed: Object.fromEntries(PERCENT_KEYS.map(key => [key, { min: globalMin[key], max: globalMax[key] }])),
  final_averages: averages,
  cases,
  structural_invariants_passed: !failed && cases.every(item => item.passed) && uniqueWarnings.length === 0,
  balance_warnings: uniqueWarnings,
  balance_status: uniqueWarnings.length ? "core-loop-2-balance-failed" : "within-observed-targets",
  passed: !failed && cases.every(item => item.passed) && uniqueWarnings.length === 0
};

fs.writeFileSync("tests/simulation-results.json", JSON.stringify(report, null, 2) + "\n");
const summary = [
  `DIPLOCRAFT simulation matrix`,
  `Cases: ${cases.length}`,
  `Years per case: ${years}`,
  `Total simulated days: ${report.total_simulated_days}`,
  `Structural invariants passed: ${report.passed}`,
  `Balance warnings: ${uniqueWarnings.length}`,
  ...uniqueWarnings.map(item => `WARNING ${item}`),
  ...cases.map(item => `${item.passed ? "PASS" : "FAIL"} seed=${item.seed} profile=${item.profile} final=${item.final.date} duration=${item.duration_ms}ms`)
].join("\n") + "\n";
fs.writeFileSync("tests/simulation-output.txt", summary);
console.log(summary.trim());
if (!report.passed) process.exit(1);

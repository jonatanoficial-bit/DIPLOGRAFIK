import { applyEffects, normalizeState, clamp } from "./calculations.js";
import { processDeepEconomyMonth, ensureDeepEconomyState, applyDeepEconomyActionEffects } from "./economyDeep.js";

export function calculateMonthlyEconomy(state) {
  ensureDeepEconomyState(state);
  const productionPower =
    state.industry * 0.24 +
    state.agribusiness * 0.19 +
    state.services * 0.35 +
    state.technology * 0.13 +
    state.energy * 0.09;

  const interestDrag = Math.max(0, state.interestRate - 8) * 0.24;
  const inflationDrag = Math.max(0, state.inflation - 6) * 0.31;
  const debtDrag = Math.max(0, state.debt - 65) * 0.035;
  const confidenceBoost = (state.marketConfidence - 50) * 0.035;
  const tradeBoost = (state.tradeBalance - 50) * 0.028;
  const resilienceBoost = ((state.governance?.fiscalCredibility ?? 50) - 50) * 0.025;

  const growthIndex = clamp(
    (productionPower - 50) * 0.055 - interestDrag - inflationDrag - debtDrag + confidenceBoost + tradeBoost + resilienceBoost,
    -4.5,
    5.5
  );
  const taxIncome = 24 + state.gdp * 0.0032 + state.taxBurden * 1.22 + state.economy * 0.38;
  const spending = 29 + state.publicSpending * 1.32 + state.crisis * 4.1 + state.debt * 0.11;
  const monthlyBalance = Math.round(taxIncome - spending);

  return { productionPower, growthIndex, taxIncome, spending, monthlyBalance };
}

export function monthlyEconomy(state) {
  const report = calculateMonthlyEconomy(state);

  state.lastMonthlyBalance = report.monthlyBalance;
  state.treasury += report.monthlyBalance;
  // growthIndex is an annualized percentage; only one twelfth compounds each month.
  state.gdp += Math.round(state.gdp * (report.growthIndex / 1200));
  state.economy += report.growthIndex * 0.62 + (report.productionPower - state.economy) * 0.035;

  state.debt += report.monthlyBalance < 0 ? Math.abs(report.monthlyBalance) / 135 : -Math.min(0.32, report.monthlyBalance / 165);
  state.inflation +=
    (state.publicSpending - 35) * 0.012 -
    (state.interestRate - 9) * 0.034 +
    (state.energy < 45 ? 0.12 : -0.045) +
    (report.growthIndex > 3 ? 0.08 : 0) +
    (6 - state.inflation) * 0.035;
  state.unemployment += report.growthIndex < 0 ? Math.abs(report.growthIndex) * 0.11 : -report.growthIndex * 0.075;
  state.unemployment += (9 - state.unemployment) * 0.025;
  state.marketConfidence += report.monthlyBalance > 0 ? 0.65 : -0.55;
  state.marketConfidence += report.growthIndex * 0.18 + (55 - state.marketConfidence) * 0.02;

  applyEffects(state, {
    approval:
      (state.economy - 50) * 0.018 -
      Math.max(0, state.inflation - 8) * 0.075 -
      Math.max(0, state.unemployment - 10) * 0.085 -
      Math.max(0, state.inequality - 55) * 0.025,
    stability:
      (state.unemployment > 12 ? -0.22 : 0.08) -
      Math.max(0, state.inflation - 10) * 0.035 +
      ((state.governance?.socialCohesion ?? 50) - 50) * 0.012
  });

  const deepReport = processDeepEconomyMonth(state, report);
  if (state.governance?.reports?.monthly) state.governance.reports.monthly.deepEconomy = { growth: deepReport.annualizedGrowth, primaryResult: deepReport.primaryResult, fiscalBalance: deepReport.fiscalBalance };
  normalizeState(state);
  return { ...report, deep: deepReport };
}

export function applyTaxProfile(state, profile) {
  const legacyEffects = applyDeepEconomyActionEffects(state, profile.effects);
  applyEffects(state, legacyEffects);
  normalizeState(state);
}

export function applyBudgetChange(state, key, value) {
  state.budget[key] = Number(value);
  const total = Object.values(state.budget).reduce((sum, item) => sum + Number(item), 0);
  state.publicSpending = total / Object.keys(state.budget).length;
  normalizeState(state);
}

export function budgetPolicyEffects(state) {
  const b = state.budget;
  return {
    approval: (b.health + b.education + b.social - 105) / 12,
    economy: (b.infrastructure + b.industry + b.technology - 90) / 14,
    stability: (b.security - 28) / 5,
    technology: (b.technology - 25) / 3,
    industry: (b.industry + b.infrastructure - 55) / 5,
    services: (b.health + b.education - 55) / 8,
    debt: (Object.values(b).reduce((a,c)=>a+c,0) - 210) / 30
  };
}

export function applyBudgetPolicy(state) {
  const legacyEffects = applyDeepEconomyActionEffects(state, budgetPolicyEffects(state));
  applyEffects(state, legacyEffects);
  normalizeState(state);
}

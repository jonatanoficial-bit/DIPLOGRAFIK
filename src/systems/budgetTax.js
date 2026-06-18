import { clamp } from "../core/dom.js";
import { TAX_INSTRUMENTS, SPENDING_RULES } from "../data/budgetTaxData.js";

export const BUDGET_TAX_SCHEMA = 1;
export const BUDGET_TAX_HISTORY_LIMIT = 36;

const DEFAULT_TAX_RATES = Object.freeze({
  incomeTax: 23,
  corporateTax: 27,
  consumptionTax: 20,
  payrollTax: 17,
  wealthTax: 4,
  greenTax: 3
});

export function createBudgetTaxState() {
  return {
    schema: BUDGET_TAX_SCHEMA,
    activeSpendingRule: "baseline_budget",
    taxRates: { ...DEFAULT_TAX_RATES },
    taxCompliance: 62,
    evasionRate: 28,
    administrativeCost: 14,
    spendingEfficiency: 56,
    mandatorySpendingRatio: 72,
    discretionarySpace: 18,
    capitalExecution: 48,
    regionalBalance: 44,
    fiscalTransparency: 54,
    earmarkingPressure: 58,
    budgetCredibility: 55,
    revenueMix: { direct: 42, indirect: 43, payroll: 12, green: 3 },
    lastSnapshot: null,
    history: []
  };
}

export function ensureBudgetTaxState(state) {
  if (!state.budgetTax || typeof state.budgetTax !== "object") state.budgetTax = createBudgetTaxState();
  const base = createBudgetTaxState();
  state.budgetTax = {
    ...base,
    ...state.budgetTax,
    taxRates: { ...base.taxRates, ...(state.budgetTax.taxRates || {}) },
    revenueMix: { ...base.revenueMix, ...(state.budgetTax.revenueMix || {}) },
    history: Array.isArray(state.budgetTax.history) ? state.budgetTax.history.slice(-BUDGET_TAX_HISTORY_LIMIT) : []
  };
  normalizeBudgetTaxState(state);
  return state.budgetTax;
}

export function normalizeBudgetTaxState(state) {
  const bt = state.budgetTax;
  if (!bt || typeof bt !== "object") return;
  for (const instrument of TAX_INSTRUMENTS) {
    const value = Number(bt.taxRates?.[instrument.rateKey] ?? instrument.defaultValue ?? DEFAULT_TAX_RATES[instrument.rateKey] ?? 0);
    bt.taxRates[instrument.rateKey] = clamp(Number.isFinite(value) ? value : instrument.defaultValue, instrument.min, instrument.max);
  }
  const pctKeys = ["taxCompliance","evasionRate","spendingEfficiency","mandatorySpendingRatio","discretionarySpace","capitalExecution","regionalBalance","fiscalTransparency","earmarkingPressure","budgetCredibility"];
  for (const key of pctKeys) bt[key] = clamp(Number.isFinite(Number(bt[key])) ? Number(bt[key]) : 50, 0, 100);
  bt.administrativeCost = clamp(Number.isFinite(Number(bt.administrativeCost)) ? Number(bt.administrativeCost) : 14, 2, 35);
  bt.history = Array.isArray(bt.history) ? bt.history.slice(-BUDGET_TAX_HISTORY_LIMIT) : [];
  const total = Number(bt.revenueMix.direct || 0) + Number(bt.revenueMix.indirect || 0) + Number(bt.revenueMix.payroll || 0) + Number(bt.revenueMix.green || 0);
  if (!Number.isFinite(total) || total <= 0) bt.revenueMix = { direct: 42, indirect: 43, payroll: 12, green: 3 };
}

export function calculateBudgetTaxSnapshot(state, economyReport = {}) {
  const bt = ensureBudgetTaxState(state);
  const rule = SPENDING_RULES.find(item => item.id === bt.activeSpendingRule) || SPENDING_RULES[0];
  const rates = bt.taxRates;
  const gdpBase = Math.max(350, Number(state.deepEconomy?.nominalGdp || state.gdp || 2100));
  const taxableBase = gdpBase * (0.165 + Number(state.economy || 50) / 950 + Number(state.marketConfidence || 50) / 2200);
  const complianceFactor = clamp((bt.taxCompliance - bt.evasionRate * 0.42 - bt.administrativeCost * 0.28 + 42) / 100, 0.35, 1.12);
  const weightedRate = TAX_INSTRUMENTS.reduce((sum, item) => sum + (Number(rates[item.rateKey] || 0) * item.revenueWeight), 0) / Math.max(1, TAX_INSTRUMENTS.reduce((sum, item) => sum + item.revenueWeight, 0));
  const progressivity = TAX_INSTRUMENTS.reduce((sum, item) => sum + Number(rates[item.rateKey] || 0) * item.progressivity, 0) / 22;
  const grossRevenue = taxableBase * (weightedRate / 100) * complianceFactor;
  const royalties = Math.max(0, Number(state.agribusiness || 50) - 50) * 0.55 + Math.max(0, Number(state.energy || 50) - 50) * 0.62;
  const primaryRevenue = grossRevenue + royalties + Number(economyReport.taxIncome || 0) * 0.16;
  const spendingBase = Number(economyReport.spending || 0) + Number(state.publicSpending || 31) * 1.15;
  const mandatorySpending = spendingBase * (bt.mandatorySpendingRatio / 100) * (1 + (rule.stance.socialShield - 0.5) * 0.18);
  const investmentEnvelope = spendingBase * (0.16 + rule.stance.investmentFloor * 0.2) * (bt.capitalExecution / 100);
  const wasteLoss = spendingBase * ((100 - bt.spendingEfficiency) / 100) * 0.18;
  const emergencyReserve = spendingBase * rule.stance.emergencyReserve * 0.055;
  const primaryExpense = mandatorySpending + investmentEnvelope + wasteLoss + emergencyReserve;
  const primaryBalance = primaryRevenue - primaryExpense;
  const deficitPressure = clamp(50 - primaryBalance * 0.45 + (bt.earmarkingPressure - 50) * 0.32, 0, 100);
  const taxPressure = clamp(weightedRate * 1.45 + (100 - bt.taxCompliance) * 0.22 + Math.max(0, state.inflation - 6) * 1.3, 0, 100);
  const socialReturn = clamp((state.budget.health + state.budget.education + state.budget.social) / 3 * 1.25 + bt.spendingEfficiency * 0.32 + rule.stance.socialShield * 12 - bt.earmarkingPressure * 0.08, 0, 100);
  const investmentReturn = clamp((state.budget.infrastructure + state.budget.industry + state.budget.technology) / 3 * 1.35 + bt.capitalExecution * 0.4 + rule.stance.investmentFloor * 14, 0, 100);
  const fiscalSpace = clamp(55 + primaryBalance * 0.55 + bt.discretionarySpace * 0.28 + bt.budgetCredibility * 0.2 - Number(state.debt || 50) * 0.25, 0, 100);
  return { rule, weightedRate, progressivity, grossRevenue, primaryRevenue, primaryExpense, mandatorySpending, investmentEnvelope, wasteLoss, emergencyReserve, primaryBalance, deficitPressure, taxPressure, socialReturn, investmentReturn, fiscalSpace };
}

export function setTaxRate(state, rateKey, value) {
  const bt = ensureBudgetTaxState(state);
  const instrument = TAX_INSTRUMENTS.find(item => item.rateKey === rateKey);
  if (!instrument) return bt;
  bt.taxRates[rateKey] = clamp(Number(value), instrument.min, instrument.max);
  normalizeBudgetTaxState(state);
  syncLegacyTaxBurden(state);
  return bt;
}

export function setSpendingRule(state, id) {
  const bt = ensureBudgetTaxState(state);
  if (SPENDING_RULES.some(item => item.id === id)) bt.activeSpendingRule = id;
  normalizeBudgetTaxState(state);
  return SPENDING_RULES.find(item => item.id === bt.activeSpendingRule) || SPENDING_RULES[0];
}

export function applyBudgetTaxEffects(state, effects = {}) {
  const bt = ensureBudgetTaxState(state);
  const legacy = {};
  for (const [key, raw] of Object.entries(effects || {})) {
    const value = Number(raw || 0);
    if (["taxCompliance","evasionRate","administrativeCost","spendingEfficiency","mandatorySpendingRatio","discretionarySpace","capitalExecution","regionalBalance","fiscalTransparency","earmarkingPressure","budgetCredibility"].includes(key)) {
      bt[key] = Number(bt[key] || 0) + value;
    } else if (state.deepEconomy && Object.prototype.hasOwnProperty.call(state.deepEconomy, key)) {
      state.deepEconomy[key] = Number(state.deepEconomy[key] || 0) + value;
    } else {
      legacy[key] = (legacy[key] || 0) + value;
    }
  }
  normalizeBudgetTaxState(state);
  syncLegacyTaxBurden(state);
  return legacy;
}

export function processBudgetTaxMonth(state, economyReport = {}) {
  ensureBudgetTaxState(state);
  const snapshot = calculateBudgetTaxSnapshot(state, economyReport);
  const bt = state.budgetTax;
  const rule = snapshot.rule;
  const balanceSignal = clamp(snapshot.primaryBalance / 22, -3.5, 3.5);
  bt.budgetCredibility += balanceSignal * 0.4 + (rule.stance.ceiling - 0.5) * 0.32 - Math.max(0, state.debt - 70) * 0.018;
  bt.discretionarySpace += balanceSignal * 0.34 + (snapshot.fiscalSpace - 50) * 0.025 - (bt.mandatorySpendingRatio - 70) * 0.018;
  bt.taxCompliance += (state.corruption < 25 ? 0.12 : -0.08) + (bt.fiscalTransparency - 50) * 0.012 - (bt.evasionRate - 28) * 0.018;
  bt.evasionRate += (bt.administrativeCost - 14) * 0.035 - (bt.taxCompliance - 60) * 0.025 + (snapshot.taxPressure > 70 ? 0.22 : -0.05);
  bt.spendingEfficiency += (bt.fiscalTransparency - 50) * 0.018 - (state.corruption - 20) * 0.022 + (rule.stance.ceiling - 0.5) * 0.11;
  bt.mandatorySpendingRatio += (state.unemployment > 11 ? 0.16 : -0.04) + (rule.stance.socialShield - 0.5) * 0.12;
  bt.capitalExecution += (state.governance?.administrativeCapacity ?? 60) > 60 ? 0.12 : -0.08;
  bt.regionalBalance += (state.population?.nationalSatisfaction ?? 55) < 45 ? -0.06 : 0.04;
  state.treasury += Math.round(snapshot.primaryBalance * 0.22);
  state.debt += snapshot.primaryBalance < 0 ? Math.min(0.55, Math.abs(snapshot.primaryBalance) / 95) : -Math.min(0.42, snapshot.primaryBalance / 120);
  state.marketConfidence += (bt.budgetCredibility - 55) * 0.012 + (snapshot.taxPressure > 72 ? -0.08 : 0.04);
  state.approval += (snapshot.socialReturn - 55) * 0.01 - (snapshot.taxPressure - 55) * 0.008;
  state.economy += (snapshot.investmentReturn - 55) * 0.012 - Math.max(0, snapshot.deficitPressure - 70) * 0.006;
  state.inequality += snapshot.progressivity < 0 ? 0.08 : -Math.min(0.18, snapshot.progressivity * 0.012);
  state.governance.fiscalCredibility += (bt.budgetCredibility - 55) * 0.02 + balanceSignal * 0.05;
  state.governance.socialCohesion += (snapshot.socialReturn - 55) * 0.01 + (bt.regionalBalance - 45) * 0.008;
  updateRevenueMix(bt);
  bt.lastSnapshot = summarizeSnapshot(snapshot);
  bt.history.push({ y: state.year, m: state.month, revenue: Number(snapshot.primaryRevenue.toFixed(1)), expense: Number(snapshot.primaryExpense.toFixed(1)), balance: Number(snapshot.primaryBalance.toFixed(1)), compliance: Number(bt.taxCompliance.toFixed(1)), evasion: Number(bt.evasionRate.toFixed(1)), fiscalSpace: Number(snapshot.fiscalSpace.toFixed(1)) });
  bt.history = bt.history.slice(-BUDGET_TAX_HISTORY_LIMIT);
  normalizeBudgetTaxState(state);
  syncLegacyTaxBurden(state);
  return snapshot;
}

export function budgetTaxHealthScore(state) {
  ensureBudgetTaxState(state);
  const snapshot = calculateBudgetTaxSnapshot(state);
  const bt = state.budgetTax;
  return Math.round(clamp(
    bt.taxCompliance * 0.18 +
    (100 - bt.evasionRate) * 0.16 +
    bt.spendingEfficiency * 0.18 +
    bt.budgetCredibility * 0.18 +
    snapshot.fiscalSpace * 0.16 +
    snapshot.socialReturn * 0.07 +
    snapshot.investmentReturn * 0.07,
    0,
    100
  ));
}

function updateRevenueMix(bt) {
  const rates = bt.taxRates;
  const direct = Math.max(1, rates.incomeTax * 1.25 + rates.corporateTax * 0.85 + rates.wealthTax * 3.2);
  const indirect = Math.max(1, rates.consumptionTax * 1.55 + rates.greenTax * 0.7);
  const payroll = Math.max(1, rates.payrollTax * 0.9);
  const green = Math.max(0.5, rates.greenTax * 1.25);
  const total = direct + indirect + payroll + green;
  bt.revenueMix = { direct: Math.round(direct / total * 100), indirect: Math.round(indirect / total * 100), payroll: Math.round(payroll / total * 100), green: Math.max(1, Math.round(green / total * 100)) };
}

function summarizeSnapshot(snapshot) {
  return {
    weightedRate: Number(snapshot.weightedRate.toFixed(2)),
    grossRevenue: Number(snapshot.grossRevenue.toFixed(1)),
    primaryRevenue: Number(snapshot.primaryRevenue.toFixed(1)),
    primaryExpense: Number(snapshot.primaryExpense.toFixed(1)),
    primaryBalance: Number(snapshot.primaryBalance.toFixed(1)),
    fiscalSpace: Number(snapshot.fiscalSpace.toFixed(1)),
    taxPressure: Number(snapshot.taxPressure.toFixed(1)),
    socialReturn: Number(snapshot.socialReturn.toFixed(1)),
    investmentReturn: Number(snapshot.investmentReturn.toFixed(1))
  };
}

function syncLegacyTaxBurden(state) {
  const bt = state.budgetTax;
  if (!bt) return;
  const rates = bt.taxRates;
  const base = rates.incomeTax * 0.19 + rates.corporateTax * 0.17 + rates.consumptionTax * 0.32 + rates.payrollTax * 0.18 + rates.wealthTax * 0.07 + rates.greenTax * 0.07;
  state.taxBurden = clamp(base + 17 - bt.evasionRate * 0.045 + bt.taxCompliance * 0.035, 5, 60);
}

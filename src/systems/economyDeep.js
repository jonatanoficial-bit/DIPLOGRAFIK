import { clamp } from "./calculations.js";
import { FISCAL_RULES, MONETARY_POLICIES } from "../data/economyDeepData.js";

export const ECONOMY_DEEP_SCHEMA = 1;
const MONTHLY_HISTORY_LIMIT = 48;
const QUARTER_HISTORY_LIMIT = 24;

export function createDeepEconomyState(overrides = {}) {
  const base = {
    schema: ECONOMY_DEEP_SCHEMA,
    fiscalRule: "balanced_rule",
    monetaryPolicy: "inflation_target",
    realGdp: 2100,
    nominalGdp: 2230,
    gdpPerCapita: 10.35,
    potentialGrowth: 2.1,
    outputGap: -0.8,
    productivity: 49.5,
    privateInvestment: 47.8,
    publicInvestment: 43.6,
    businessConfidence: 51.4,
    consumerConfidence: 50.2,
    realWage: 49.8,
    costOfLiving: 55.5,
    householdDebt: 42.0,
    creditAvailability: 49.0,
    exports: 315,
    imports: 298,
    exchangeRate: 5.15,
    reserves: 338,
    currentAccount: 1.1,
    primaryRevenue: 805,
    primaryExpense: 792,
    primaryResult: 13,
    debtService: 104,
    riskPremium: 3.9,
    informalEconomy: 36.0,
    povertyEconomic: 27.4,
    middleClassSecurity: 46.0,
    quarterlyGrowth: 0,
    annualizedGrowth: 0,
    inflationTrend: 0,
    unemploymentTrend: 0,
    lastShock: null,
    monthlyHistory: [],
    quarterHistory: []
  };
  return mergeDeep(base, overrides);
}

export function ensureDeepEconomyState(state) {
  const current = state.deepEconomy && typeof state.deepEconomy === "object" ? state.deepEconomy : null;
  if (current && current.schema === ECONOMY_DEEP_SCHEMA && Array.isArray(current.monthlyHistory) && Array.isArray(current.quarterHistory) && Number.isFinite(Number(current.realGdp))) {
    if (current.monthlyHistory.length > MONTHLY_HISTORY_LIMIT) current.monthlyHistory = current.monthlyHistory.slice(-MONTHLY_HISTORY_LIMIT);
    if (current.quarterHistory.length > QUARTER_HISTORY_LIMIT) current.quarterHistory = current.quarterHistory.slice(-QUARTER_HISTORY_LIMIT);
    return current;
  }
  const merged = createDeepEconomyState(current || {});
  merged.schema = ECONOMY_DEEP_SCHEMA;
  if (!Number.isFinite(Number(merged.realGdp)) || merged.realGdp <= 0) merged.realGdp = Number(state.gdp || 2100);
  if (!Number.isFinite(Number(merged.nominalGdp)) || merged.nominalGdp <= 0) merged.nominalGdp = Number(state.gdp || 2100) * (1 + Number(state.inflation || 6) / 100);
  merged.monthlyHistory = Array.isArray(merged.monthlyHistory) ? merged.monthlyHistory.slice(-MONTHLY_HISTORY_LIMIT) : [];
  merged.quarterHistory = Array.isArray(merged.quarterHistory) ? merged.quarterHistory.slice(-QUARTER_HISTORY_LIMIT) : [];
  state.deepEconomy = normalizeDeepEconomy(merged, state);
  return state.deepEconomy;
}

export function calculateDeepEconomySnapshot(state, legacyReport = null) {
  const econ = ensureDeepEconomyState(state);
  const fiscalRule = FISCAL_RULES.find(item => item.id === econ.fiscalRule) || FISCAL_RULES[0];
  const monetary = MONETARY_POLICIES.find(item => item.id === econ.monetaryPolicy) || MONETARY_POLICIES[0];
  const productionPower = Number(legacyReport?.productionPower ?? (state.industry * 0.24 + state.agribusiness * 0.19 + state.services * 0.35 + state.technology * 0.13 + state.energy * 0.09));
  const investmentMix = econ.privateInvestment * 0.46 + econ.publicInvestment * 0.26 + econ.productivity * 0.28;
  const fiscalImpulse = (Number(state.publicSpending || 35) - 35) * 0.045 + (fiscalRule?.stance?.investmentBias || 0.5) * 1.3 - (fiscalRule?.stance?.spendingDiscipline || 0.5) * 0.7;
  const creditImpulse = ((monetary?.stance?.creditImpulse || 0.45) - 0.45) * 3 - Math.max(0, Number(state.interestRate || 10) - 9) * 0.22;
  const tradeImpulse = (Number(state.tradeBalance || 50) - 50) * 0.035 + (econ.exports - econ.imports) / 420;
  const confidenceImpulse = (econ.businessConfidence + econ.consumerConfidence + Number(state.marketConfidence || 50)) / 3 - 50;
  const structuralDrag = Math.max(0, Number(state.debt || 48) - 70) * 0.025 + Math.max(0, Number(state.inflation || 6) - (monetary?.stance?.inflationTarget || 5)) * 0.22 + Math.max(0, econ.riskPremium - 4.5) * 0.18;
  const annualizedGrowth = round2(clamp(
    (productionPower - 50) * 0.075 + (investmentMix - 50) * 0.062 + fiscalImpulse + creditImpulse + tradeImpulse + confidenceImpulse * 0.035 - structuralDrag,
    -6.5, 7.5
  ));
  const quarterlyGrowth = round2(annualizedGrowth / 4);
  const taxEfficiency = clamp((Number(state.taxBurden || 33) / 33) * (1 - econ.informalEconomy / 170) * (Number(state.economy || 50) / 50), 0.55, 1.45);
  const primaryRevenue = Math.round(econ.nominalGdp * (Number(state.taxBurden || 33) / 100) * taxEfficiency / 4);
  const primaryExpense = Math.round(econ.nominalGdp * (Number(state.publicSpending || 35) / 100) * (0.74 + Number(state.crisis || 0) * 0.018) / 4);
  const primaryResult = primaryRevenue - primaryExpense;
  const debtService = Math.round(Math.max(12, Number(state.debt || 48) * Number(state.interestRate || 10) * 0.34));
  const fiscalBalance = primaryResult - debtService;
  const inflationPressure = round2((Number(state.publicSpending || 35) - 35) * 0.035 + Math.max(0, econ.outputGap) * 0.12 + (100 - Number(state.energy || 50)) * 0.01 - ((monetary?.stance?.currencyDefense || 0.5) - 0.5) * 0.55);
  const jobsImpulse = round2(annualizedGrowth * 0.13 + (econ.realWage - 50) * 0.01 + (econ.privateInvestment - 50) * 0.012 - Math.max(0, Number(state.inflation || 6) - 9) * 0.035);
  return { fiscalRule, monetary, productionPower, investmentMix, annualizedGrowth, quarterlyGrowth, primaryRevenue, primaryExpense, primaryResult, debtService, fiscalBalance, inflationPressure, jobsImpulse, tradeImpulse, confidenceImpulse, structuralDrag };
}

export function processDeepEconomyMonth(state, legacyReport, log) {
  const snap = calculateDeepEconomySnapshot(state, legacyReport);
  const econ = ensureDeepEconomyState(state);
  const previousReal = econ.realGdp;
  const monthlyGrowthRate = snap.annualizedGrowth / 1200;
  econ.realGdp = Math.max(350, Math.round(econ.realGdp * (1 + monthlyGrowthRate)));
  econ.nominalGdp = Math.max(econ.realGdp, Math.round(econ.realGdp * (1 + Number(state.inflation || 6) / 100)));
  econ.quarterlyGrowth = snap.quarterlyGrowth;
  econ.annualizedGrowth = snap.annualizedGrowth;
  econ.primaryRevenue = snap.primaryRevenue;
  econ.primaryExpense = snap.primaryExpense;
  econ.primaryResult = snap.primaryResult;
  econ.debtService = snap.debtService;
  econ.outputGap = clamp(econ.outputGap + (snap.annualizedGrowth - (econ.potentialGrowth || 2.1)) * 0.09, -8, 8);
  econ.productivity = clamp(econ.productivity + (Number(state.technology || 50) - 50) * 0.018 + (Number(state.education || 50) - 50) * 0.004 + (snap.investmentMix - 50) * 0.012, 0, 100);
  econ.privateInvestment = clamp(econ.privateInvestment + (state.marketConfidence - 50) * 0.026 - Math.max(0, state.interestRate - 9) * 0.09 + snap.annualizedGrowth * 0.055, 0, 100);
  econ.publicInvestment = clamp(econ.publicInvestment + (Number(state.budget?.infrastructure || 30) + Number(state.budget?.industry || 28) + Number(state.budget?.technology || 24) - 82) * 0.018 - Math.max(0, state.debt - 95) * 0.016, 0, 100);
  econ.businessConfidence = clamp(econ.businessConfidence + (state.marketConfidence - econ.businessConfidence) * 0.18 + snap.annualizedGrowth * 0.16 - Math.max(0, state.debt - 80) * 0.014, 0, 100);
  econ.consumerConfidence = clamp(econ.consumerConfidence + (state.approval - econ.consumerConfidence) * 0.12 + snap.jobsImpulse * 0.4 - Math.max(0, state.inflation - 8) * 0.1, 0, 100);
  econ.realWage = clamp(econ.realWage + snap.jobsImpulse * 0.32 + (econ.productivity - 50) * 0.014 - Math.max(0, state.inflation - 7) * 0.045, 0, 100);
  econ.costOfLiving = clamp(econ.costOfLiving + Number(state.inflation || 6) * 0.026 + Math.max(0, econ.exchangeRate - 5.2) * 0.12 - (Number(state.budget?.social || 28) - 28) * 0.04 + (54 - econ.costOfLiving) * 0.055, 0, 100);
  econ.householdDebt = clamp(econ.householdDebt + Math.max(0, 10 - state.interestRate) * 0.035 + Math.max(0, econ.costOfLiving - 55) * 0.02 - snap.annualizedGrowth * 0.015, 0, 100);
  econ.creditAvailability = clamp(econ.creditAvailability + (econ.privateInvestment - 50) * 0.018 - Math.max(0, state.interestRate - 9) * 0.12 + (econ.businessConfidence - 50) * 0.016, 0, 100);
  econ.exports = Math.max(30, Math.round(econ.exports + (state.agribusiness - 50) * 0.7 + (state.industry - 50) * 0.45 + (state.tradeBalance - 50) * 0.55 + (econ.exchangeRate - 5) * 2.3));
  econ.imports = Math.max(30, Math.round(econ.imports + (state.economy - 50) * 0.72 + (state.technology - 50) * 0.35 - (econ.exchangeRate - 5) * 1.2));
  econ.exchangeRate = clamp(econ.exchangeRate + Math.max(0, state.inflation - 6) * 0.018 + Math.max(0, state.debt - 70) * 0.006 - (econ.reserves - 320) * 0.0009 - (state.tradeBalance - 50) * 0.002, 2.2, 9.5);
  econ.reserves = clamp(econ.reserves + (econ.exports - econ.imports) * 0.018 - Math.max(0, 5 - snap.fiscalBalance / 120) + (state.diplomacy - 50) * 0.015, 40, 650);
  econ.currentAccount = round2(clamp((econ.exports - econ.imports) / Math.max(1, econ.nominalGdp) * 100, -8, 8));
  econ.riskPremium = round2(clamp(2.2 + Math.max(0, state.debt - 55) * 0.035 + Math.max(0, state.inflation - 6) * 0.09 + Math.max(0, 50 - state.marketConfidence) * 0.025 - state.stability * 0.006, 0.8, 14));
  econ.informalEconomy = clamp(econ.informalEconomy + Math.max(0, state.taxBurden - 34) * 0.035 + Math.max(0, state.unemployment - 10) * 0.06 - (state.economy - 50) * 0.01, 5, 65);
  econ.povertyEconomic = clamp((state.population?.demographics?.poverty ?? econ.povertyEconomic) + Math.max(0, state.unemployment - 9) * 0.03 + Math.max(0, econ.costOfLiving - 58) * 0.018 - Math.max(0, econ.realWage - 48) * 0.035 + (28 - econ.povertyEconomic) * 0.045, 0, 100);
  econ.middleClassSecurity = clamp(econ.middleClassSecurity + (econ.realWage - 50) * 0.022 + (100 - econ.costOfLiving) * 0.009 + (state.unemployment < 9 ? 0.12 : -0.08), 0, 100);
  econ.inflationTrend = round2(snap.inflationPressure);
  econ.unemploymentTrend = round2(-snap.jobsImpulse);
  // Legacy bridge: keep old HUD and older systems in sync with deep model.
  state.gdp = Math.max(0, Math.round(econ.realGdp));
  state.tradeBalance = clamp(50 + (econ.exports - econ.imports) / 4.5 + econ.currentAccount * 1.2, 0, 100);
  state.marketConfidence = clamp(Number(state.marketConfidence || 50) + (econ.businessConfidence - 50) * 0.018 - Math.max(0, econ.riskPremium - 5) * 0.035, 0, 100);
  state.inflation = clamp(Number(state.inflation || 6) + snap.inflationPressure * 0.08 + (econ.exchangeRate - 5.15) * 0.025, 0, 45);
  state.unemployment = clamp(Number(state.unemployment || 9) - snap.jobsImpulse * 0.045 + Math.max(0, -snap.annualizedGrowth) * 0.025, 0, 35);
  state.inequality = clamp(Number(state.inequality || 52) + Math.max(0, econ.costOfLiving - 60) * 0.012 - Math.max(0, econ.realWage - 51) * 0.02 - Math.max(0, state.publicSpending - 35) * 0.009 + (52 - Number(state.inequality || 52)) * 0.018, 0, 100);
  state.approval = clamp(Number(state.approval || 0) + ((state.population?.nationalSatisfaction ?? 50) - 50) * 0.025 + (econ.middleClassSecurity - 45) * 0.015 + (Number(state.economy || 50) - 50) * 0.01 + Math.max(0, 25 - Number(state.approval || 0)) * 0.08 - Math.max(0, econ.costOfLiving - 62) * 0.02, 0, 100);
  state.debt = clamp(Number(state.debt || 48) + (snap.fiscalBalance < 0 ? Math.abs(snap.fiscalBalance) / 860 : -Math.min(0.22, snap.fiscalBalance / 960)), 0, 160);
  if (state.population?.demographics) {
    state.population.demographics.poverty = clamp(Number(state.population.demographics.poverty || econ.povertyEconomic) * 0.82 + econ.povertyEconomic * 0.18, 0, 100);
  }
  const record = {
    y: state.year, m: state.month === 1 ? 12 : state.month - 1,
    gdp: econ.realGdp, nominalGdp: econ.nominalGdp, growth: snap.annualizedGrowth,
    balance: snap.fiscalBalance, primary: snap.primaryResult, inflation: Number(state.inflation.toFixed(2)),
    unemployment: Number(state.unemployment.toFixed(2)), debt: Number(state.debt.toFixed(2)), exchangeRate: Number(econ.exchangeRate.toFixed(2)), reserves: Math.round(econ.reserves)
  };
  econ.monthlyHistory.push(record);
  econ.monthlyHistory = econ.monthlyHistory.slice(-MONTHLY_HISTORY_LIMIT);
  if (econ.monthlyHistory.length % 3 === 0) {
    econ.quarterHistory.push({ y: state.year, q: state.governance?.quarter || Math.floor((state.month - 1) / 3) + 1, growth: snap.quarterlyGrowth, productivity: Number(econ.productivity.toFixed(1)), fiscalBalance: snap.fiscalBalance, debt: Number(state.debt.toFixed(2)) });
    econ.quarterHistory = econ.quarterHistory.slice(-QUARTER_HISTORY_LIMIT);
  }
  econ.lastShock = classifyEconomicShock(state, snap, previousReal);
  normalizeDeepEconomy(econ, state);
  if (log && econ.lastShock?.severity === "critical") log(econ.lastShock.message, "warning");
  return { ...snap, deep: econ };
}

export function applyDeepEconomyActionEffects(state, effects = {}) {
  const econ = ensureDeepEconomyState(state);
  const legacy = {};
  for (const [key, value] of Object.entries(effects || {})) {
    if (Object.prototype.hasOwnProperty.call(econ, key)) econ[key] = Number(econ[key] || 0) + Number(value || 0);
    else legacy[key] = Number(value || 0);
  }
  normalizeDeepEconomy(econ, state);
  return legacy;
}

export function setFiscalRule(state, id) {
  const rule = FISCAL_RULES.find(item => item.id === id);
  if (!rule) return null;
  const econ = ensureDeepEconomyState(state);
  econ.fiscalRule = rule.id;
  return rule;
}

export function setMonetaryPolicy(state, id) {
  const policy = MONETARY_POLICIES.find(item => item.id === id);
  if (!policy) return null;
  const econ = ensureDeepEconomyState(state);
  econ.monetaryPolicy = policy.id;
  return policy;
}

export function economicHealthScore(state) {
  const econ = ensureDeepEconomyState(state);
  return Math.round(clamp(
    Number(state.economy || 50) * 0.16 + Number(state.marketConfidence || 50) * 0.12 + econ.productivity * 0.13 + econ.privateInvestment * 0.11 + econ.consumerConfidence * 0.10 + (100 - econ.costOfLiving) * 0.11 + (100 - Number(state.unemployment || 9) * 2.6) * 0.10 + (100 - Math.min(100, Number(state.debt || 48))) * 0.08 + Math.min(100, econ.reserves / 4.2) * 0.09,
    0, 100
  ));
}

export function formatEconomicTrend(value, positiveText = "up", negativeText = "down", stableText = "stable") {
  const n = Number(value || 0);
  if (n > 0.15) return positiveText;
  if (n < -0.15) return negativeText;
  return stableText;
}

function normalizeDeepEconomy(econ, state) {
  econ.realGdp = Math.max(350, Math.round(Number(econ.realGdp || state?.gdp || 2100)));
  econ.nominalGdp = Math.max(econ.realGdp, Math.round(Number(econ.nominalGdp || econ.realGdp)));
  for (const key of ["productivity","privateInvestment","publicInvestment","businessConfidence","consumerConfidence","realWage","costOfLiving","householdDebt","creditAvailability","informalEconomy","povertyEconomic","middleClassSecurity"]) econ[key] = clamp(Number(econ[key] ?? 50), 0, 100);
  econ.exchangeRate = clamp(Number(econ.exchangeRate || 5.15), 2.2, 9.5);
  econ.reserves = clamp(Number(econ.reserves || 338), 40, 650);
  econ.exports = Math.max(30, Math.round(Number(econ.exports || 315)));
  econ.imports = Math.max(30, Math.round(Number(econ.imports || 298)));
  econ.primaryRevenue = Math.max(0, Math.round(Number(econ.primaryRevenue || 0)));
  econ.primaryExpense = Math.max(0, Math.round(Number(econ.primaryExpense || 0)));
  econ.primaryResult = Math.round(Number(econ.primaryResult || 0));
  econ.debtService = Math.max(0, Math.round(Number(econ.debtService || 0)));
  econ.currentAccount = clamp(Number(econ.currentAccount || 0), -8, 8);
  econ.riskPremium = clamp(Number(econ.riskPremium || 3.9), 0.8, 14);
  econ.gdpPerCapita = Number((econ.realGdp / Math.max(1, Number(state?.population?.demographics?.populationMillions || 215.3))).toFixed(2));
  econ.potentialGrowth = clamp(Number(econ.potentialGrowth || 2.1), -2, 6);
  econ.outputGap = clamp(Number(econ.outputGap || 0), -8, 8);
  econ.quarterlyGrowth = clamp(Number(econ.quarterlyGrowth || 0), -3, 3);
  econ.annualizedGrowth = clamp(Number(econ.annualizedGrowth || 0), -8, 8);
  econ.inflationTrend = clamp(Number(econ.inflationTrend || 0), -4, 4);
  econ.unemploymentTrend = clamp(Number(econ.unemploymentTrend || 0), -4, 4);
  econ.monthlyHistory = Array.isArray(econ.monthlyHistory) ? econ.monthlyHistory.slice(-MONTHLY_HISTORY_LIMIT) : [];
  econ.quarterHistory = Array.isArray(econ.quarterHistory) ? econ.quarterHistory.slice(-QUARTER_HISTORY_LIMIT) : [];
  return econ;
}

function classifyEconomicShock(state, snap, previousReal) {
  if (snap.annualizedGrowth < -3.5) return { id:"recession", severity:"critical", message:"Alerta econômico: a economia entrou em recessão técnica e exige resposta fiscal/monetária." };
  if (Number(state.inflation || 0) > 12) return { id:"inflation", severity:"critical", message:"Alerta econômico: inflação elevada está corroendo renda, estabilidade e popularidade." };
  if (Number(state.debt || 0) > 110 && snap.fiscalBalance < -80) return { id:"debt", severity:"critical", message:"Alerta econômico: dívida e serviço de juros pressionam o risco fiscal do país." };
  if (previousReal && state.deepEconomy.realGdp > previousReal * 1.008) return { id:"expansion", severity:"positive", message:"Expansão econômica em curso." };
  return { id:"normal", severity:"info", message:"Economia dentro do intervalo administrável." };
}

function mergeDeep(base, overrides) {
  const result = structuredClone(base);
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return result;
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) result[key] = { ...result[key], ...structuredClone(value) };
    else result[key] = structuredClone(value);
  }
  return result;
}

function round2(value) { return Math.round(Number(value || 0) * 100) / 100; }

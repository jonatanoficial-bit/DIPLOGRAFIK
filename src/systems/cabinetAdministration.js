import { clamp } from "./calculations.js";
import { CABINET_PORTFOLIOS, CABINET_STYLES } from "../data/cabinetAdministrationData.js";

export const CABINET_ADMIN_SCHEMA = 1;
export const CABINET_HISTORY_LIMIT = 36;

function n(value, fallback = 50) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bounded(value, min = 0, max = 100) {
  return clamp(n(value), min, max);
}

export function createCabinetState() {
  return {
    schema: CABINET_ADMIN_SCHEMA,
    activeStyle: "coalition_balance",
    cabinetCohesion: 56,
    cabinetCompetence: 54,
    policyCoordination: 52,
    deliveryCapacity: 51,
    bureaucraticEfficiency: 50,
    administrativeLoad: 42,
    appointmentPressure: 38,
    budgetExecution: 50,
    federalAlignment: 49,
    scandalExposure: 24,
    cabinetRisk: 31,
    lastDiagnosis: { severity: "info", messageKey: "cabinet.diagnosis.normal" },
    portfolios: CABINET_PORTFOLIOS.map(item => ({
      id: item.id,
      performance: item.baseline,
      risk: item.risk,
      vacancies: 0,
      delivery: Math.max(35, item.baseline - 4),
      politicalCost: Math.max(12, Math.round(item.risk * 0.5))
    })),
    history: []
  };
}

export function ensureCabinetState(state) {
  const defaults = createCabinetState();
  const existing = state.cabinetAdministration && typeof state.cabinetAdministration === "object" ? state.cabinetAdministration : {};
  state.cabinetAdministration = existing;
  for (const [key, value] of Object.entries(defaults)) {
    if (existing[key] === undefined || existing[key] === null) existing[key] = structuredClone(value);
  }
  existing.schema = CABINET_ADMIN_SCHEMA;
  existing.activeStyle = CABINET_STYLES.some(item => item.id === existing.activeStyle) ? existing.activeStyle : "coalition_balance";
  existing.portfolios = Array.isArray(existing.portfolios) ? existing.portfolios : [];
  const byId = new Map(existing.portfolios.map(item => [item.id, item]));
  existing.portfolios = CABINET_PORTFOLIOS.map(profile => {
    const current = byId.get(profile.id) || {};
    return {
      id: profile.id,
      performance: bounded(current.performance ?? profile.baseline),
      risk: bounded(current.risk ?? profile.risk),
      vacancies: bounded(current.vacancies ?? 0, 0, 5),
      delivery: bounded(current.delivery ?? profile.baseline - 4),
      politicalCost: bounded(current.politicalCost ?? Math.round(profile.risk * 0.5), 0, 100)
    };
  });
  for (const key of ["cabinetCohesion","cabinetCompetence","policyCoordination","deliveryCapacity","bureaucraticEfficiency","administrativeLoad","appointmentPressure","budgetExecution","federalAlignment","scandalExposure","cabinetRisk"]) {
    const fallback = key === "scandalExposure" ? 24 : key === "cabinetRisk" ? 31 : key === "administrativeLoad" || key === "appointmentPressure" ? 40 : 52;
    existing[key] = bounded(existing[key], 0, 100) || fallback;
  }
  existing.history = Array.isArray(existing.history) ? existing.history.slice(-CABINET_HISTORY_LIMIT) : [];
  existing.lastDiagnosis = existing.lastDiagnosis && typeof existing.lastDiagnosis === "object" ? existing.lastDiagnosis : { severity:"info", messageKey:"cabinet.diagnosis.normal" };
  return existing;
}

export function calculateCabinetSnapshot(state) {
  const cabinet = ensureCabinetState(state);
  const performanceAvg = cabinet.portfolios.reduce((sum, item) => sum + n(item.performance), 0) / Math.max(1, cabinet.portfolios.length);
  const riskAvg = cabinet.portfolios.reduce((sum, item) => sum + n(item.risk), 0) / Math.max(1, cabinet.portfolios.length);
  const deliveryAvg = cabinet.portfolios.reduce((sum, item) => sum + n(item.delivery), 0) / Math.max(1, cabinet.portfolios.length);
  const administrationScore = bounded(
    cabinet.cabinetCompetence * 0.18 + cabinet.policyCoordination * 0.16 + cabinet.deliveryCapacity * 0.18 +
    cabinet.bureaucraticEfficiency * 0.14 + cabinet.budgetExecution * 0.12 + cabinet.federalAlignment * 0.08 +
    performanceAvg * 0.14 - cabinet.administrativeLoad * 0.08 - cabinet.scandalExposure * 0.07
  );
  const governability = bounded(n(state.coalition) * 0.25 + cabinet.cabinetCohesion * 0.25 + cabinet.policyCoordination * 0.18 + cabinet.federalAlignment * 0.14 + n(state.stability) * 0.18 - cabinet.appointmentPressure * 0.09);
  const executionRisk = bounded(riskAvg * 0.22 + cabinet.cabinetRisk * 0.24 + cabinet.scandalExposure * 0.18 + cabinet.administrativeLoad * 0.18 + Math.max(0, 50 - cabinet.cabinetCohesion) * 0.18);
  return { performanceAvg, riskAvg, deliveryAvg, administrationScore, governability, executionRisk };
}

export function cabinetHealthScore(state) {
  return Math.round(calculateCabinetSnapshot(state).administrationScore);
}

export function setCabinetStyle(state, id) {
  const cabinet = ensureCabinetState(state);
  const style = CABINET_STYLES.find(item => item.id === id) || CABINET_STYLES[0];
  cabinet.activeStyle = style.id;
  applyCabinetEffects(state, style.effects || {});
  return style;
}

export function applyCabinetEffects(state, effects = {}) {
  const cabinet = ensureCabinetState(state);
  const legacy = {};
  const map = {
    cabinetCohesion: "cabinetCohesion",
    cabinetCompetence: "cabinetCompetence",
    policyCoordination: "policyCoordination",
    deliveryCapacity: "deliveryCapacity",
    bureaucraticEfficiency: "bureaucraticEfficiency",
    administrativeLoad: "administrativeLoad",
    appointmentPressure: "appointmentPressure",
    budgetExecution: "budgetExecution",
    federalAlignment: "federalAlignment",
    scandalExposure: "scandalExposure",
    cabinetRisk: "cabinetRisk"
  };
  for (const [key, value] of Object.entries(effects || {})) {
    const amount = n(value, 0);
    if (map[key]) cabinet[map[key]] = bounded(cabinet[map[key]] + amount);
    else if (key === "regionalBalance") {
      state.budgetTax = state.budgetTax || {};
      state.budgetTax.regionalBalance = bounded(n(state.budgetTax.regionalBalance, 50) + amount);
    } else if (key === "treasury") {
      state.treasury = Math.max(0, Math.round(n(state.treasury, 0) + amount));
    } else {
      legacy[key] = (legacy[key] || 0) + amount;
    }
  }
  recalculatePortfolios(state);
  return legacy;
}

export function processCabinetMonth(state, economyReport = {}) {
  const cabinet = ensureCabinetState(state);
  const snapshot = calculateCabinetSnapshot(state);
  const inst = state.institutions || {};
  const budget = state.budgetTax || {};
  const economyStress = Math.max(0, 52 - n(state.economy, 50)) * 0.02 + Math.max(0, n(state.inflation, 0) - 8) * 0.05;
  cabinet.policyCoordination = bounded(cabinet.policyCoordination + (n(inst.bureaucraticCapacity, 50) - 50) * 0.015 + (n(state.coalition, 50) - 50) * 0.01 - economyStress);
  cabinet.budgetExecution = bounded(cabinet.budgetExecution + (n(budget.capitalExecution, 50) - 50) * 0.018 + (n(budget.spendingEfficiency, 50) - 50) * 0.014 - n(cabinet.administrativeLoad, 40) * 0.012);
  cabinet.deliveryCapacity = bounded(cabinet.deliveryCapacity + (cabinet.policyCoordination - 50) * 0.02 + (cabinet.bureaucraticEfficiency - 50) * 0.018 - n(cabinet.appointmentPressure, 40) * 0.01);
  cabinet.cabinetRisk = bounded(cabinet.cabinetRisk + economyStress * 1.6 + Math.max(0, n(cabinet.scandalExposure, 20) - 40) * 0.02 - (cabinet.cabinetCompetence - 50) * 0.015);
  cabinet.administrativeLoad = bounded(cabinet.administrativeLoad + Math.max(0, n(state.crisis, 0) - 2) * 0.4 + Math.max(0, n(state.congressPressure, 35) - 55) * 0.035 - (cabinet.bureaucraticEfficiency - 50) * 0.018);
  cabinet.cabinetCohesion = bounded(cabinet.cabinetCohesion + (n(state.coalition, 50) - 50) * 0.016 - n(cabinet.appointmentPressure, 35) * 0.012 - Math.max(0, n(state.opposition, 40) - 55) * 0.014);
  recalculatePortfolios(state);
  const next = calculateCabinetSnapshot(state);
  cabinet.lastDiagnosis = diagnoseCabinet(next, cabinet);
  cabinet.history.push({ y: state.year, m: state.month, score: Number(next.administrationScore.toFixed(2)), governability: Number(next.governability.toFixed(2)), risk: Number(next.executionRisk.toFixed(2)), delivery: Number(next.deliveryAvg.toFixed(2)) });
  cabinet.history = cabinet.history.slice(-CABINET_HISTORY_LIMIT);
  const gov = state.governance || {};
  if (gov) {
    gov.administrativeCapacity = bounded(n(gov.administrativeCapacity, 60) + (next.administrationScore - 50) * 0.025 - n(cabinet.administrativeLoad, 40) * 0.012, 0, 100);
    gov.institutionalResilience = bounded(n(gov.institutionalResilience, 60) + (next.governability - 50) * 0.015 - Math.max(0, next.executionRisk - 55) * 0.015, 0, 100);
  }
  state.stability = bounded(n(state.stability, 50) + (next.governability - 50) * 0.012 - Math.max(0, next.executionRisk - 60) * 0.02);
  state.approval = bounded(n(state.approval, 50) + (next.deliveryAvg - 50) * 0.01 - Math.max(0, cabinet.scandalExposure - 55) * 0.02);
  return next;
}

function recalculatePortfolios(state) {
  const cabinet = ensureCabinetState(state);
  cabinet.portfolios = cabinet.portfolios.map(item => {
    const profile = CABINET_PORTFOLIOS.find(p => p.id === item.id) || {};
    const priorityBonus = profile.priority === "fiscal" ? (n(state.marketConfidence, 50) - 50) * 0.03 : profile.priority === "social" ? (n(state.approval, 50) - 50) * 0.025 : profile.priority === "diplomacy" ? (n(state.diplomacy, 50) - 50) * 0.035 : 0;
    const performance = bounded(n(item.performance, profile.baseline || 52) + (cabinet.cabinetCompetence - 50) * 0.025 + (cabinet.policyCoordination - 50) * 0.016 + priorityBonus - cabinet.administrativeLoad * 0.006);
    const delivery = bounded(n(item.delivery, performance) + (cabinet.deliveryCapacity - 50) * 0.025 + (cabinet.budgetExecution - 50) * 0.014 - n(item.vacancies, 0) * 1.8);
    const risk = bounded(n(item.risk, profile.risk || 30) + (cabinet.scandalExposure - 30) * 0.025 + (cabinet.appointmentPressure - 40) * 0.018 - (cabinet.bureaucraticEfficiency - 50) * 0.014);
    return { ...item, performance, delivery, risk };
  });
}

function diagnoseCabinet(snapshot, cabinet) {
  if (snapshot.executionRisk > 72 || cabinet.scandalExposure > 68) return { severity:"negative", messageKey:"cabinet.diagnosis.crisis" };
  if (snapshot.administrationScore < 42) return { severity:"warning", messageKey:"cabinet.diagnosis.lowCapacity" };
  if (cabinet.administrativeLoad > 72) return { severity:"warning", messageKey:"cabinet.diagnosis.overload" };
  if (snapshot.administrationScore > 68 && snapshot.governability > 62) return { severity:"positive", messageKey:"cabinet.diagnosis.strong" };
  return { severity:"info", messageKey:"cabinet.diagnosis.normal" };
}

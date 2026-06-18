import { clamp } from "../core/dom.js";
import { INSTITUTION_PROFILES, INSTITUTIONAL_REFORMS, INSTITUTIONAL_PROTOCOLS } from "../data/governmentInstitutionData.js";

export const GOVERNMENT_INSTITUTIONS_SCHEMA = 1;
export const INSTITUTION_HISTORY_LIMIT = 36;

export function createInstitutionalState() {
  return {
    schema: GOVERNMENT_INSTITUTIONS_SCHEMA,
    activeReform: "balance_pact",
    ruleOfLaw: 58,
    checksAndBalances: 55,
    judicialIndependence: 61,
    bureaucraticCapacity: 52,
    regulatoryQuality: 47,
    federalCoordination: 49,
    transparency: 46,
    oversightPressure: 42,
    constitutionalTension: 34,
    coalitionDiscipline: 50,
    legislativeBacklog: 45,
    judicialBacklog: 58,
    appointmentBalance: 52,
    reformMomentum: 0,
    trust: 48,
    institutionalScore: 52,
    lastDiagnosis: null,
    institutions: INSTITUTION_PROFILES.map(item => ({ id:item.id, autonomy:item.autonomy, efficiency:item.efficiency, trust:item.trust, risk:item.risk })),
    history: []
  };
}

export function ensureInstitutionalState(state) {
  if (!state.institutions || typeof state.institutions !== "object") state.institutions = createInstitutionalState();
  const base = createInstitutionalState();
  const existing = state.institutions || {};
  const byId = new Map((Array.isArray(existing.institutions) ? existing.institutions : []).map(item => [item.id, item]));
  state.institutions = {
    ...base,
    ...existing,
    institutions: base.institutions.map(item => ({ ...item, ...(byId.get(item.id) || {}) })),
    history: Array.isArray(existing.history) ? existing.history.slice(-INSTITUTION_HISTORY_LIMIT) : []
  };
  normalizeInstitutionalState(state);
  return state.institutions;
}

export function normalizeInstitutionalState(state) {
  const inst = state.institutions;
  if (!inst || typeof inst !== "object") return;
  const pctKeys = ["ruleOfLaw","checksAndBalances","judicialIndependence","bureaucraticCapacity","regulatoryQuality","federalCoordination","transparency","oversightPressure","constitutionalTension","coalitionDiscipline","legislativeBacklog","judicialBacklog","appointmentBalance","trust","institutionalScore"];
  for (const key of pctKeys) inst[key] = clamp(Number.isFinite(Number(inst[key])) ? Number(inst[key]) : 50, 0, 100);
  inst.reformMomentum = clamp(Number.isFinite(Number(inst.reformMomentum)) ? Number(inst.reformMomentum) : 0, -25, 25);
  if (!INSTITUTIONAL_REFORMS.some(item => item.id === inst.activeReform)) inst.activeReform = "balance_pact";
  inst.institutions = Array.isArray(inst.institutions) ? inst.institutions.map(item => ({
    id: item.id,
    autonomy: clamp(Number(item.autonomy ?? 50), 0, 100),
    efficiency: clamp(Number(item.efficiency ?? 50), 0, 100),
    trust: clamp(Number(item.trust ?? 50), 0, 100),
    risk: clamp(Number(item.risk ?? 35), 0, 100)
  })) : createInstitutionalState().institutions;
  inst.history = Array.isArray(inst.history) ? inst.history.slice(-INSTITUTION_HISTORY_LIMIT) : [];
}

export function calculateInstitutionalSnapshot(state) {
  const inst = ensureInstitutionalState(state);
  const reform = INSTITUTIONAL_REFORMS.find(item => item.id === inst.activeReform) || INSTITUTIONAL_REFORMS[0];
  const avgEfficiency = averageInstitutionMetric(inst, "efficiency");
  const avgTrust = averageInstitutionMetric(inst, "trust");
  const avgRisk = averageInstitutionMetric(inst, "risk");
  const governability = clamp(
    Number(state.coalition || 50) * 0.28 +
    Number(state.politicalCapital || 50) * 0.18 +
    inst.coalitionDiscipline * 0.14 +
    inst.bureaucraticCapacity * 0.16 +
    inst.federalCoordination * 0.11 +
    avgEfficiency * 0.13 -
    inst.legislativeBacklog * 0.09 -
    inst.constitutionalTension * 0.11,
    0, 100
  );
  const legalSecurity = clamp(inst.ruleOfLaw * 0.28 + inst.judicialIndependence * 0.24 + inst.regulatoryQuality * 0.18 + inst.transparency * 0.12 + avgTrust * 0.12 - inst.judicialBacklog * 0.08 - inst.constitutionalTension * 0.1, 0, 100);
  const institutionalRisk = clamp(avgRisk * 0.25 + inst.constitutionalTension * 0.28 + inst.oversightPressure * 0.17 + inst.legislativeBacklog * 0.13 + Math.max(0, Number(state.corruption || 0) - 25) * 0.22 + Number(state.crisis || 0) * 3.1 - inst.checksAndBalances * 0.14, 0, 100);
  const reformCapacity = clamp(inst.reformMomentum + inst.bureaucraticCapacity * 0.24 + inst.coalitionDiscipline * 0.19 + Number(state.politicalCapital || 0) * 0.21 + Number(state.governance?.administrativeCapacity ?? 55) * 0.18 - inst.legislativeBacklog * 0.11 - inst.oversightPressure * 0.08, 0, 100);
  const institutionalScore = clamp(governability * 0.26 + legalSecurity * 0.24 + inst.checksAndBalances * 0.15 + inst.trust * 0.14 + avgEfficiency * 0.11 + inst.federalCoordination * 0.1 - institutionalRisk * 0.18, 0, 100);
  return { reform, avgEfficiency, avgTrust, avgRisk, governability, legalSecurity, institutionalRisk, reformCapacity, institutionalScore };
}

export function setInstitutionalReform(state, id) {
  const inst = ensureInstitutionalState(state);
  if (INSTITUTIONAL_REFORMS.some(item => item.id === id)) inst.activeReform = id;
  normalizeInstitutionalState(state);
  return INSTITUTIONAL_REFORMS.find(item => item.id === inst.activeReform) || INSTITUTIONAL_REFORMS[0];
}

export function applyInstitutionalEffects(state, effects = {}) {
  const inst = ensureInstitutionalState(state);
  const legacy = {};
  const localKeys = new Set(["ruleOfLaw","checksAndBalances","judicialIndependence","bureaucraticCapacity","regulatoryQuality","federalCoordination","transparency","oversightPressure","constitutionalTension","coalitionDiscipline","legislativeBacklog","judicialBacklog","appointmentBalance","reformMomentum","trust"]);
  const governanceKeys = new Set(["administrativeCapacity","fiscalCredibility","institutionalResilience","socialCohesion","policyFatigue","recoveryMomentum"]);
  const budgetTaxKeys = new Set(["regionalBalance","fiscalTransparency","budgetCredibility","spendingEfficiency","taxCompliance","evasionRate"]);
  const deepKeys = new Set(["businessConfidence","privateInvestment","publicInvestment","riskPremium","productivity"]);
  for (const [key, raw] of Object.entries(effects || {})) {
    const value = Number(raw || 0);
    if (localKeys.has(key)) inst[key] = Number(inst[key] || 0) + value;
    else if (governanceKeys.has(key) && state.governance) state.governance[key] = Number(state.governance[key] || 0) + value;
    else if (budgetTaxKeys.has(key) && state.budgetTax) state.budgetTax[key] = Number(state.budgetTax[key] || 0) + value;
    else if (deepKeys.has(key) && state.deepEconomy) state.deepEconomy[key] = Number(state.deepEconomy[key] || 0) + value;
    else legacy[key] = (legacy[key] || 0) + value;
  }
  normalizeInstitutionalState(state);
  return legacy;
}

export function processInstitutionalMonth(state, economyReport = {}) {
  const inst = ensureInstitutionalState(state);
  const snapshot = calculateInstitutionalSnapshot(state);
  const reform = snapshot.reform;
  const stance = reform.stance || {};
  inst.ruleOfLaw += (inst.judicialIndependence - 55) * 0.018 + (inst.transparency - 50) * 0.012 - Math.max(0, inst.constitutionalTension - 55) * 0.025;
  inst.checksAndBalances += ((stance.oversight ?? 0.55) - 0.5) * 0.28 + (inst.oversightPressure - 45) * 0.008 - Math.max(0, Number(state.corruption || 0) - 35) * 0.012;
  inst.judicialIndependence += ((stance.judicialRespect ?? 0.55) - 0.5) * 0.24 - Math.max(0, inst.constitutionalTension - 65) * 0.018;
  inst.bureaucraticCapacity += (Number(state.governance?.administrativeCapacity ?? 55) - 55) * 0.018 + (snapshot.reformCapacity - 50) * 0.011 - Math.max(0, inst.legislativeBacklog - 70) * 0.01;
  inst.regulatoryQuality += (state.deepEconomy?.businessConfidence ?? 50) * 0.006 - 0.28 + (inst.ruleOfLaw - 55) * 0.012;
  inst.federalCoordination += ((stance.federalCoordination ?? 0.55) - 0.5) * 0.33 + ((state.budgetTax?.regionalBalance ?? 45) - 45) * 0.012;
  inst.transparency += (Number(state.media || 50) - 50) * 0.006 - Math.max(0, Number(state.corruption || 0) - 28) * 0.018 + (inst.oversightPressure > 65 ? 0.05 : 0.02);
  inst.oversightPressure += Math.max(0, Number(state.corruption || 0) - 22) * 0.018 + Math.max(0, inst.transparency - 54) * 0.014 - ((stance.executiveCentralization ?? 0.5) - 0.5) * 0.12;
  inst.constitutionalTension += Math.max(0, Number(state.opposition || 0) - 45) * 0.018 + ((stance.executiveCentralization ?? 0.5) - 0.5) * 0.24 - ((stance.judicialRespect ?? 0.55) - 0.5) * 0.18;
  inst.coalitionDiscipline += (Number(state.coalition || 50) - 50) * 0.018 + (Number(state.politicalCapital || 50) - 50) * 0.012 - Math.max(0, inst.oversightPressure - 70) * 0.018;
  inst.legislativeBacklog += 0.42 + Math.max(0, 50 - snapshot.governability) * 0.03 - ((stance.executiveCentralization ?? 0.5) - 0.5) * 0.18;
  inst.judicialBacklog += 0.22 + Math.max(0, 55 - inst.bureaucraticCapacity) * 0.012 - (inst.regulatoryQuality - 50) * 0.006;
  inst.trust += (snapshot.legalSecurity - 52) * 0.012 + (snapshot.governability - 50) * 0.008 - Math.max(0, snapshot.institutionalRisk - 62) * 0.015;
  inst.reformMomentum += snapshot.reformCapacity > 58 ? 0.18 : -0.08;
  for (const item of inst.institutions) {
    item.efficiency += (inst.bureaucraticCapacity - 50) * 0.009 + (inst.regulatoryQuality - 48) * 0.006 - Math.max(0, item.risk - 60) * 0.012;
    item.trust += (inst.trust - 48) * 0.01 + (inst.transparency - 50) * 0.008 - Math.max(0, inst.constitutionalTension - 65) * 0.012;
    item.risk += Math.max(0, snapshot.institutionalRisk - 55) * 0.01 - (inst.checksAndBalances - 50) * 0.006 - (item.efficiency - 50) * 0.004;
  }
  for (const protocol of INSTITUTIONAL_PROTOCOLS) {
    const value = Number(inst[protocol.trigger] ?? 50);
    const triggered = protocol.invert ? value <= protocol.threshold : value >= protocol.threshold;
    if (triggered) applyInstitutionalEffects(state, protocol.effects);
  }
  const live = ensureInstitutionalState(state);
  const post = calculateInstitutionalSnapshot(state);
  live.institutionalScore = post.institutionalScore;
  state.stability += (post.institutionalScore - 52) * 0.012 - Math.max(0, post.institutionalRisk - 70) * 0.018;
  state.marketConfidence += (post.legalSecurity - 55) * 0.012 + (live.regulatoryQuality - 50) * 0.006;
  state.politicalCapital += (post.governability - 50) * 0.012 - Math.max(0, live.oversightPressure - 72) * 0.018;
  state.corruption += (35 - live.transparency) * 0.01 - (live.checksAndBalances - 50) * 0.007;
  if (state.governance) {
    state.governance.institutionalResilience += (post.institutionalScore - 52) * 0.02;
    state.governance.administrativeCapacity += (live.bureaucraticCapacity - 52) * 0.012;
  }
  live.lastDiagnosis = diagnosisFromSnapshot(post);
  live.history.push({ y: state.year, m: state.month, score:Number(post.institutionalScore.toFixed(1)), risk:Number(post.institutionalRisk.toFixed(1)), governability:Number(post.governability.toFixed(1)), legalSecurity:Number(post.legalSecurity.toFixed(1)), tension:Number(live.constitutionalTension.toFixed(1)) });
  live.history = live.history.slice(-INSTITUTION_HISTORY_LIMIT);
  state.institutions = live;
  normalizeInstitutionalState(state);
  return post;
}

export function institutionalHealthScore(state) {
  return Math.round(calculateInstitutionalSnapshot(state).institutionalScore);
}

function averageInstitutionMetric(inst, key) {
  const list = Array.isArray(inst.institutions) ? inst.institutions : [];
  if (!list.length) return 50;
  return list.reduce((sum, item) => sum + Number(item[key] ?? 50), 0) / list.length;
}

function diagnosisFromSnapshot(snapshot) {
  if (snapshot.institutionalRisk > 74) return { severity:"danger", messageKey:"institutions.diagnosis.crisis" };
  if (snapshot.governability < 38) return { severity:"warning", messageKey:"institutions.diagnosis.gridlock" };
  if (snapshot.legalSecurity < 42) return { severity:"warning", messageKey:"institutions.diagnosis.legal" };
  if (snapshot.institutionalScore > 68) return { severity:"positive", messageKey:"institutions.diagnosis.strong" };
  return { severity:"info", messageKey:"institutions.diagnosis.normal" };
}

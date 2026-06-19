import { applyEffects, normalizeState } from "./calculations.js";
import { DEFENSE_BRANCHES, INTELLIGENCE_DESKS, DEFENSE_DOCTRINES, DEFENSE_INCIDENTS } from "../data/defenseIntelligenceData.js";

const clampMetric = value => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 50));
const value = (state, key, fallback = 50) => Number.isFinite(Number(state?.[key])) ? Number(state[key]) : fallback;
const average = arr => arr.length ? arr.reduce((sum, item) => sum + Number(item || 0), 0) / arr.length : 0;

export function createDefenseIntelligenceState() {
  return {
    schema: 1,
    activeDoctrine: "deterrence_balance",
    defenseReadiness: 54,
    strategicAutonomy: 42,
    cyberResilience: 49,
    borderControl: 51,
    intelCoverage: 46,
    counterIntel: 44,
    deterrence: 48,
    threatLevel: 42,
    operationalRisk: 38,
    civilPreparedness: 47,
    branches: DEFENSE_BRANCHES.map(item => ({ ...item })),
    desks: INTELLIGENCE_DESKS.map(item => ({ ...item })),
    incidents: [],
    history: [],
    lastDiagnosis: { severity:"info", messageKey:"defense.diagnosis.stable" }
  };
}

export function ensureDefenseIntelligenceState(state) {
  if (!state.defenseIntelligence || typeof state.defenseIntelligence !== "object") state.defenseIntelligence = createDefenseIntelligenceState();
  const base = createDefenseIntelligenceState();
  const current = state.defenseIntelligence;
  for (const [key, fallback] of Object.entries(base)) {
    if (current[key] === undefined) current[key] = structuredClone(fallback);
  }
  current.branches = base.branches.map(profile => ({ ...profile, ...(current.branches || []).find(item => item.id === profile.id) }));
  current.desks = base.desks.map(profile => ({ ...profile, ...(current.desks || []).find(item => item.id === profile.id) }));
  current.incidents = Array.isArray(current.incidents) ? current.incidents.slice(0, 16) : [];
  current.history = Array.isArray(current.history) ? current.history.slice(-36) : [];
  normalizeDefenseIntelligenceState(state);
  return current;
}

function normalizeDefenseIntelligenceState(state) {
  const di = state.defenseIntelligence;
  ["defenseReadiness","strategicAutonomy","cyberResilience","borderControl","intelCoverage","counterIntel","deterrence","threatLevel","operationalRisk","civilPreparedness"].forEach(key => { di[key] = clampMetric(di[key]); });
  di.branches.forEach(branch => ["readiness","logistics","modernization","morale","autonomy","pressure"].forEach(key => { branch[key] = clampMetric(branch[key]); }));
  di.desks.forEach(desk => ["coverage","reliability","risk"].forEach(key => { desk[key] = clampMetric(desk[key]); }));
  di.history = di.history.slice(-36);
  di.incidents = di.incidents.slice(0, 16);
}

export function defenseHealthScore(state) {
  const di = ensureDefenseIntelligenceState(state);
  const branchScore = average(di.branches.map(branch => (branch.readiness + branch.logistics + branch.modernization + branch.morale + branch.autonomy - branch.pressure * 0.45) / 4.55));
  const deskScore = average(di.desks.map(desk => (desk.coverage + desk.reliability + (100 - desk.risk)) / 3));
  const score = branchScore * 0.34 + deskScore * 0.22 + di.deterrence * 0.12 + di.cyberResilience * 0.12 + di.borderControl * 0.1 + di.civilPreparedness * 0.1 - di.threatLevel * 0.12 - di.operationalRisk * 0.08;
  return Math.round(clampMetric(score));
}

export function calculateDefenseIntelligenceSnapshot(state) {
  const di = ensureDefenseIntelligenceState(state);
  const branchReadiness = average(di.branches.map(branch => branch.readiness));
  const modernization = average(di.branches.map(branch => branch.modernization));
  const logistics = average(di.branches.map(branch => branch.logistics));
  const intelligenceEdge = clampMetric((di.intelCoverage + di.counterIntel + average(di.desks.map(d => d.reliability)) + (100 - average(di.desks.map(d => d.risk)))) / 4);
  const externalPressure = clampMetric(value(state, "globalTension", 35) * 0.5 + (100 - (state.worldDiplomacy?.globalTrust || value(state, "diplomacy"))) * 0.28 + (state.worldDiplomacy?.securityRisk || 35) * 0.22);
  const internalPressure = clampMetric((100 - value(state, "stability")) * 0.32 + (100 - value(state, "security")) * 0.28 + value(state, "crisis", 0) * 5 + Math.max(0, 55 - value(state, "loyalty", 60)) * 0.5);
  const strategicRisk = clampMetric(di.threatLevel * 0.34 + di.operationalRisk * 0.22 + externalPressure * 0.23 + internalPressure * 0.21 - intelligenceEdge * 0.18 - di.deterrence * 0.12);
  const readinessGap = clampMetric(100 - ((branchReadiness + logistics + modernization + di.strategicAutonomy) / 4));
  const escalationRisk = clampMetric((externalPressure + value(state, "globalTension", 35) + di.deterrence * 0.16 - di.counterIntel * 0.12) / 2.1);
  return { branchReadiness, modernization, logistics, intelligenceEdge, externalPressure, internalPressure, strategicRisk, readinessGap, escalationRisk, health: defenseHealthScore(state) };
}

export function setDefenseDoctrine(state, id) {
  const di = ensureDefenseIntelligenceState(state);
  const doctrine = DEFENSE_DOCTRINES.find(item => item.id === id) || DEFENSE_DOCTRINES[0];
  di.activeDoctrine = doctrine.id;
  normalizeDefenseIntelligenceState(state);
  return doctrine;
}

export function applyDefenseIntelligenceEffects(state, effects = {}) {
  const di = ensureDefenseIntelligenceState(state);
  const legacy = {};
  for (const [key, raw] of Object.entries(effects || {})) {
    const delta = Number(raw || 0);
    if (["defenseReadiness","strategicAutonomy","cyberResilience","borderControl","intelCoverage","counterIntel","deterrence","threatLevel","operationalRisk","civilPreparedness"].includes(key)) {
      di[key] = clampMetric(di[key] + delta);
    } else if (["logistics","modernization"].includes(key)) {
      di.branches.forEach(branch => { branch[key] = clampMetric(branch[key] + delta); });
    } else if (key === "mediaNoise" && state.mediaPublic) {
      state.mediaPublic.noiseLevel = clampMetric((state.mediaPublic.noiseLevel || 45) + delta);
    } else if (key === "publicMood" && state.mediaPublic) {
      state.mediaPublic.publicMood = clampMetric((state.mediaPublic.publicMood || 50) + delta);
    } else if (key === "polarization" && state.mediaPublic) {
      state.mediaPublic.polarization = clampMetric((state.mediaPublic.polarization || 45) + delta);
    } else if (key === "softPower" && state.worldDiplomacy) {
      state.worldDiplomacy.softPower = clampMetric((state.worldDiplomacy.softPower || 50) + delta);
    } else if (key === "regionalLeadership" && state.worldDiplomacy) {
      state.worldDiplomacy.regionalLeadership = clampMetric((state.worldDiplomacy.regionalLeadership || 50) + delta);
    } else {
      legacy[key] = (legacy[key] || 0) + delta;
    }
  }
  normalizeDefenseIntelligenceState(state);
  return legacy;
}

export function processDefenseIntelligenceMonth(state, economyReport = {}) {
  const di = ensureDefenseIntelligenceState(state);
  const snapshot = calculateDefenseIntelligenceSnapshot(state);
  const doctrine = DEFENSE_DOCTRINES.find(item => item.id === di.activeDoctrine) || DEFENSE_DOCTRINES[0];
  const fiscalStress = Number(economyReport.monthlyBalance || state.lastMonthlyBalance || 0) < -90 ? 1.25 : 1;
  const institutionSignal = (((state.institutions?.institutionalTrust || value(state, "stability")) + value(state, "loyalty", 60)) / 2 - 50) * 0.018;
  const diplomacySignal = ((state.worldDiplomacy?.globalTrust || value(state, "diplomacy")) - 50) * 0.012 - Math.max(0, value(state, "globalTension", 35) - 40) * 0.018;
  const economySignal = ((value(state, "technology") + value(state, "industry") + value(state, "energy")) / 3 - 50) * 0.014;

  di.defenseReadiness = clampMetric(di.defenseReadiness + institutionSignal + economySignal - fiscalStress * 0.12 + (doctrine.id === "deterrence_balance" ? 0.25 : 0));
  di.strategicAutonomy = clampMetric(di.strategicAutonomy + economySignal + (value(state, "technology") - 45) * 0.008 - fiscalStress * 0.08);
  di.cyberResilience = clampMetric(di.cyberResilience + (value(state, "technology") - 45) * 0.016 + di.counterIntel * 0.004 - di.threatLevel * 0.006 + (doctrine.id === "cyber_sovereignty" ? 0.45 : 0));
  di.borderControl = clampMetric(di.borderControl + (value(state, "security") - 50) * 0.012 - Math.max(0, value(state, "globalTension", 35) - 42) * 0.01 + (doctrine.id === "integrated_security" ? 0.35 : 0));
  di.intelCoverage = clampMetric(di.intelCoverage + institutionSignal + (value(state, "intelligence") - 40) * 0.016 + (doctrine.id === "integrated_security" ? 0.18 : 0));
  di.counterIntel = clampMetric(di.counterIntel + di.intelCoverage * 0.006 - Math.max(0, (state.mediaPublic?.noiseLevel || 45) - 55) * 0.014);
  di.deterrence = clampMetric(di.deterrence + snapshot.branchReadiness * 0.006 + di.strategicAutonomy * 0.006 + diplomacySignal + (doctrine.id === "deterrence_balance" ? 0.3 : 0));
  di.threatLevel = clampMetric(di.threatLevel + snapshot.externalPressure * 0.012 + snapshot.internalPressure * 0.01 - di.counterIntel * 0.006 - di.borderControl * 0.004);
  di.operationalRisk = clampMetric(di.operationalRisk + snapshot.readinessGap * 0.012 + fiscalStress * 0.1 - snapshot.intelligenceEdge * 0.008);
  di.civilPreparedness = clampMetric(di.civilPreparedness + (value(state, "stability") - 50) * 0.01 + (value(state, "security") - 50) * 0.008 - value(state, "crisis", 0) * 0.05);

  di.branches.forEach(branch => {
    branch.readiness = clampMetric(branch.readiness + (di.defenseReadiness - 50) * 0.012 + (branch.logistics - 50) * 0.006 - fiscalStress * 0.08);
    branch.logistics = clampMetric(branch.logistics + (value(state, "infrastructure", 50) - 50) * 0.01 + (value(state, "industry") - 50) * 0.008 - fiscalStress * 0.06);
    branch.modernization = clampMetric(branch.modernization + (value(state, "technology") - 45) * 0.012 + (di.strategicAutonomy - 50) * 0.006);
    branch.morale = clampMetric(branch.morale + (value(state, "loyalty", 60) - 55) * 0.012 + (value(state, "stability") - 50) * 0.006 - branch.pressure * 0.003);
    branch.autonomy = clampMetric(branch.autonomy + (di.strategicAutonomy - 50) * 0.012 + branch.modernization * 0.004);
    branch.pressure = clampMetric(branch.pressure + di.threatLevel * 0.006 + Math.max(0, value(state, "globalTension", 35) - 40) * 0.01 - branch.readiness * 0.004);
  });

  di.desks.forEach(desk => {
    desk.coverage = clampMetric(desk.coverage + (di.intelCoverage - 50) * 0.014 + (value(state, "technology") - 45) * 0.006);
    desk.reliability = clampMetric(desk.reliability + (di.counterIntel - 50) * 0.012 + ((state.cabinetAdministration?.bureaucraticEfficiency ?? 50) - 50) * 0.004 - Math.max(0, desk.risk - 55) * 0.006);
    desk.risk = clampMetric(desk.risk + di.threatLevel * 0.006 - desk.coverage * 0.004 - desk.reliability * 0.004 + (desk.id === "cyber" ? Math.max(0, 55 - di.cyberResilience) * 0.01 : 0));
  });

  if ((state.governance?.totalDays || 0) % 60 === 0 || snapshot.strategicRisk > 70) {
    const incident = DEFENSE_INCIDENTS[Math.floor(Math.random() * DEFENSE_INCIDENTS.length)];
    const legacyEffects = applyDefenseIntelligenceEffects(state, incident.effects || {});
    applyEffects(state, legacyEffects);
    di.incidents.unshift({ id: incident.id, titleKey: incident.titleKey, textKey: incident.textKey, severity: incident.severity, day: state.day, month: state.month, year: state.year });
  }

  diagnoseDefenseIntelligence(state);
  const fresh = calculateDefenseIntelligenceSnapshot(state);
  di.history.push({ y: state.year, m: state.month === 1 ? 12 : state.month - 1, health: defenseHealthScore(state), risk: Number(fresh.strategicRisk.toFixed(1)), readiness: Number(fresh.branchReadiness.toFixed(1)), intelligence: Number(fresh.intelligenceEdge.toFixed(1)), doctrine: di.activeDoctrine });
  normalizeDefenseIntelligenceState(state);
  normalizeState(state);
  return { health: defenseHealthScore(state), risk: fresh.strategicRisk, readiness: fresh.branchReadiness, intelligenceEdge: fresh.intelligenceEdge, escalationRisk: fresh.escalationRisk, doctrine: doctrine.id };
}

function diagnoseDefenseIntelligence(state) {
  const di = ensureDefenseIntelligenceState(state);
  const snapshot = calculateDefenseIntelligenceSnapshot(state);
  if (snapshot.strategicRisk > 74) di.lastDiagnosis = { severity:"negative", messageKey:"defense.diagnosis.risk" };
  else if (di.cyberResilience < 34) di.lastDiagnosis = { severity:"warning", messageKey:"defense.diagnosis.cyber" };
  else if (snapshot.readinessGap > 60) di.lastDiagnosis = { severity:"warning", messageKey:"defense.diagnosis.readiness" };
  else if (defenseHealthScore(state) > 70) di.lastDiagnosis = { severity:"positive", messageKey:"defense.diagnosis.strong" };
  else di.lastDiagnosis = { severity:"info", messageKey:"defense.diagnosis.stable" };
}

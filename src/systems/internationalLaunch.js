import { clamp } from "../core/dom.js";
import { INTERNATIONAL_MARKETS, INTERNATIONAL_GATES } from "../data/internationalLaunchData.js";
import { calculateGoldMasterSnapshot, goldMasterHealthScore } from "./goldMaster.js";
import { alphaBetaHealthScore } from "./alphaBeta.js";
import { scenarioTutorialHealthScore } from "./scenarioTutorial.js";
import { mediaHealthScore } from "./media.js";
import { worldDiplomacyHealthScore } from "./worldDiplomacy.js";

export function createInternationalLaunchState() {
  return {
    schema: 1,
    activeMarket: "latin_america",
    localizationDepth: 78,
    complianceCoverage: 72,
    supportCoverage: 58,
    storePresence: 60,
    culturalFit: 66,
    privacyReadiness: 76,
    monetizationReadiness: 64,
    globalOps: 54,
    marketReach: 42,
    communityMomentum: 38,
    marketRisk: 32,
    lastGate: { severity:"info", messageKey:"intl.gate.progress" },
    history: []
  };
}

export function ensureInternationalLaunchState(state) {
  if (!state.internationalLaunch || typeof state.internationalLaunch !== "object") state.internationalLaunch = createInternationalLaunchState();
  const base = createInternationalLaunchState();
  const intl = state.internationalLaunch;
  for (const [key, value] of Object.entries(base)) if (intl[key] === undefined || intl[key] === null) intl[key] = structuredClone(value);
  intl.schema = 1;
  const bounded = ["localizationDepth","complianceCoverage","supportCoverage","storePresence","culturalFit","privacyReadiness","monetizationReadiness","globalOps","marketReach","communityMomentum","marketRisk"];
  for (const key of bounded) intl[key] = clamp(Number.isFinite(Number(intl[key])) ? Number(intl[key]) : base[key], 0, 100);
  intl.activeMarket = INTERNATIONAL_MARKETS.some(market => market.id === intl.activeMarket) ? intl.activeMarket : base.activeMarket;
  intl.history = Array.isArray(intl.history) ? intl.history.slice(-40) : [];
  intl.lastGate = intl.lastGate && typeof intl.lastGate === "object" ? intl.lastGate : base.lastGate;
  return intl;
}

export function calculateInternationalLaunchSnapshot(state) {
  const intl = ensureInternationalLaunchState(state);
  const gold = calculateGoldMasterSnapshot(state);
  const systemicHealth = clamp((goldMasterHealthScore(state) + alphaBetaHealthScore(state) + scenarioTutorialHealthScore(state) + mediaHealthScore(state) + worldDiplomacyHealthScore(state)) / 5, 0, 100);
  const marketFit = clamp(intl.localizationDepth*0.24 + intl.culturalFit*0.20 + intl.storePresence*0.16 + intl.marketReach*0.16 + intl.communityMomentum*0.12 + gold.goldScore*0.12, 0, 100);
  const operationalReadiness = clamp(intl.complianceCoverage*0.23 + intl.privacyReadiness*0.18 + intl.supportCoverage*0.18 + intl.globalOps*0.18 + intl.monetizationReadiness*0.12 + gold.publishing*0.11, 0, 100);
  const internationalRisk = clamp(intl.marketRisk*0.38 + Math.max(0, 82-operationalReadiness)*0.25 + Math.max(0, 78-marketFit)*0.22 + Math.max(0, 70-systemicHealth)*0.15, 0, 100);
  const globalScore = clamp(marketFit*0.36 + operationalReadiness*0.34 + systemicHealth*0.18 + (100-internationalRisk)*0.12, 0, 100);
  const gatesPassed = INTERNATIONAL_GATES.filter(gate => readInternationalMetric(state, gate.metric) >= gate.target).length;
  return { systemicHealth, marketFit, operationalReadiness, internationalRisk, globalScore, gatesPassed, totalGates:INTERNATIONAL_GATES.length };
}

export function internationalLaunchHealthScore(state) {
  return Math.round(calculateInternationalLaunchSnapshot(state).globalScore);
}

export function setInternationalMarket(state, id) {
  const intl = ensureInternationalLaunchState(state);
  const market = INTERNATIONAL_MARKETS.find(item => item.id === id) || INTERNATIONAL_MARKETS[0];
  intl.activeMarket = market.id;
  applyInternationalLaunchEffects(state, market.effects || {});
  return market;
}

export function applyInternationalLaunchEffects(state, effects = {}) {
  const intl = ensureInternationalLaunchState(state);
  const direct = ["localizationDepth","complianceCoverage","supportCoverage","storePresence","culturalFit","privacyReadiness","monetizationReadiness","globalOps","marketReach","communityMomentum","marketRisk"];
  const legacy = {};
  for (const [key, value] of Object.entries(effects || {})) {
    if (direct.includes(key)) intl[key] = clamp(Number(intl[key] || 0) + Number(value || 0), 0, 100);
    else legacy[key] = value;
  }
  intl.lastGate = diagnose(calculateInternationalLaunchSnapshot(state));
  return legacy;
}

export function processInternationalLaunchMonth(state, report = {}) {
  const intl = ensureInternationalLaunchState(state);
  const gold = calculateGoldMasterSnapshot(state);
  intl.localizationDepth = clamp(intl.localizationDepth + (gold.certification-76)*0.010 + 0.20, 0, 100);
  intl.complianceCoverage = clamp(intl.complianceCoverage + (gold.publishing-70)*0.012 + 0.20, 0, 100);
  intl.supportCoverage = clamp(intl.supportCoverage + (gold.sustainability-68)*0.012 + 0.28, 0, 100);
  intl.storePresence = clamp(intl.storePresence + (gold.publishing-70)*0.014 + 0.25, 0, 100);
  intl.culturalFit = clamp(intl.culturalFit + (intl.localizationDepth-70)*0.008 + 0.16, 0, 100);
  intl.privacyReadiness = clamp(intl.privacyReadiness + (intl.complianceCoverage-70)*0.009 + 0.16, 0, 100);
  intl.monetizationReadiness = clamp(intl.monetizationReadiness + (intl.storePresence-60)*0.010 + 0.18, 0, 100);
  intl.globalOps = clamp(intl.globalOps + (intl.supportCoverage-58)*0.010 + 0.22, 0, 100);
  intl.marketReach = clamp(intl.marketReach + (intl.communityMomentum-38)*0.010 + (intl.storePresence-58)*0.006 + 0.20, 0, 100);
  intl.communityMomentum = clamp(intl.communityMomentum + (mediaHealthScore(state)-55)*0.007 + (intl.culturalFit-60)*0.006 + 0.18, 0, 100);
  intl.marketRisk = clamp(intl.marketRisk + Math.max(0, 65-gold.goldScore)*0.010 + (Number(report.monthlyBalance||0) < -80 ? 0.35 : 0) - (intl.globalOps-55)*0.006 - (intl.complianceCoverage-70)*0.006, 0, 100);
  const snapshot = calculateInternationalLaunchSnapshot(state);
  intl.lastGate = diagnose(snapshot);
  intl.history.push({ m:state.month, y:state.year, score:snapshot.globalScore, gates:snapshot.gatesPassed, risk:snapshot.internationalRisk, fit:snapshot.marketFit, ops:snapshot.operationalReadiness });
  intl.history = intl.history.slice(-40);
  return { score:snapshot.globalScore, gates:snapshot.gatesPassed, risk:snapshot.internationalRisk, fit:snapshot.marketFit, ops:snapshot.operationalReadiness };
}

export function readInternationalMetric(state, metric) {
  const intl = ensureInternationalLaunchState(state);
  if (metric === "systemicHealth") return calculateInternationalLaunchSnapshot(state).systemicHealth;
  if (metric === "globalScore") return calculateInternationalLaunchSnapshot(state).globalScore;
  return Number(intl[metric] ?? 0);
}

function diagnose(snapshot) {
  if (snapshot.internationalRisk > 58) return { severity:"danger", messageKey:"intl.gate.blocked" };
  if (snapshot.globalScore >= 88 && snapshot.gatesPassed >= 7) return { severity:"positive", messageKey:"intl.gate.global" };
  if (snapshot.operationalReadiness < 76) return { severity:"warning", messageKey:"intl.gate.operations" };
  if (snapshot.marketFit < 74) return { severity:"warning", messageKey:"intl.gate.marketFit" };
  return { severity:"info", messageKey:"intl.gate.progress" };
}

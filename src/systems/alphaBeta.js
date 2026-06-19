import { clamp } from "../core/dom.js";
import { BETA_CHANNELS, BETA_MILESTONES } from "../data/alphaBetaData.js";
import { scenarioTutorialHealthScore } from "./scenarioTutorial.js";
import { electoralHealthScore } from "./electoralCareer.js";
import { nationalCrisisHealthScore } from "./nationalCrisis.js";
import { defenseHealthScore } from "./defenseIntelligence.js";
import { worldDiplomacyHealthScore } from "./worldDiplomacy.js";
import { mediaHealthScore } from "./media.js";
import { budgetTaxHealthScore } from "./budgetTax.js";
import { economicHealthScore } from "./economyDeep.js";

export function createAlphaBetaState() {
  return {
    schema: 1,
    activeChannel: "internal_alpha",
    qaCoverage: 64,
    crashFreeSessions: 94,
    mobileStability: 84,
    performanceScore: 78,
    buildConfidence: 72,
    gameplayBalance: 63,
    localizationReadiness: 90,
    telemetryQuality: 46,
    betaFeedback: 28,
    releaseReadiness: 58,
    publicRisk: 24,
    lastGate: { severity:"info", messageKey:"alphaBeta.gate.progress" },
    history: []
  };
}

export function ensureAlphaBetaState(state) {
  if (!state.alphaBeta || typeof state.alphaBeta !== "object") state.alphaBeta = createAlphaBetaState();
  const base = createAlphaBetaState();
  const ab = state.alphaBeta;
  for (const [key, value] of Object.entries(base)) if (ab[key] === undefined || ab[key] === null) ab[key] = structuredClone(value);
  ab.schema = 1;
  for (const key of ["qaCoverage","crashFreeSessions","mobileStability","performanceScore","buildConfidence","gameplayBalance","localizationReadiness","telemetryQuality","betaFeedback","releaseReadiness","publicRisk"]) {
    ab[key] = clamp(Number.isFinite(Number(ab[key])) ? Number(ab[key]) : base[key], 0, 100);
  }
  ab.activeChannel = BETA_CHANNELS.some(channel => channel.id === ab.activeChannel) ? ab.activeChannel : base.activeChannel;
  ab.history = Array.isArray(ab.history) ? ab.history.slice(-36) : [];
  ab.lastGate = ab.lastGate && typeof ab.lastGate === "object" ? ab.lastGate : base.lastGate;
  return ab;
}

export function calculateAlphaBetaSnapshot(state) {
  const ab = ensureAlphaBetaState(state);
  const systemicHealth = clamp((economicHealthScore(state)+budgetTaxHealthScore(state)+mediaHealthScore(state)+worldDiplomacyHealthScore(state)+defenseHealthScore(state)+nationalCrisisHealthScore(state)+electoralHealthScore(state)+scenarioTutorialHealthScore(state))/8, 0, 100);
  const technicalReadiness = clamp(ab.crashFreeSessions*0.28 + ab.mobileStability*0.23 + ab.performanceScore*0.20 + ab.qaCoverage*0.18 + ab.buildConfidence*0.11, 0, 100);
  const gameplayReadiness = clamp(ab.gameplayBalance*0.34 + systemicHealth*0.30 + scenarioTutorialHealthScore(state)*0.18 + electoralHealthScore(state)*0.10 + (100-Math.max(0, Number(state.crisis||0)*10))*0.08, 0, 100);
  const commercialReadiness = clamp(ab.releaseReadiness*0.34 + ab.localizationReadiness*0.20 + ab.betaFeedback*0.17 + ab.telemetryQuality*0.16 + (state.premiumCurrency >= 0 ? 70 : 50)*0.13, 0, 100);
  const publicationRisk = clamp(ab.publicRisk*0.32 + (100-ab.crashFreeSessions)*0.20 + Math.max(0, 70-ab.mobileStability)*0.18 + Math.max(0, 68-ab.gameplayBalance)*0.18 + Math.max(0, 60-state.stability)*0.12, 0, 100);
  const goldReadiness = clamp(technicalReadiness*0.34 + gameplayReadiness*0.32 + commercialReadiness*0.24 + (100-publicationRisk)*0.10, 0, 100);
  const gatesPassed = BETA_MILESTONES.filter(m => readAlphaBetaMetric(state, m.metric) >= m.target).length;
  return { systemicHealth, technicalReadiness, gameplayReadiness, commercialReadiness, publicationRisk, goldReadiness, gatesPassed, totalGates:BETA_MILESTONES.length };
}

export function alphaBetaHealthScore(state) {
  return Math.round(calculateAlphaBetaSnapshot(state).goldReadiness);
}

export function setBetaChannel(state, id) {
  const ab = ensureAlphaBetaState(state);
  const channel = BETA_CHANNELS.find(item => item.id === id) || BETA_CHANNELS[0];
  ab.activeChannel = channel.id;
  applyAlphaBetaEffects(state, channel.effects || {});
  return channel;
}

export function applyAlphaBetaEffects(state, effects = {}) {
  const ab = ensureAlphaBetaState(state);
  const direct = ["qaCoverage","crashFreeSessions","mobileStability","performanceScore","buildConfidence","gameplayBalance","localizationReadiness","telemetryQuality","betaFeedback","releaseReadiness","publicRisk"];
  const legacy = {};
  for (const [key, value] of Object.entries(effects || {})) {
    if (direct.includes(key)) {
      ab[key] = clamp(Number(ab[key] || 0) + Number(value || 0), 0, 100);
    } else {
      legacy[key] = value;
    }
  }
  const snapshot = calculateAlphaBetaSnapshot(state);
  ab.lastGate = diagnose(snapshot);
  return legacy;
}

export function processAlphaBetaMonth(state, report = {}) {
  const ab = ensureAlphaBetaState(state);
  ab.qaCoverage = clamp(ab.qaCoverage + 0.6 + (ab.telemetryQuality - 45)*0.01, 0, 100);
  ab.crashFreeSessions = clamp(ab.crashFreeSessions + (ab.qaCoverage - 60)*0.015 + Math.max(0, 65 - (state.crisis||0)*10)*0.003 - Math.max(0, Number(report.monthlyBalance||0) < -40 ? 0.6 : 0), 0, 100);
  ab.mobileStability = clamp(ab.mobileStability + (ab.performanceScore - 60)*0.01 + (ab.qaCoverage - 65)*0.008, 0, 100);
  ab.performanceScore = clamp(ab.performanceScore + 0.25 + (state.governance?.administrativeCapacity || 55)*0.004 - Math.max(0, (state.projects||[]).length-2)*0.15, 0, 100);
  ab.gameplayBalance = clamp(ab.gameplayBalance + (economicHealthScore(state)-55)*0.01 + (nationalCrisisHealthScore(state)-55)*0.008 + 0.20, 0, 100);
  ab.telemetryQuality = clamp(ab.telemetryQuality + 0.55 + (ab.betaFeedback-30)*0.012, 0, 100);
  ab.betaFeedback = clamp(ab.betaFeedback + (ab.activeChannel === "closed_beta" ? 1.1 : ab.activeChannel === "release_candidate" ? 0.8 : 0.35), 0, 100);
  ab.releaseReadiness = clamp(ab.releaseReadiness + (alphaBetaHealthScore(state)-60)*0.015 + (ab.qaCoverage-65)*0.012, 0, 100);
  ab.publicRisk = clamp(ab.publicRisk + Math.max(0, 65-alphaBetaHealthScore(state))*0.012 - (ab.telemetryQuality-50)*0.01, 0, 100);
  const snapshot = calculateAlphaBetaSnapshot(state);
  ab.lastGate = diagnose(snapshot);
  ab.history.push({ m:state.month, y:state.year, health:alphaBetaHealthScore(state), technical:snapshot.technicalReadiness, gameplay:snapshot.gameplayReadiness, commercial:snapshot.commercialReadiness, risk:snapshot.publicationRisk, gates:snapshot.gatesPassed });
  ab.history = ab.history.slice(-36);
  return { health:alphaBetaHealthScore(state), technical:snapshot.technicalReadiness, gameplay:snapshot.gameplayReadiness, commercial:snapshot.commercialReadiness, risk:snapshot.publicationRisk, gates:snapshot.gatesPassed };
}

export function readAlphaBetaMetric(state, metric) {
  const ab = ensureAlphaBetaState(state);
  if (metric === "systemicHealth") return calculateAlphaBetaSnapshot(state).systemicHealth;
  return Number(ab[metric] ?? 0);
}

function diagnose(snapshot) {
  if (snapshot.publicationRisk > 58) return { severity:"danger", messageKey:"alphaBeta.gate.blocked" };
  if (snapshot.goldReadiness >= 80 && snapshot.gatesPassed >= 6) return { severity:"positive", messageKey:"alphaBeta.gate.rc" };
  if (snapshot.technicalReadiness < 70) return { severity:"warning", messageKey:"alphaBeta.gate.technical" };
  if (snapshot.gameplayReadiness < 68) return { severity:"warning", messageKey:"alphaBeta.gate.balance" };
  return { severity:"info", messageKey:"alphaBeta.gate.progress" };
}

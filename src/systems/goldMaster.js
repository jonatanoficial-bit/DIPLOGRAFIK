import { clamp } from "../core/dom.js";
import { GOLD_RELEASE_TRACKS, GOLD_CERTIFICATION_GATES } from "../data/goldMasterData.js";
import { alphaBetaHealthScore, calculateAlphaBetaSnapshot } from "./alphaBeta.js";
import { scenarioTutorialHealthScore } from "./scenarioTutorial.js";
import { electoralHealthScore } from "./electoralCareer.js";
import { nationalCrisisHealthScore } from "./nationalCrisis.js";
import { defenseHealthScore } from "./defenseIntelligence.js";
import { worldDiplomacyHealthScore } from "./worldDiplomacy.js";
import { mediaHealthScore } from "./media.js";
import { economicHealthScore } from "./economyDeep.js";

export function createGoldMasterState() {
  return {
    schema: 1,
    activeTrack: "gold_candidate",
    technicalCertification: 72,
    mobileCertification: 78,
    localizationCertification: 90,
    balanceCertification: 68,
    storeReadiness: 48,
    legalCompliance: 66,
    launchOps: 42,
    supportReadiness: 44,
    rollbackReadiness: 58,
    telemetryBaseline: 50,
    rolloutReadiness: 56,
    monetizationSafety: 76,
    goldStampReadiness: 52,
    launchRisk: 34,
    lastGate: { severity:"info", messageKey:"gold.gate.progress" },
    history: []
  };
}

export function ensureGoldMasterState(state) {
  if (!state.goldMaster || typeof state.goldMaster !== "object") state.goldMaster = createGoldMasterState();
  const base = createGoldMasterState();
  const gold = state.goldMaster;
  for (const [key, value] of Object.entries(base)) if (gold[key] === undefined || gold[key] === null) gold[key] = structuredClone(value);
  gold.schema = 1;
  const bounded = ["technicalCertification","mobileCertification","localizationCertification","balanceCertification","storeReadiness","legalCompliance","launchOps","supportReadiness","rollbackReadiness","telemetryBaseline","rolloutReadiness","monetizationSafety","goldStampReadiness","launchRisk"];
  for (const key of bounded) gold[key] = clamp(Number.isFinite(Number(gold[key])) ? Number(gold[key]) : base[key], 0, 100);
  gold.activeTrack = GOLD_RELEASE_TRACKS.some(track => track.id === gold.activeTrack) ? gold.activeTrack : base.activeTrack;
  gold.history = Array.isArray(gold.history) ? gold.history.slice(-36) : [];
  gold.lastGate = gold.lastGate && typeof gold.lastGate === "object" ? gold.lastGate : base.lastGate;
  return gold;
}

export function calculateGoldMasterSnapshot(state) {
  const gold = ensureGoldMasterState(state);
  const alpha = calculateAlphaBetaSnapshot(state);
  const systemicHealth = clamp((economicHealthScore(state)+mediaHealthScore(state)+worldDiplomacyHealthScore(state)+defenseHealthScore(state)+nationalCrisisHealthScore(state)+electoralHealthScore(state)+scenarioTutorialHealthScore(state)+alphaBetaHealthScore(state))/8, 0, 100);
  const certification = clamp(gold.technicalCertification*0.25 + gold.mobileCertification*0.18 + gold.localizationCertification*0.14 + gold.balanceCertification*0.14 + gold.rollbackReadiness*0.12 + alpha.technicalReadiness*0.17, 0, 100);
  const publishing = clamp(gold.storeReadiness*0.25 + gold.legalCompliance*0.22 + gold.rolloutReadiness*0.18 + gold.launchOps*0.16 + gold.supportReadiness*0.11 + gold.telemetryBaseline*0.08, 0, 100);
  const sustainability = clamp(systemicHealth*0.32 + alpha.goldReadiness*0.24 + gold.monetizationSafety*0.16 + gold.supportReadiness*0.12 + gold.rollbackReadiness*0.10 + (100-gold.launchRisk)*0.06, 0, 100);
  const launchRisk = clamp(gold.launchRisk*0.36 + Math.max(0, 76-certification)*0.26 + Math.max(0, 72-publishing)*0.22 + Math.max(0, 65-systemicHealth)*0.16, 0, 100);
  const goldScore = clamp(certification*0.34 + publishing*0.28 + sustainability*0.25 + gold.goldStampReadiness*0.08 + (100-launchRisk)*0.05, 0, 100);
  const gatesPassed = GOLD_CERTIFICATION_GATES.filter(gate => readGoldMetric(state, gate.metric) >= gate.target).length;
  return { systemicHealth, certification, publishing, sustainability, launchRisk, goldScore, gatesPassed, totalGates:GOLD_CERTIFICATION_GATES.length };
}

export function goldMasterHealthScore(state) {
  return Math.round(calculateGoldMasterSnapshot(state).goldScore);
}

export function setGoldTrack(state, id) {
  const gold = ensureGoldMasterState(state);
  const track = GOLD_RELEASE_TRACKS.find(item => item.id === id) || GOLD_RELEASE_TRACKS[0];
  gold.activeTrack = track.id;
  applyGoldMasterEffects(state, track.effects || {});
  return track;
}

export function applyGoldMasterEffects(state, effects = {}) {
  const gold = ensureGoldMasterState(state);
  const direct = ["technicalCertification","mobileCertification","localizationCertification","balanceCertification","storeReadiness","legalCompliance","launchOps","supportReadiness","rollbackReadiness","telemetryBaseline","rolloutReadiness","monetizationSafety","goldStampReadiness","launchRisk"];
  const legacy = {};
  for (const [key, value] of Object.entries(effects || {})) {
    if (direct.includes(key)) gold[key] = clamp(Number(gold[key] || 0) + Number(value || 0), 0, 100);
    else legacy[key] = value;
  }
  gold.lastGate = diagnose(calculateGoldMasterSnapshot(state));
  return legacy;
}

export function processGoldMasterMonth(state, report = {}) {
  const gold = ensureGoldMasterState(state);
  const alpha = calculateAlphaBetaSnapshot(state);
  gold.technicalCertification = clamp(gold.technicalCertification + (alpha.technicalReadiness-70)*0.012 + 0.25, 0, 100);
  gold.mobileCertification = clamp(gold.mobileCertification + (alpha.technicalReadiness-72)*0.010 + 0.18, 0, 100);
  gold.balanceCertification = clamp(gold.balanceCertification + (alpha.gameplayReadiness-68)*0.013 + 0.20, 0, 100);
  gold.storeReadiness = clamp(gold.storeReadiness + (alpha.commercialReadiness-62)*0.014 + 0.35, 0, 100);
  gold.legalCompliance = clamp(gold.legalCompliance + 0.18 + (gold.telemetryBaseline-50)*0.006, 0, 100);
  gold.launchOps = clamp(gold.launchOps + 0.30 + (gold.supportReadiness-45)*0.008, 0, 100);
  gold.supportReadiness = clamp(gold.supportReadiness + 0.28 + (gold.rollbackReadiness-50)*0.006, 0, 100);
  gold.rollbackReadiness = clamp(gold.rollbackReadiness + 0.22 + (gold.technicalCertification-70)*0.008, 0, 100);
  gold.telemetryBaseline = clamp(gold.telemetryBaseline + 0.25 + (gold.legalCompliance-65)*0.005, 0, 100);
  gold.rolloutReadiness = clamp(gold.rolloutReadiness + 0.24 + (gold.storeReadiness-50)*0.007 + (gold.launchOps-45)*0.006, 0, 100);
  gold.goldStampReadiness = clamp(gold.goldStampReadiness + (goldMasterHealthScore(state)-65)*0.015 + 0.20, 0, 100);
  gold.launchRisk = clamp(gold.launchRisk + Math.max(0, 72-alpha.goldReadiness)*0.012 - (gold.rollbackReadiness-55)*0.008 - (gold.supportReadiness-50)*0.006 + (Number(report.monthlyBalance||0) < -80 ? 0.4 : 0), 0, 100);
  const snapshot = calculateGoldMasterSnapshot(state);
  gold.lastGate = diagnose(snapshot);
  gold.history.push({ m:state.month, y:state.year, score:snapshot.goldScore, gates:snapshot.gatesPassed, risk:snapshot.launchRisk, publishing:snapshot.publishing });
  gold.history = gold.history.slice(-36);
  return { score:snapshot.goldScore, gates:snapshot.gatesPassed, risk:snapshot.launchRisk, publishing:snapshot.publishing, certification:snapshot.certification };
}

export function readGoldMetric(state, metric) {
  const gold = ensureGoldMasterState(state);
  if (metric === "systemicHealth") return calculateGoldMasterSnapshot(state).systemicHealth;
  if (metric === "goldScore") return calculateGoldMasterSnapshot(state).goldScore;
  return Number(gold[metric] ?? 0);
}

function diagnose(snapshot) {
  if (snapshot.launchRisk > 58) return { severity:"danger", messageKey:"gold.gate.blocked" };
  if (snapshot.goldScore >= 86 && snapshot.gatesPassed >= 7) return { severity:"positive", messageKey:"gold.gate.gold" };
  if (snapshot.certification < 76) return { severity:"warning", messageKey:"gold.gate.certification" };
  if (snapshot.publishing < 70) return { severity:"warning", messageKey:"gold.gate.publishing" };
  return { severity:"info", messageKey:"gold.gate.progress" };
}

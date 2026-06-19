import { clamp } from "../core/dom.js";
import { REGIONS, nationalRegionId } from "../data/electionData.js";
import { ELECTORAL_STRATEGIES, ELECTORAL_SEGMENTS } from "../data/electoralCareerData.js";
import { nationalPoll, mainOpponent, voteChance } from "./elections.js";

export function createElectoralCareerState() {
  return {
    schema: 1,
    activeStrategy: "moderate_broad_front",
    campaignFund: 46,
    volunteerNetwork: 42,
    groundGame: 43,
    digitalMobilization: 45,
    coalitionEndorsements: 40,
    donorConfidence: 46,
    partyUnity: 48,
    electoralLawCompliance: 58,
    debatePreparedness: 44,
    pollAccuracy: 42,
    undecidedVoters: 22,
    runoffPreparedness: 38,
    careerMomentum: 45,
    policyContinuity: 48,
    ethicsRisk: 24,
    electionPressure: 35,
    mandateLegacy: 43,
    lastDiagnosis: { severity:"info", messageKey:"electoral.diagnosis.stable" },
    regions: REGIONS.map(r => ({ id:r.id, machine:44, swing:0, turnout:58, loyalty:46 })),
    segments: ELECTORAL_SEGMENTS.map(s => ({ ...s, support:s.base, volatility:20 })),
    history: [],
    results: []
  };
}

export function ensureElectoralCareerState(state) {
  if (!state.electoralCareer || typeof state.electoralCareer !== "object") state.electoralCareer = createElectoralCareerState();
  const base = createElectoralCareerState();
  const ec = state.electoralCareer;
  for (const [key, value] of Object.entries(base)) if (ec[key] === undefined || ec[key] === null) ec[key] = structuredClone(value);
  ec.schema = 1;
  const pct = ["campaignFund","volunteerNetwork","groundGame","digitalMobilization","coalitionEndorsements","donorConfidence","partyUnity","electoralLawCompliance","debatePreparedness","pollAccuracy","runoffPreparedness","careerMomentum","policyContinuity","electionPressure","mandateLegacy"];
  for (const key of pct) ec[key] = clamp(Number.isFinite(Number(ec[key])) ? Number(ec[key]) : base[key], 0, 100);
  ec.undecidedVoters = clamp(Number.isFinite(Number(ec.undecidedVoters)) ? Number(ec.undecidedVoters) : 22, 0, 45);
  ec.ethicsRisk = clamp(Number.isFinite(Number(ec.ethicsRisk)) ? Number(ec.ethicsRisk) : 24, 0, 100);
  ec.activeStrategy = ELECTORAL_STRATEGIES.some(item => item.id === ec.activeStrategy) ? ec.activeStrategy : base.activeStrategy;
  ec.regions = REGIONS.map(region => {
    const existing = (Array.isArray(ec.regions) ? ec.regions : []).find(item => item.id === region.id) || {};
    return { id:region.id, machine:clamp(Number(existing.machine ?? 44),0,100), swing:clamp(Number(existing.swing || 0),-25,25), turnout:clamp(Number(existing.turnout ?? 58),0,100), loyalty:clamp(Number(existing.loyalty ?? 46),0,100) };
  });
  ec.segments = ELECTORAL_SEGMENTS.map(segment => {
    const existing = (Array.isArray(ec.segments) ? ec.segments : []).find(item => item.id === segment.id) || {};
    return { ...segment, support:clamp(Number(existing.support ?? segment.base),0,100), volatility:clamp(Number(existing.volatility ?? 20),0,100) };
  });
  ec.history = Array.isArray(ec.history) ? ec.history.slice(-36) : [];
  ec.results = Array.isArray(ec.results) ? ec.results.slice(-6) : [];
  return ec;
}

export function calculateElectoralSnapshot(state) {
  const ec = ensureElectoralCareerState(state);
  const poll = nationalPoll(state);
  const opponent = mainOpponent(state);
  const machinery = clamp(ec.groundGame*0.22 + ec.volunteerNetwork*0.18 + ec.digitalMobilization*0.16 + ec.coalitionEndorsements*0.14 + ec.partyUnity*0.12 + ec.campaignFund*0.10 + ec.debatePreparedness*0.08, 0, 100);
  const governanceVote = voteChance(state);
  const complianceRisk = clamp(100 - ec.electoralLawCompliance + ec.ethicsRisk*0.55 + Math.max(0,(state.corruption || 0)-20)*0.4, 0, 100);
  const oppositionSurge = clamp((state.opposition || 40)*0.35 + (state.rejection || 30)*0.33 + (state.crisis || 0)*4.2 + complianceRisk*0.12 - machinery*0.12, 0, 100);
  const projectedFirstRound = clamp(poll.incumbent + (machinery - 50)*0.15 + (ec.careerMomentum - 50)*0.10 + (ec.undecidedVoters < 18 ? 1.5 : -1.2), 0, 100);
  const runoffChance = clamp(62 - projectedFirstRound*0.65 + opponent.strength*0.35 + oppositionSurge*0.18, 0, 100);
  const victoryPath = clamp(projectedFirstRound*0.52 + machinery*0.22 + ec.runoffPreparedness*0.12 + (100-complianceRisk)*0.08 + ec.policyContinuity*0.06 - oppositionSurge*0.12, 0, 100);
  const legacy = clamp((state.prestige || 45)*0.22 + (state.approval || 50)*0.22 + (state.stability || 50)*0.18 + (state.economy || 50)*0.14 + (100-(state.inequality||50))*0.1 + ec.policyContinuity*0.14, 0, 100);
  return { poll, opponent, machinery, governanceVote, complianceRisk, oppositionSurge, projectedFirstRound, runoffChance, victoryPath, legacy };
}

export function electoralHealthScore(state) {
  const s = calculateElectoralSnapshot(state);
  return Math.round(clamp(s.victoryPath*0.48 + s.machinery*0.28 + (100-s.complianceRisk)*0.14 + s.legacy*0.10, 0, 100));
}

export function setElectoralStrategy(state, id) {
  const ec = ensureElectoralCareerState(state);
  const strategy = ELECTORAL_STRATEGIES.find(item => item.id === id) || ELECTORAL_STRATEGIES[0];
  ec.activeStrategy = strategy.id;
  applyElectoralCareerEffects(state, strategy.effects || {});
  return strategy;
}

export function applyElectoralCareerEffects(state, effects = {}) {
  const ec = ensureElectoralCareerState(state);
  const direct = ["campaignFund","volunteerNetwork","groundGame","digitalMobilization","coalitionEndorsements","donorConfidence","partyUnity","electoralLawCompliance","debatePreparedness","pollAccuracy","undecidedVoters","runoffPreparedness","careerMomentum","policyContinuity","ethicsRisk","electionPressure","mandateLegacy","regionalMachine"];
  const legacy = {};
  for (const [key, value] of Object.entries(effects || {})) {
    if (key === "regionalMachine") {
      ec.regions = ec.regions.map(r => ({ ...r, machine:clamp(Number(r.machine || 0) + Number(value || 0), 0, 100), turnout:clamp(Number(r.turnout || 0) + Number(value || 0)*0.35, 0, 100) }));
    } else if (direct.includes(key)) {
      const min = key === "undecidedVoters" ? 0 : 0;
      const max = key === "undecidedVoters" ? 45 : 100;
      ec[key] = clamp(Number(ec[key] || 0) + Number(value || 0), min, max);
    } else {
      legacy[key] = value;
    }
  }
  const snapshot = calculateElectoralSnapshot(state);
  ec.electionPressure = snapshot.oppositionSurge;
  ec.mandateLegacy = snapshot.legacy;
  return legacy;
}

export function processElectoralCareerMonth(state, report = {}) {
  const ec = ensureElectoralCareerState(state);
  const snapshot = calculateElectoralSnapshot(state);
  const days = Number(state.electionDays || 1460);
  const electoralHeat = days <= 365 ? (365 - days) / 365 : 0;
  const strategy = ELECTORAL_STRATEGIES.find(item => item.id === ec.activeStrategy) || ELECTORAL_STRATEGIES[0];
  const economicMood = clamp((state.economy || 50)*0.38 + (100-(state.inflation || 6)*5)*0.18 + (100-(state.unemployment||9)*3.2)*0.18 + (state.marketConfidence || 50)*0.12 + (100-(state.inequality||50))*0.14, 0, 100);
  ec.careerMomentum = clamp(ec.careerMomentum*0.72 + (state.approval || 50)*0.12 + (state.prestige || 45)*0.10 + (100-(state.crisis||0)*10)*0.06, 0, 100);
  ec.campaignFund = clamp(ec.campaignFund + (ec.donorConfidence - 50)*0.06 + (state.marketConfidence - 50)*0.04 - electoralHeat*0.6, 0, 100);
  ec.undecidedVoters = clamp(ec.undecidedVoters + (50 - snapshot.projectedFirstRound)*0.012 - ec.groundGame*0.015 - ec.digitalMobilization*0.010 + electoralHeat*0.2, 0, 45);
  ec.ethicsRisk = clamp(ec.ethicsRisk + (100-ec.electoralLawCompliance)*0.025 + electoralHeat*0.8 + (state.corruption || 0)*0.012 - (strategy.id === "institutional_legacy" ? 0.35 : 0), 0, 100);
  ec.runoffPreparedness = clamp(ec.runoffPreparedness + (days <= 180 ? 1.1 : 0.15) + (ec.coalitionEndorsements - 50)*0.015, 0, 100);
  ec.segments = ec.segments.map(seg => {
    const source = Number(state[seg.source] ?? 50);
    const target = clamp(seg.base*0.34 + source*0.42 + snapshot.machinery*0.12 + economicMood*0.08 + (100-ec.ethicsRisk)*0.04, 0, 100);
    const support = clamp(Number(seg.support || seg.base)*0.72 + target*0.28, 0, 100);
    return { ...seg, support, volatility:clamp(Math.abs(target-support)*0.8 + ec.undecidedVoters*0.5, 0, 100) };
  });
  ec.regions = REGIONS.map(region => {
    const previous = (ec.regions || []).find(r => r.id === region.id) || {};
    const national = snapshot.projectedFirstRound;
    const localBoost = region.leaning === "social" ? (state.approval-50)*0.08 : region.leaning === "mercado" ? (state.marketConfidence-50)*0.07 : region.leaning === "agro" ? ((state.agribusiness||50)-50)*0.09 : region.leaning === "seguranca" ? ((state.security||50)-50)*0.08 : (state.prestige-50)*0.05;
    const target = clamp(national + localBoost + Number(region.approvalBias || 0) + (Number(previous.machine || 44)-50)*0.09, 0, 100);
    return { id:region.id, machine:clamp(Number(previous.machine ?? 44) + (ec.groundGame-50)*0.018, 0, 100), turnout:clamp(Number(previous.turnout ?? 58) + (ec.volunteerNetwork-50)*0.02 + electoralHeat*0.8, 0, 100), loyalty:clamp(Number(previous.loyalty ?? 46)*0.7 + target*0.3, 0, 100), swing:clamp(target - Number(previous.loyalty ?? 46), -25, 25) };
  });
  ec.electionPressure = snapshot.oppositionSurge;
  ec.mandateLegacy = snapshot.legacy;
  ec.lastDiagnosis = diagnose(snapshot, ec);
  if (days <= 120 && snapshot.victoryPath < 45) {
    state.rejection = clamp((state.rejection || 30) + 0.45, 0, 100);
    state.campaign = clamp((state.campaign || 35) - 0.2, 0, 100);
  } else if (snapshot.victoryPath > 62) {
    state.campaign = clamp((state.campaign || 35) + 0.3, 0, 100);
  }
  ec.history.push({ m:state.month, y:state.year, health:electoralHealthScore(state), victory:snapshot.victoryPath, first:snapshot.projectedFirstRound, runoff:snapshot.runoffChance, compliance:snapshot.complianceRisk, legacy:snapshot.legacy });
  ec.history = ec.history.slice(-36);
  return { health:electoralHealthScore(state), victory:snapshot.victoryPath, first:snapshot.projectedFirstRound, runoff:snapshot.runoffChance, compliance:snapshot.complianceRisk, legacy:snapshot.legacy };
}

export function registerElectionResult(state, result = {}) {
  const ec = ensureElectoralCareerState(state);
  ec.results.push({ year:state.year, month:state.month, incumbentVote:result.incumbentVote ?? state.lastElection?.incumbentVote ?? 0, opponentVote:result.opponentVote ?? state.lastElection?.opponentVote ?? 0, won:!!result.won, secondRound:!!(result.secondRound ?? state.lastElection?.secondRound) });
  ec.results = ec.results.slice(-6);
  ec.campaignFund = Math.max(22, ec.campaignFund - 18);
  ec.volunteerNetwork = Math.max(24, ec.volunteerNetwork - 10);
  ec.groundGame = Math.max(26, ec.groundGame - 8);
  ec.digitalMobilization = Math.max(26, ec.digitalMobilization - 7);
  ec.electionPressure = 25;
  ec.undecidedVoters = 24;
  if (result.won) ec.careerMomentum = clamp(ec.careerMomentum + 10, 0, 100);
  else ec.careerMomentum = clamp(ec.careerMomentum - 12, 0, 100);
}

function diagnose(snapshot, ec) {
  if (snapshot.complianceRisk > 70) return { severity:"danger", messageKey:"electoral.diagnosis.compliance" };
  if (snapshot.victoryPath < 42) return { severity:"warning", messageKey:"electoral.diagnosis.risk" };
  if (snapshot.runoffChance > 62) return { severity:"warning", messageKey:"electoral.diagnosis.runoff" };
  if (snapshot.victoryPath > 64 && ec.partyUnity > 55) return { severity:"positive", messageKey:"electoral.diagnosis.advantage" };
  return { severity:"info", messageKey:"electoral.diagnosis.stable" };
}

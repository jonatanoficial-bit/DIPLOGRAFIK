import { monthlyEconomy } from "./economy.js";
import { ensureDeepEconomyState } from "./economyDeep.js";
import { processRandomEvent } from "./events.js";
import { applyEffects, impeachmentRisk, normalizeState } from "./calculations.js";
import { simulateElection } from "./elections.js";
import { updateCongressPressure } from "./government.js";
import { updateMediaCycle, processMediaPublicMonth } from "./media.js";
import { processDiplomacyAI } from "./diplomacy.js";
import { processSecurityCycle, calculateCoupRisk } from "./security.js";
import { processCrisisChains, activeCrises } from "./crisis.js";
import { checkAchievements, checkMandateGoals, updateGlobalRank } from "./progression.js";
import { tickMonetizationCooldowns } from "./monetization.js";
import { getDifficultyProfile } from "./governmentCreation.js";
import { ensurePopulationState, processPopulationDay, weeklyPopulationCycle, monthlyPopulationCycle } from "./population.js";
import { ensureInstitutionalState, processInstitutionalMonth } from "./governmentInstitutions.js";
import { ensureCabinetState, processCabinetMonth } from "./cabinetAdministration.js";
import { ensureWorldDiplomacyState, processWorldDiplomacyMonth } from "./worldDiplomacy.js";
import { ensureDefenseIntelligenceState, processDefenseIntelligenceMonth } from "./defenseIntelligence.js";
import { ensureNationalCrisisState, processNationalCrisisMonth } from "./nationalCrisis.js";
import { ensureElectoralCareerState, processElectoralCareerMonth, registerElectionResult } from "./electoralCareer.js";
import { ensureScenarioTutorialState, processScenarioTutorialMonth } from "./scenarioTutorial.js";
import { ensureAlphaBetaState, processAlphaBetaMonth } from "./alphaBeta.js";
import { ensureGoldMasterState, processGoldMasterMonth } from "./goldMaster.js";
import { ensureInternationalLaunchState, processInternationalLaunchMonth } from "./internationalLaunch.js";

export const CORE_LOOP_SCHEMA = 2;
export const TERM_DAYS = 1460;
export const WEEK_DAYS = 7;
export const MAX_PENDING_CONSEQUENCES = 24;

const PHASES = Object.freeze({
  first100: "Primeiros 100 dias",
  implementation: "Implementação",
  consolidation: "Consolidação",
  election: "Período eleitoral",
  transition: "Transição de governo",
  concluded: "Carreira concluída"
});

export function ensureCoreLoopState(state) {
  const inferredTotalDays = Math.max(0,
    (Number(state.year || 2026) - 2026) * 360 +
    (Number(state.month || 1) - 1) * 30 +
    (Number(state.day || 1) - 1)
  );
  const defaults = {
    schema: CORE_LOOP_SCHEMA,
    totalDays: inferredTotalDays,
    weekNumber: Math.floor(inferredTotalDays / WEEK_DAYS) + 1,
    quarter: Math.floor((Number(state.month || 1) - 1) / 3) + 1,
    termNumber: 1,
    termDay: Math.max(1, TERM_DAYS - Math.max(0, Number(state.electionDays ?? TERM_DAYS))),
    phase: PHASES.first100,
    actionPoints: 10,
    maxActionPoints: 10,
    administrativeCapacity: 64,
    fiscalCredibility: 55,
    institutionalResilience: 61,
    socialCohesion: 55,
    policyFatigue: 0,
    recoveryMomentum: 0,
    pendingConsequences: [],
    reports: { weekly: null, monthly: null, quarterly: null, annual: null },
    pressureDays: { impeachment: 0, coup: 0, fiscal: 0 },
    lastBudgetCycle: null,
    lastTaxCycle: null,
    scoreHistory: [],
    outcome: null,
    outcomePresented: false
  };

  const existing = state.governance && typeof state.governance === "object" ? state.governance : {};
  if (!state.governance || state.governance !== existing) state.governance = existing;
  for (const [key, value] of Object.entries(defaults)) {
    if (existing[key] === undefined || existing[key] === null) existing[key] = structuredClone(value);
  }
  existing.reports = { ...defaults.reports, ...(existing.reports || {}) };
  existing.pressureDays = { ...defaults.pressureDays, ...(existing.pressureDays || {}) };
  existing.pendingConsequences = Array.isArray(existing.pendingConsequences) ? existing.pendingConsequences.slice(0, MAX_PENDING_CONSEQUENCES) : [];
  existing.scoreHistory = Array.isArray(existing.scoreHistory) ? existing.scoreHistory.slice(-24) : [];
  state.governance = existing;
  state.governance.schema = CORE_LOOP_SCHEMA;
  state.careerStatus = state.careerStatus || (state.governance.outcome ? state.governance.outcome.status : "active");
  state.governance.phase = getGovernancePhase(state);
  normalizeGovernance(state);
  ensurePopulationState(state);
  ensureDeepEconomyState(state);
  ensureInstitutionalState(state);
  ensureCabinetState(state);
  ensureWorldDiplomacyState(state);
  ensureDefenseIntelligenceState(state);
  ensureNationalCrisisState(state);
  ensureElectoralCareerState(state);
  ensureScenarioTutorialState(state);
  ensureAlphaBetaState(state);
  ensureGoldMasterState(state);
  ensureInternationalLaunchState(state);
  return state.governance;
}

export function getGovernancePhase(state) {
  const gov = state.governance || {};
  if (state.careerStatus && state.careerStatus !== "active") return PHASES.concluded;
  if (Number(state.electionDays || 0) <= 90) return PHASES.election;
  if (Number(gov.termDay || 0) <= 100) return PHASES.first100;
  if (Number(gov.termDay || 0) <= 730) return PHASES.implementation;
  return PHASES.consolidation;
}

export function legacyScore(state) {
  ensureCoreLoopState(state);
  const gov = state.governance;
  const institutional = (
    Number(state.approval || 0) + Number(state.economy || 0) + Number(state.stability || 0) +
    Number(state.influence || 0) + Number(state.prestige || 0) + Number(gov.institutionalResilience || 0) +
    Number(gov.fiscalCredibility || 0) + Number(gov.socialCohesion || 0)
  ) / 8;
  const penalties = Math.max(0, Number(state.debt || 0) - 70) * 0.12 +
    Math.max(0, Number(state.inflation || 0) - 8) * 0.8 +
    Number(state.crisis || 0) * 1.4 + Number(state.corruption || 0) * 0.05;
  return clampNumber(institutional - penalties, 0, 100);
}

export function consumeActionCapacity(state, cost = 1, log, label = "Ação estratégica") {
  const gov = ensureCoreLoopState(state);
  if (state.careerStatus !== "active") {
    if (log) log("A carreira foi concluída. Inicie ou carregue outra carreira para continuar.", "warning");
    return false;
  }
  const normalizedCost = clampNumber(Math.round(Number(cost) || 1), 1, 5);
  if (gov.actionPoints < normalizedCost) {
    if (log) log("Capacidade de governo insuficiente. Avance a semana para recompor a equipe.", "warning");
    return false;
  }
  gov.actionPoints -= normalizedCost;
  gov.policyFatigue = clampNumber(gov.policyFatigue + normalizedCost * 3.5, 0, 100);
  gov.administrativeCapacity = clampNumber(gov.administrativeCapacity - normalizedCost * 0.35, 10, 100);
  gov.lastAction = { label, cost: normalizedCost, day: state.day, month: state.month, year: state.year };
  return true;
}

export function queueConsequence(state, consequence = {}) {
  const gov = ensureCoreLoopState(state);
  const effects = consequence.effects && typeof consequence.effects === "object" ? { ...consequence.effects } : {};
  if (!Object.keys(effects).length) return false;
  const item = {
    id: consequence.id || `consequence-${gov.totalDays}-${gov.pendingConsequences.length}`,
    title: consequence.title || "Consequência de política pública",
    daysLeft: clampNumber(Math.round(Number(consequence.daysLeft ?? consequence.days ?? 14)), 1, 360),
    effects,
    type: consequence.type || "info",
    createdAt: { day: state.day, month: state.month, year: state.year }
  };
  const duplicate = gov.pendingConsequences.find(entry => entry.id === item.id);
  if (duplicate) {
    duplicate.daysLeft = Math.max(duplicate.daysLeft, item.daysLeft);
    duplicate.effects = mergeEffects(duplicate.effects, item.effects);
  } else {
    gov.pendingConsequences.push(item);
    gov.pendingConsequences = gov.pendingConsequences.slice(-MAX_PENDING_CONSEQUENCES);
  }
  return true;
}

export function scheduleActionConsequence(state, item, label = "Política pública") {
  if (!item || typeof item !== "object") return false;
  const explicit = item.delayedEffects && typeof item.delayedEffects === "object" ? item.delayedEffects : null;
  const effects = explicit || deriveDelayedEffects(item.effects || {});
  if (!Object.keys(effects).length) return false;
  return queueConsequence(state, {
    id: `action:${item.id || label}:${state.governance?.totalDays || 0}`,
    title: `${label}: ${item.title || item.name || "efeito de médio prazo"}`,
    days: item.lagDays || inferLagDays(item),
    effects,
    type: effects.debt > 0 || effects.corruption > 0 ? "warning" : "info"
  });
}

export function canHoldElection(state) {
  const gov = ensureCoreLoopState(state);
  return state.careerStatus === "active" && Number(state.electionDays || 0) <= 30 && gov.termNumber < 2;
}

export function holdElection(state, log, options = {}) {
  const gov = ensureCoreLoopState(state);
  const force = options.force === true;
  const ignoreOutcomes = options.ignoreOutcomes === true;
  if (state.careerStatus !== "active" && !ignoreOutcomes) return false;
  if (!force && Number(state.electionDays || 0) > 30) {
    if (log) log("A eleição oficial só pode ser realizada nos 30 dias finais do mandato.", "warning");
    return false;
  }

  if (gov.termNumber >= 2) {
    if (ignoreOutcomes) {
      gov.termNumber = 1;
      gov.termDay = 0;
      state.electionDays = TERM_DAYS;
      return true;
    }
    const score = legacyScore(state);
    if (score >= 52) {
      resolveCareerOutcome(state, "victory", "Legado democrático", `Dois mandatos concluídos com legado nacional de ${Math.round(score)} pontos.`, log);
      return true;
    }
    resolveCareerOutcome(state, "defeat", "Fim de ciclo", `O segundo mandato terminou com legado insuficiente: ${Math.round(score)} pontos.`, log);
    return false;
  }

  const won = simulateElection(state, log);
  registerElectionResult(state, { ...(state.lastElection || {}), won });
  if (won) {
    gov.termNumber += 1;
    gov.termDay = 0;
    gov.actionPoints = gov.maxActionPoints;
    gov.policyFatigue = Math.max(0, gov.policyFatigue - 18);
    state.electionDays = TERM_DAYS;
    state.campaign = Math.max(20, state.campaign);
    queueConsequence(state, {
      id: `transition:${gov.termNumber}:${gov.totalDays}`,
      title: "Transição para o novo mandato",
      days: 30,
      effects: { stability: 2, politicalCapital: 4, campaign: -5, prestige: 2 },
      type: "positive"
    });
    return true;
  }

  if (ignoreOutcomes) {
    gov.termNumber = Math.min(2, gov.termNumber + 1);
    gov.termDay = 0;
    state.electionDays = TERM_DAYS;
    applyEffects(state, { approval: 5, stability: 5, politicalCapital: 8, campaign: 8, crisis: -1 });
    return false;
  }
  resolveCareerOutcome(state, "defeat", "Derrota eleitoral", "A oposição venceu a eleição e iniciou a transição de governo.", log);
  return false;
}

export function resolveCareerOutcome(state, status, title, reason, log) {
  const gov = ensureCoreLoopState(state);
  if (gov.outcome) return gov.outcome;
  const score = Math.round(legacyScore(state));
  const outcome = {
    status,
    title,
    reason,
    score,
    termNumber: gov.termNumber,
    totalDays: gov.totalDays,
    date: { day: state.day, month: state.month, year: state.year }
  };
  gov.outcome = outcome;
  gov.outcomePresented = false;
  gov.phase = PHASES.concluded;
  state.careerStatus = status;
  if (log) log(`${title}: ${reason}`, status === "victory" ? "positive" : "negative");
  return outcome;
}

export function acknowledgeCareerOutcome(state) {
  const gov = ensureCoreLoopState(state);
  gov.outcomePresented = true;
}

export function advanceDay(state, log, days = 1, options = {}) {
  const gov = ensureCoreLoopState(state);
  const ignoreOutcomes = options.ignoreOutcomes === true;
  if (state.careerStatus !== "active" && !ignoreOutcomes) {
    if (!gov.outcomePresented && log) log("A carreira está concluída. Consulte o resultado final.", "info");
    return 0;
  }

  let advanced = 0;
  for (let i = 0; i < days; i += 1) {
    if (state.careerStatus !== "active" && !ignoreOutcomes) break;
    advanceCalendar(state);
    advanced += 1;

    tickCooldowns(state);
    progressProjects(state, log);
    processPendingConsequences(state, log);
    passiveDrift(state);
    processPopulationDay(state, log);
    updateCongressPressure(state);

    if (gov.totalDays % 2 === 0) processSecurityCycle(state, log);
    if (gov.totalDays % 3 === 0) {
      processDiplomacyAI(state, log);
      processCrisisChains(state, log);
    }
    if (gov.totalDays % WEEK_DAYS === 0) { weeklyGovernanceCycle(state, log); weeklyPopulationCycle(state, log); }

    const monthClosed = state.day === 1 && gov.totalDays > 0;
    if (monthClosed) {
      const report = monthlyEconomy(state);
      monthlyGovernanceCycle(state, report, log);
      monthlyPopulationCycle(state, report, log);
      const institutionalReport = processInstitutionalMonth(state, report);
      const cabinetReport = processCabinetMonth(state, report);
      const mediaReport = processMediaPublicMonth(state, report);
      const worldDiplomacyReport = processWorldDiplomacyMonth(state, report);
      const defenseIntelligenceReport = processDefenseIntelligenceMonth(state, report);
      const nationalCrisisReport = processNationalCrisisMonth(state, report);
      const electoralCareerReport = processElectoralCareerMonth(state, report);
      const scenarioTutorialReport = processScenarioTutorialMonth(state, report);
      const alphaBetaReport = processAlphaBetaMonth(state, report);
      const goldMasterReport = processGoldMasterMonth(state, report);
      const internationalLaunchReport = processInternationalLaunchMonth(state, report);
      if (state.governance?.reports?.monthly) {
        state.governance.reports.monthly.institutions = { score: institutionalReport.institutionalScore, risk: institutionalReport.institutionalRisk, governability: institutionalReport.governability };
        state.governance.reports.monthly.cabinet = { score: cabinetReport.administrationScore, risk: cabinetReport.executionRisk, governability: cabinetReport.governability };
        state.governance.reports.monthly.media = { mood: mediaReport.publicMood, hostility: mediaReport.hostility, credibility: mediaReport.credibility, agendaRisk: mediaReport.agendaRisk };
        state.governance.reports.monthly.worldDiplomacy = { health: worldDiplomacyReport.health, risk: worldDiplomacyReport.risk, trust: worldDiplomacyReport.trust, tradeWindow: worldDiplomacyReport.tradeWindow };
        state.governance.reports.monthly.defenseIntelligence = { health: defenseIntelligenceReport.health, risk: defenseIntelligenceReport.risk, readiness: defenseIntelligenceReport.readiness, intelligenceEdge: defenseIntelligenceReport.intelligenceEdge };
        state.governance.reports.monthly.nationalCrisis = { health: nationalCrisisReport.health, compound: nationalCrisisReport.compound, readiness: nationalCrisisReport.readiness, recovery: nationalCrisisReport.recovery, activeScenarios: nationalCrisisReport.activeScenarios };
        state.governance.reports.monthly.electoralCareer = { health: electoralCareerReport.health, victory: electoralCareerReport.victory, first: electoralCareerReport.first, runoff: electoralCareerReport.runoff, compliance: electoralCareerReport.compliance, legacy: electoralCareerReport.legacy };
        state.governance.reports.monthly.scenarioTutorial = { health: scenarioTutorialReport.health, readiness: scenarioTutorialReport.readiness, mastery: scenarioTutorialReport.mastery, onboardingRisk: scenarioTutorialReport.onboardingRisk, missions: scenarioTutorialReport.missions };
        state.governance.reports.monthly.alphaBeta = { health: alphaBetaReport.health, technical: alphaBetaReport.technical, gameplay: alphaBetaReport.gameplay, commercial: alphaBetaReport.commercial, risk: alphaBetaReport.risk, gates: alphaBetaReport.gates };
        state.governance.reports.monthly.goldMaster = { score: goldMasterReport.score, gates: goldMasterReport.gates, risk: goldMasterReport.risk, publishing: goldMasterReport.publishing, certification: goldMasterReport.certification };
        state.governance.reports.monthly.internationalLaunch = { score: internationalLaunchReport.score, gates: internationalLaunchReport.gates, risk: internationalLaunchReport.risk, fit: internationalLaunchReport.fit, ops: internationalLaunchReport.ops };
      }
      if (state.month === 1) annualGovernanceCycle(state, log);
      if ([1, 4, 7, 10].includes(state.month)) quarterlyGovernanceCycle(state, log);
    }

    if (gov.totalDays % 9 === 0) updateMediaCycle(state, log);
    if (state.nextEventIn <= 0) {
      processRandomEvent(state, log);
      const difficulty = getDifficultyProfile(state);
      state.nextEventIn = Math.max(5, Math.round((10 + Math.floor(Math.random() * 11)) * Number(difficulty.eventIntervalModifier || 1)));
    }

    monitorInstitutionalPressure(state, log, ignoreOutcomes);
    if (state.electionDays <= 0) holdElection(state, log, { force: true, ignoreOutcomes });

    tickMonetizationCooldowns(state);
    checkAchievements(state, log);
    checkMandateGoals(state, log);
    updateGlobalRank(state);
    gov.phase = getGovernancePhase(state);
    normalizeState(state);
    normalizeGovernance(state);
  }
  return advanced;
}

function advanceCalendar(state) {
  const gov = ensureCoreLoopState(state);
  state.day += 1;
  gov.totalDays += 1;
  gov.termDay += 1;
  gov.weekNumber = Math.floor(gov.totalDays / WEEK_DAYS) + 1;
  state.electionDays -= 1;
  state.nextEventIn -= 1;
  if (state.day > 30) {
    state.day = 1;
    state.month += 1;
  }
  if (state.month > 12) {
    state.month = 1;
    state.year += 1;
  }
  gov.quarter = Math.floor((state.month - 1) / 3) + 1;
}

function passiveDrift(state) {
  const gov = ensureCoreLoopState(state);
  const difficulty = getDifficultyProfile(state);
  const pressure = Number(difficulty.pressureMultiplier || 1);
  const fatiguePenalty = gov.policyFatigue * 0.0018;
  const resilience = (gov.institutionalResilience - 50) * 0.0025;
  const cohesion = (gov.socialCohesion - 50) * 0.0022;
  const fiscal = (gov.fiscalCredibility - 50) * 0.002;
  const approvalRecovery = state.approval < 35 ? (35 - state.approval) * 0.008 : 0;
  const stabilityRecovery = state.stability < 38 ? (38 - state.stability) * 0.0022 : 0;
  applyEffects(state, {
    approval: (state.economy - 50) * 0.0025 + (state.stability - 50) * 0.0018 + cohesion - state.crisis * 0.006 * pressure - fatiguePenalty * pressure + approvalRecovery,
    economy: state.economy > 84 ? -(state.economy - 84) * 0.0014 : 0,
    stability: (state.coalition - 50) * 0.0015 + resilience - state.corruption * 0.00055 * pressure - state.crisis * 0.004 * pressure + stabilityRecovery,
    politicalCapital: state.politicalCapital < 28 ? (28 - state.politicalCapital) * 0.0012 : 0,
    influence: (state.diplomacy - 50) * 0.0017 + (state.prestige - 50) * 0.0012,
    marketConfidence: fiscal - Math.max(0, state.debt - 90) * 0.0012,
    loyalty: (58 - state.loyalty) * 0.0022 + resilience * 0.25,
    globalTension: (42 - state.globalTension) * 0.0018,
    crisis: state.stability > 48 && state.approval > 38 ? -0.006 : 0
  });
}

function weeklyGovernanceCycle(state, log) {
  const gov = ensureCoreLoopState(state);
  const difficulty = getDifficultyProfile(state);
  const ministers = Array.isArray(state.ministers) && state.ministers.length ? state.ministers : [];
  const ministerPerformance = ministers.length ? ministers.reduce((sum, item) => sum + Number(item.performance || 50), 0) / ministers.length : 50;
  const adminTarget = clampNumber(
    ministerPerformance * 0.42 + state.stability * 0.22 + state.coalition * 0.18 + (100 - state.crisis * 10) * 0.18 - gov.policyFatigue * 0.12,
    15, 95
  );
  gov.administrativeCapacity += (adminTarget - gov.administrativeCapacity) * 0.18;
  gov.maxActionPoints = clampNumber(Math.round(4 + gov.administrativeCapacity / 12 + Number(difficulty.governance?.maxActionPoints || 0)), 5, 12);
  const recovered = Math.max(2, Math.round(gov.administrativeCapacity / 25));
  gov.actionPoints = Math.min(gov.maxActionPoints, gov.actionPoints + recovered);
  gov.policyFatigue = Math.max(0, gov.policyFatigue - 4.5);
  if (state.politicalCapital < 36 && state.congressPressure < 82) {
    applyEffects(state, { politicalCapital: 0.9 + gov.administrativeCapacity / 120 });
  }

  const fiscalTarget = clampNumber(
    state.marketConfidence * 0.38 + (100 - Math.min(100, state.debt)) * 0.28 + (state.lastMonthlyBalance >= 0 ? 68 : 38) * 0.2 + state.economy * 0.14,
    5, 95
  );
  const resilienceTarget = clampNumber(
    state.stability * 0.34 + state.coalition * 0.2 + state.loyalty * 0.18 + (100 - state.corruption) * 0.16 + (100 - state.coupRisk) * 0.12,
    5, 95
  );
  const cohesionTarget = clampNumber(
    state.approval * 0.3 + state.stability * 0.24 + (100 - state.inequality) * 0.2 + (100 - state.unemployment * 2.5) * 0.16 + (100 - state.crisis * 10) * 0.1,
    5, 95
  );
  gov.fiscalCredibility += (fiscalTarget - gov.fiscalCredibility) * 0.16;
  gov.institutionalResilience += (resilienceTarget - gov.institutionalResilience) * 0.16;
  gov.socialCohesion += (cohesionTarget - gov.socialCohesion) * 0.16;

  applyAutomaticStabilizers(state);
  gov.reports.weekly = {
    week: gov.weekNumber,
    actionPoints: gov.actionPoints,
    administrativeCapacity: Math.round(gov.administrativeCapacity),
    institutionalResilience: Math.round(gov.institutionalResilience),
    date: { day: state.day, month: state.month, year: state.year }
  };

  if (gov.weekNumber % 4 === 0 && log) {
    log("Relatório semanal consolidado: capacidade administrativa e pontos de ação foram atualizados.", "info");
  }
}

function monthlyGovernanceCycle(state, economyReport, log) {
  const gov = ensureCoreLoopState(state);
  const active = activeCrises(state).filter(item => item.level >= 2).length;
  if (!active && state.crisis > 0) state.crisis = Math.max(0, state.crisis - 0.35);
  if (economyReport.monthlyBalance >= 0) gov.recoveryMomentum += 2;
  else gov.recoveryMomentum -= 1.5;
  if (state.economy > 52 && state.stability > 52) gov.recoveryMomentum += 1;
  gov.recoveryMomentum = clampNumber(gov.recoveryMomentum, -20, 20);
  if (gov.recoveryMomentum > 5) applyEffects(state, { approval: 0.6, marketConfidence: 0.8, politicalCapital: 0.5 });
  if (gov.recoveryMomentum < -8) applyEffects(state, { approval: -0.5, politicalCapital: -0.6 });

  gov.reports.monthly = {
    balance: economyReport.monthlyBalance,
    growth: Number(economyReport.growthIndex.toFixed(2)),
    debt: Number(state.debt.toFixed(2)),
    inflation: Number(state.inflation.toFixed(2)),
    unemployment: Number(state.unemployment.toFixed(2)),
    date: { month: state.month === 1 ? 12 : state.month - 1, year: state.month === 1 ? state.year - 1 : state.year }
  };
  if (log) log(`Fechamento mensal: saldo ₿ ${Math.round(economyReport.monthlyBalance)} bi e crescimento ${economyReport.growthIndex.toFixed(2)}%.`, economyReport.monthlyBalance >= 0 ? "positive" : "warning");
}

function quarterlyGovernanceCycle(state, log) {
  const gov = ensureCoreLoopState(state);
  const score = Math.round(legacyScore(state));
  gov.scoreHistory.push({ year: state.year, quarter: gov.quarter, score });
  gov.scoreHistory = gov.scoreHistory.slice(-24);
  gov.reports.quarterly = { year: state.year, quarter: gov.quarter, score, phase: getGovernancePhase(state) };
  if (score >= 65) applyEffects(state, { prestige: 1.5, politicalCapital: 2, approval: 0.8 });
  else if (score < 35) applyEffects(state, { prestige: -1, politicalCapital: -1.5 });
  if (log) log(`Revisão trimestral concluída: legado provisório em ${score} pontos.`, score >= 55 ? "positive" : score < 35 ? "warning" : "info");
}

function annualGovernanceCycle(state, log) {
  const gov = ensureCoreLoopState(state);
  const score = Math.round(legacyScore(state));
  gov.reports.annual = { year: state.year - 1, score, termNumber: gov.termNumber };
  if (score >= 70) applyEffects(state, { prestige: 3, politicalCapital: 4, approval: 1.5 });
  else if (score < 30) applyEffects(state, { prestige: -2, politicalCapital: -3, stability: -1 });
  if (log) log(`Balanço anual do governo: ${score} pontos de legado.`, score >= 60 ? "positive" : score < 35 ? "negative" : "info");
}

function applyAutomaticStabilizers(state) {
  const gov = ensureCoreLoopState(state);
  let activated = false;
  if (state.economy < 32) {
    const fiscalRoom = Math.min(14, Math.max(0, state.treasury));
    state.treasury -= fiscalRoom;
    applyEffects(state, { economy: 1.65, marketConfidence: 1.05, unemployment: -0.22, debt: 0.2 });
    activated = true;
  }
  if (state.stability < 38) {
    const recovery = state.stability < 15 ? 4.8 : state.stability < 25 ? 2.9 : 1.8;
    const crisisRelief = state.stability < 15 ? -1.05 : -0.42;
    applyEffects(state, { stability: recovery, crisis: crisisRelief, politicalCapital: -0.15, coalition: 0.45, treasury: state.stability < 15 ? -12 : 0, debt: state.stability < 15 ? 0.12 : 0 });
    gov.institutionalResilience = Math.min(100, gov.institutionalResilience + 0.8);
    activated = true;
  }
  if (state.approval < 32 && gov.socialCohesion > 18) {
    const recovery = state.approval < 15 ? 2.2 : 1.25;
    applyEffects(state, { approval: recovery, media: 0.45, treasury: -3, inequality: -0.08 });
    activated = true;
  }
  if (state.crisis > 6 && gov.institutionalResilience > 18) {
    const relief = state.crisis > 8.5 ? -1.15 : -0.65;
    applyEffects(state, { crisis: relief, stability: state.crisis > 8.5 ? 1.2 : 0.65, politicalCapital: -0.1 });
    activated = true;
  }
  if (state.loyalty < 35 && gov.institutionalResilience > 25) {
    applyEffects(state, { loyalty: 1.1, coupRisk: -0.7 });
    activated = true;
  }
  if (state.globalTension > 72 && state.diplomacy > 30) {
    applyEffects(state, { globalTension: -1.15, diplomacy: -0.1 });
    activated = true;
  }
  if (activated) gov.recoveryMomentum = Math.min(20, gov.recoveryMomentum + 0.8);
}

function monitorInstitutionalPressure(state, log, ignoreOutcomes) {
  const gov = ensureCoreLoopState(state);
  const difficulty = getDifficultyProfile(state);
  const pressure = Number(difficulty.pressureMultiplier || 1);
  const risk = impeachmentRisk(state);
  const coup = calculateCoupRisk(state);
  gov.pressureDays.impeachment = risk >= 88 && state.coalition < 28 ? gov.pressureDays.impeachment + 1 : Math.max(0, gov.pressureDays.impeachment - 2);
  gov.pressureDays.coup = coup >= 88 && state.loyalty < 28 && state.stability < 30 ? gov.pressureDays.coup + 1 : Math.max(0, gov.pressureDays.coup - 2);
  gov.pressureDays.fiscal = state.debt >= 148 && state.economy < 18 && state.treasury < 40 ? gov.pressureDays.fiscal + 1 : Math.max(0, gov.pressureDays.fiscal - 2);

  if (risk > 78 / pressure && gov.totalDays % 7 === 0) {
    applyEffects(state, { stability: -0.6, approval: -0.3, politicalCapital: -0.8, crisis: 0.15 });
    if (log) log("Risco de impeachment em zona crítica. A base exige reação imediata.", "negative");
  }
  if (ignoreOutcomes) return;
  if (gov.pressureDays.impeachment >= 21) resolveCareerOutcome(state, "defeat", "Impeachment", "A coalizão se desfez e o Congresso aprovou o afastamento do governo.", log);
  else if (gov.pressureDays.coup >= 14) resolveCareerOutcome(state, "defeat", "Ruptura institucional", "A lealdade militar colapsou e as instituições perderam o controle da transição.", log);
  else if (gov.pressureDays.fiscal >= 45) resolveCareerOutcome(state, "defeat", "Colapso fiscal", "O Estado perdeu capacidade de financiamento e entrou em insolvência política.", log);
}

function processPendingConsequences(state, log) {
  const gov = ensureCoreLoopState(state);
  const matured = [];
  for (const item of gov.pendingConsequences) {
    item.daysLeft -= 1;
    if (item.daysLeft <= 0) matured.push(item);
  }
  gov.pendingConsequences = gov.pendingConsequences.filter(item => item.daysLeft > 0);
  for (const item of matured) {
    applyEffects(state, item.effects);
    if (log) log(`Consequência amadureceu: ${item.title}.`, item.type || "info");
  }
}

function tickCooldowns(state) {
  if (!state.cooldowns || typeof state.cooldowns !== "object") state.cooldowns = {};
  for (const key of Object.keys(state.cooldowns)) {
    state.cooldowns[key] -= 1;
    if (state.cooldowns[key] <= 0) delete state.cooldowns[key];
  }
}

function progressProjects(state, log) {
  if (!Array.isArray(state.projects)) state.projects = [];
  if (!Array.isArray(state.completedProjects)) state.completedProjects = [];
  for (const project of state.projects) project.left -= 1;
  const done = state.projects.filter(project => project.left <= 0);
  state.projects = state.projects.filter(project => project.left > 0);
  for (const project of done) {
    applyEffects(state, project.effects);
    state.completedProjects.push(project.title);
    scheduleActionConsequence(state, { ...project, id: `completed-${project.id}`, lagDays: 30 }, "Projeto concluído");
    if (log) log(`Projeto concluído: ${project.title}.`, "positive");
  }
}

function deriveDelayedEffects(effects) {
  const delayed = {};
  const value = key => Number(effects[key] || 0);
  if (value("economy") > 0) {
    delayed.marketConfidence = round2(Math.min(2.2, value("economy") * 0.28));
    delayed.unemployment = round2(-Math.min(0.45, value("economy") * 0.055));
  }
  if (value("technology") > 0) delayed.economy = round2(Math.min(1.8, value("technology") * 0.2));
  if (value("industry") > 0) delayed.tradeBalance = round2(Math.min(1.5, value("industry") * 0.2));
  if (value("approval") > 0) delayed.govNarrative = round2(Math.min(1.4, value("approval") * 0.18));
  if (value("stability") > 0) delayed.crisis = round2(-Math.min(0.45, value("stability") * 0.06));
  if (value("debt") > 0) delayed.marketConfidence = round2((delayed.marketConfidence || 0) - Math.min(2, value("debt") * 0.55));
  if (value("corruption") > 0) delayed.media = round2(-Math.min(2, value("corruption") * 0.45));
  return Object.fromEntries(Object.entries(delayed).filter(([, item]) => item !== 0));
}

function inferLagDays(item) {
  const effects = item.effects || {};
  if (effects.technology || effects.industry || effects.environment) return 45;
  if (effects.economy || effects.debt || effects.inflation) return 30;
  return 14;
}

function mergeEffects(left = {}, right = {}) {
  const result = { ...left };
  for (const [key, value] of Object.entries(right)) result[key] = Number(result[key] || 0) + Number(value || 0);
  return result;
}

function normalizeGovernance(state) {
  const gov = state.governance;
  gov.totalDays = Math.max(0, Math.round(Number(gov.totalDays) || 0));
  gov.weekNumber = Math.max(1, Math.round(Number(gov.weekNumber) || 1));
  gov.quarter = clampNumber(Math.round(Number(gov.quarter) || 1), 1, 4);
  gov.termNumber = clampNumber(Math.round(Number(gov.termNumber) || 1), 1, 2);
  gov.termDay = Math.max(0, Math.round(Number(gov.termDay) || 0));
  gov.actionPoints = clampNumber(Number(gov.actionPoints) || 0, 0, 12);
  gov.maxActionPoints = clampNumber(Number(gov.maxActionPoints) || 10, 5, 12);
  gov.administrativeCapacity = clampNumber(Number(gov.administrativeCapacity) || 50, 0, 100);
  gov.fiscalCredibility = clampNumber(Number(gov.fiscalCredibility) || 50, 0, 100);
  gov.institutionalResilience = clampNumber(Number(gov.institutionalResilience) || 50, 0, 100);
  gov.socialCohesion = clampNumber(Number(gov.socialCohesion) || 50, 0, 100);
  gov.policyFatigue = clampNumber(Number(gov.policyFatigue) || 0, 0, 100);
  gov.recoveryMomentum = clampNumber(Number(gov.recoveryMomentum) || 0, -20, 20);
  gov.pendingConsequences = Array.isArray(gov.pendingConsequences) ? gov.pendingConsequences.slice(0, MAX_PENDING_CONSEQUENCES) : [];
}

function clampNumber(value, min, max) { return Math.max(min, Math.min(max, Number(value))); }
function round2(value) { return Math.round(value * 100) / 100; }

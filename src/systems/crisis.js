import { applyEffects, normalizeState } from "./calculations.js";
import { CRISIS_CHAINS } from "../data/crisisData.js";

export function ensureCrisisState(state) {
  if (!state.crisisChains) state.crisisChains = {};
  if (!state.crisisHistory) state.crisisHistory = [];
  for (const chain of CRISIS_CHAINS) {
    if (!state.crisisChains[chain.id]) {
      state.crisisChains[chain.id] = { level:0, active:false, title:chain.title, cooldown:0 };
    }
  }
}

export function activeCrises(state) {
  ensureCrisisState(state);
  return Object.entries(state.crisisChains)
    .map(([id,c]) => ({ id, ...c }))
    .filter(c => c.active || c.level > 0);
}

export function processCrisisChains(state, log) {
  ensureCrisisState(state);

  for (const chain of CRISIS_CHAINS) {
    const current = state.crisisChains[chain.id];
    if (current.cooldown > 0) current.cooldown -= 1;
    current.stableCycles = Number(current.stableCycles || 0);

    const shouldTrigger = safeTrigger(chain, state);
    const recoveryScore = crisisRecoveryScore(state);
    const recovering = !shouldTrigger ||
      (recoveryScore >= 52 && (state.crisis || 0) <= 7.5) ||
      ((state.governance?.recoveryMomentum || 0) >= 7 && recoveryScore >= 42);

    if (shouldTrigger && current.level === 0 && current.cooldown <= 0 && recoveryScore < 58) {
      current.active = true;
      current.level = 1;
      current.cooldown = 6;
      current.stableCycles = 0;
      const stage = chain.stages[0];
      applyEffects(state, stage.effects);
      pushHistory(state, chain.title, stage.title, stage.text);
      if (log) log(`Crise iniciada: ${chain.title} — ${stage.title}.`, "warning");
      continue;
    }

    if (!current.active || current.level <= 0) continue;
    current.stableCycles = recovering ? current.stableCycles + 1 : 0;

    if (current.cooldown <= 0 && current.stableCycles >= 2) {
      current.level = Math.max(0, current.level - 1);
      current.cooldown = current.level === 0 ? 10 : 6;
      current.stableCycles = 0;
      applyEffects(state, { crisis: -0.35, stability: 0.35 });
      if (current.level === 0) {
        current.active = false;
        if (log) log(`Crise controlada: ${chain.title}.`, "positive");
      } else if (log) {
        log(`Crise em descompressão: ${chain.title}.`, "positive");
      }
      continue;
    }

    if (current.cooldown <= 0 && !recovering && shouldEscalate(state, chain, current)) {
      current.level = Math.min(4, current.level + 1);
      current.cooldown = 8;
      const stage = chain.stages[current.level - 1];
      applyEffects(state, stage.effects);
      pushHistory(state, chain.title, stage.title, stage.text);
      if (log) log(`Crise escalou: ${chain.title} — ${stage.title}.`, current.level >= 3 ? "negative" : "warning");
    }
  }

  normalizeState(state);
}

function safeTrigger(chain, state) {
  try { return !!chain.trigger(state); } catch(e) { return false; }
}

function shouldEscalate(state, chain, current) {
  if (current.level >= 4) return false;
  const pressure =
    (state.crisis || 0) * 6.5 +
    (100 - (state.stability || 50)) * 0.24 +
    (100 - (state.approval || 50)) * 0.14 +
    (state.corruption || 0) * 0.08 -
    (state.governance?.institutionalResilience || 50) * 0.12;
  return pressure > 54 || (pressure > 43 && Math.random() < 0.1);
}

function crisisRecoveryScore(state) {
  return Math.max(0, Math.min(100,
    (state.stability || 0) * 0.28 +
    (state.approval || 0) * 0.14 +
    (state.security || 0) * 0.12 +
    (state.governance?.institutionalResilience || 50) * 0.28 +
    (state.governance?.socialCohesion || 50) * 0.18 -
    (state.crisis || 0) * 2.2
  ));
}

function pushHistory(state, chainTitle, stageTitle, text) {
  state.crisisHistory.unshift({
    chainTitle, stageTitle, text,
    day: state.day, month: state.month, year: state.year
  });
  state.crisisHistory = state.crisisHistory.slice(0, 15);
}

export function runCrisisAction(state, action, log) {
  ensureCrisisState(state);
  if (!action) return;
  if ((action.cost || 0) > state.treasury) {
    log("Tesouro insuficiente para resposta de crise.", "negative");
    return;
  }
  applyEffects(state, action.effects);

  const active = activeCrises(state).sort((a,b)=>b.level-a.level)[0];
  if (active && state.crisisChains[active.id]) {
    state.crisisChains[active.id].level = Math.max(0, state.crisisChains[active.id].level - 1);
    state.crisisChains[active.id].cooldown = 6;
    if (state.crisisChains[active.id].level === 0) state.crisisChains[active.id].active = false;
  }

  log(`Resposta de crise executada: ${action.title}.`, "positive");
  normalizeState(state);
}

export function crisisSeverity(state) {
  const active = activeCrises(state);
  if (!active.length) return 0;
  return Math.max(...active.map(c => c.level)) * 25;
}
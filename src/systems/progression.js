import { applyEffects, normalizeState } from "./calculations.js";
import { ACHIEVEMENTS, MANDATE_GOALS, UNLOCKS, DAILY_REWARDS } from "../data/progressionData.js";

export function ensureProgressionState(state) {
  if (!state.achievements) state.achievements = {};
  if (!state.unlocked) state.unlocked = {};
  if (!state.mandateGoals) state.mandateGoals = pickMandateGoals();
  if (!state.dailyClaims) state.dailyClaims = {};
  if (typeof state.leaderLevel !== "number") state.leaderLevel = state.level || 1;
  if (typeof state.leaderXP !== "number") state.leaderXP = state.xp || 0;
  if (typeof state.globalRank !== "number") state.globalRank = 100;
  if (typeof state.retentionStreak !== "number") state.retentionStreak = 1;
}

export function addXP(state, amount, log) {
  ensureProgressionState(state);
  state.leaderXP += amount;
  state.xp = state.leaderXP;
  while (state.leaderXP >= xpToNext(state.leaderLevel)) {
    state.leaderXP -= xpToNext(state.leaderLevel);
    state.leaderLevel += 1;
    state.level = state.leaderLevel;
    state.politicalCapital += 6;
    state.prestige += 2;
    if (log) log(`Progressão: líder subiu para nível ${state.leaderLevel}.`, "positive");
  }
  state.xp = state.leaderXP;
  normalizeState(state);
}

export function xpToNext(level) {
  return 80 + level * 28;
}

export function checkAchievements(state, log) {
  ensureProgressionState(state);
  for (const achievement of ACHIEVEMENTS) {
    if (state.achievements[achievement.id]) continue;
    let passed = false;
    try { passed = achievement.check(state); } catch(e) { passed = false; }
    if (passed) {
      state.achievements[achievement.id] = true;
      grantReward(state, achievement.reward, log, `Conquista desbloqueada: ${achievement.title}`);
    }
  }
  checkUnlocks(state, log);
}

export function checkMandateGoals(state, log) {
  ensureProgressionState(state);
  for (const goal of state.mandateGoals) {
    if (goal.done) continue;
    const value = goal.governanceTarget ? (state.governance?.[goal.target] ?? 0) : (state[goal.target] ?? 0);
    const passed = goal.reverse ? value <= goal.threshold : value >= goal.threshold;
    if (passed) {
      goal.done = true;
      grantReward(state, goal.reward, log, `Meta de mandato concluída: ${goal.title}`);
    }
  }
}

export function claimDailyReward(state, log) {
  ensureProgressionState(state);
  const cycleDay = ((state.day - 1) % 7) + 1;
  const key = `${state.year}-${state.month}-${state.day}`;
  if (state.dailyClaims[key]) {
    if (log) log("Recompensa diária já coletada hoje.", "warning");
    return false;
  }
  const reward = DAILY_REWARDS.find(r => r.day === cycleDay) || DAILY_REWARDS[0];
  state.dailyClaims[key] = true;
  grantReward(state, reward.reward, log, `Recompensa diária: ${reward.title}`);
  return true;
}

export function updateGlobalRank(state) {
  const score = (
    (state.approval || 0) * 0.18 +
    (state.economy || 0) * 0.18 +
    (state.stability || 0) * 0.18 +
    (state.influence || 0) * 0.16 +
    (state.prestige || 0) * 0.16 +
    (100 - (state.crisis || 0) * 10) * 0.14
  );
  state.globalRank = Math.max(1, Math.min(100, Math.round(101 - score)));
}

export function grantReward(state, reward = {}, log, message = "Recompensa recebida") {
  const xp = reward.xp || 0;
  const rest = { ...reward };
  delete rest.xp;
  applyEffects(state, rest);
  if (xp) addXP(state, xp, log);
  if (log) log(message, "positive");
}

function checkUnlocks(state, log) {
  for (const unlock of UNLOCKS) {
    if (state.unlocked[unlock.id]) continue;
    if (state.leaderLevel >= unlock.level) {
      state.unlocked[unlock.id] = true;
      if (log) log(`Desbloqueio: ${unlock.title}.`, "positive");
    }
  }
}

function pickMandateGoals() {
  return MANDATE_GOALS.slice(0, 5).map(g => ({...g, done:false}));
}
import { applyEffects, normalizeState } from "./calculations.js";

export function votingPower(state) {
  const coalition = state.coalition || 50;
  const capital = state.politicalCapital || 0;
  const stability = state.stability || 50;
  const media = state.media || 50;
  const corruptionPenalty = (state.corruption || 0) * 0.16;
  return Math.max(0, Math.min(100, coalition * 0.55 + capital * 0.22 + stability * 0.18 + media * 0.05 - corruptionPenalty));
}

export function voteLaw(state, law, log) {
  if (!law) return false;
  state.approvedLaws = Array.isArray(state.approvedLaws) ? state.approvedLaws : [];
  state.approvedLawIds = Array.isArray(state.approvedLawIds) ? state.approvedLawIds : [];
  if (state.approvedLawIds.includes(law.id) || state.approvedLaws.includes(law.title)) {
    log(`Lei já aprovada: ${law.title}.`, "warning");
    return false;
  }
  if ((state.politicalCapital || 0) < law.costPolitical) {
    log("Capital político insuficiente para colocar este projeto em votação.", "warning");
    return false;
  }
  state.politicalCapital -= law.costPolitical;
  const chance = Math.max(5, Math.min(95, votingPower(state) - law.difficulty + 52));
  const roll = Math.random() * 100;
  if (roll <= chance) {
    applyEffects(state, law.effects);
    state.approvedLaws.push(law.title);
    state.approvedLawIds.push(law.id);
    log(`Lei aprovada: ${law.title}. Chance ${Math.round(chance)}%, plenário ${Math.round(roll)}.`, "positive");
    return true;
  }
  applyEffects(state, { coalition: -3, opposition: 3, media: -1, stability: -1 });
  log(`Lei derrotada: ${law.title}. Chance ${Math.round(chance)}%, plenário ${Math.round(roll)}.`, "negative");
  return false;
}

export function updateCongressPressure(state) {
  const pressure = (100 - state.coalition) * 0.25 + state.opposition * 0.18 + state.corruption * 0.16 + state.crisis * 3;
  const target = Math.max(0, Math.min(100, pressure));
  state.congressPressure = Number.isFinite(state.congressPressure)
    ? state.congressPressure + (target - state.congressPressure) * 0.18
    : target;
  // Institutional pressure has consequences, but only at the weekly cadence.
  if (state.congressPressure > 76 && (state.governance?.totalDays || 0) % 7 === 0) {
    state.stability -= 0.45;
    state.politicalCapital -= 0.55;
  }
  normalizeState(state);
}
import { applyEffects, normalizeState } from "./calculations.js";
import { COUNTRIES, POLITICAL_SYSTEMS, LEADER_IDEOLOGIES, DIFFICULTIES, STARTING_SCENARIOS, STRATEGIC_OBJECTIVES, findSetupItem } from "../data/governmentCreationData.js";

export const GOVERNMENT_SETUP_SCHEMA = 1;

export function normalizeGovernmentSelection(selection = {}) {
  return {
    countryId: findSetupItem(COUNTRIES, selection.countryId).id,
    systemId: findSetupItem(POLITICAL_SYSTEMS, selection.systemId).id,
    ideologyId: findSetupItem(LEADER_IDEOLOGIES, selection.ideologyId).id,
    difficultyId: findSetupItem(DIFFICULTIES, selection.difficultyId).id,
    scenarioId: findSetupItem(STARTING_SCENARIOS, selection.scenarioId).id,
    objectiveId: findSetupItem(STRATEGIC_OBJECTIVES, selection.objectiveId).id,
  };
}

export function applyGovernmentCreation(state, selection = {}, translate = key => key) {
  const normalized = normalizeGovernmentSelection(selection);
  const country = findSetupItem(COUNTRIES, normalized.countryId);
  const system = findSetupItem(POLITICAL_SYSTEMS, normalized.systemId);
  const ideology = findSetupItem(LEADER_IDEOLOGIES, normalized.ideologyId);
  const difficulty = findSetupItem(DIFFICULTIES, normalized.difficultyId);
  const scenario = findSetupItem(STARTING_SCENARIOS, normalized.scenarioId);
  const objective = findSetupItem(STRATEGIC_OBJECTIVES, normalized.objectiveId);

  state.country = country.nameKey === "governmentCreation.country.brazil.name" ? "Brasil" : translate(country.nameKey);
  state.countryCode = country.code;
  state.governmentSetup = {
    schema: GOVERNMENT_SETUP_SCHEMA,
    ...normalized,
    difficultyPressureMultiplier: difficulty.pressureMultiplier,
    eventIntervalModifier: difficulty.eventIntervalModifier,
  };

  for (const item of [country, system, ideology, difficulty, scenario, objective]) applyEffects(state, item.effects || {});
  const governance = state.governance;
  for (const item of [system, difficulty, scenario]) {
    const modifiers = item.governance || {};
    for (const [key, value] of Object.entries(modifiers)) {
      governance[key] = Number(governance[key] || 0) + Number(value || 0);
    }
  }
  governance.maxActionPoints = Math.max(5, Math.min(12, Math.round(governance.maxActionPoints)));
  governance.actionPoints = governance.maxActionPoints;
  state.nextEventIn = Math.max(5, Math.round(8 * difficulty.eventIntervalModifier));

  const goals = [...(scenario.goals || []), ...(objective.goals || [])].slice(0, 5);
  state.mandateGoals = goals.map(goal => ({
    ...goal,
    title: translate(goal.titleKey),
    done: false,
  }));
  normalizeState(state);
  return { country, system, ideology, difficulty, scenario, objective };
}

export function getDifficultyProfile(state) {
  return findSetupItem(DIFFICULTIES, state?.governmentSetup?.difficultyId || "standard");
}

export function getGovernmentSetupDefinition(state) {
  const setup = normalizeGovernmentSelection(state?.governmentSetup || {});
  return {
    setup,
    country: findSetupItem(COUNTRIES, setup.countryId),
    system: findSetupItem(POLITICAL_SYSTEMS, setup.systemId),
    ideology: findSetupItem(LEADER_IDEOLOGIES, setup.ideologyId),
    difficulty: findSetupItem(DIFFICULTIES, setup.difficultyId),
    scenario: findSetupItem(STARTING_SCENARIOS, setup.scenarioId),
    objective: findSetupItem(STRATEGIC_OBJECTIVES, setup.objectiveId),
  };
}

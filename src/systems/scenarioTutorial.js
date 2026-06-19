import { clamp } from "../core/dom.js";
import { SCENARIO_PACKS, TUTORIAL_TRACKS_ADVANCED, ONBOARDING_MISSIONS } from "../data/scenarioTutorialData.js";

export function createScenarioTutorialState() {
  return {
    schema: 1,
    activeScenario: "balanced_training",
    activeTrack: "guided_first_mandate",
    tutorialDepth: 48,
    scenarioMastery: 44,
    playerGuidance: 58,
    missionCompletion: 22,
    decisionClarity: 46,
    coachingTrust: 50,
    scenarioPressure: 30,
    replayability: 36,
    learningMomentum: 42,
    lastDiagnosis: { severity:"info", messageKey:"scenario.diagnosis.stable" },
    missions: ONBOARDING_MISSIONS.map(m => ({ id:m.id, progress:0, done:false })),
    history: []
  };
}

export function ensureScenarioTutorialState(state) {
  if (!state.scenarioTutorial || typeof state.scenarioTutorial !== "object") state.scenarioTutorial = createScenarioTutorialState();
  const base = createScenarioTutorialState();
  const st = state.scenarioTutorial;
  for (const [key, value] of Object.entries(base)) if (st[key] === undefined || st[key] === null) st[key] = structuredClone(value);
  st.schema = 1;
  for (const key of ["tutorialDepth","scenarioMastery","playerGuidance","missionCompletion","decisionClarity","coachingTrust","scenarioPressure","replayability","learningMomentum"]) {
    st[key] = clamp(Number.isFinite(Number(st[key])) ? Number(st[key]) : base[key], 0, 100);
  }
  st.activeScenario = SCENARIO_PACKS.some(item => item.id === st.activeScenario) ? st.activeScenario : base.activeScenario;
  st.activeTrack = TUTORIAL_TRACKS_ADVANCED.some(item => item.id === st.activeTrack) ? st.activeTrack : base.activeTrack;
  st.missions = ONBOARDING_MISSIONS.map(mission => {
    const existing = (Array.isArray(st.missions) ? st.missions : []).find(item => item.id === mission.id) || {};
    return { id: mission.id, progress: clamp(Number(existing.progress || 0), 0, 100), done: Boolean(existing.done) };
  });
  st.history = Array.isArray(st.history) ? st.history.slice(-36) : [];
  return st;
}

export function calculateScenarioTutorialSnapshot(state) {
  const st = ensureScenarioTutorialState(state);
  const missionDone = st.missions.filter(m => m.done).length;
  const missionRatio = missionDone / Math.max(1, ONBOARDING_MISSIONS.length);
  const pressureRisk = clamp(st.scenarioPressure * 0.62 + Math.max(0, (state.crisis || 0) - 2) * 5 + Math.max(0, 50 - (state.stability || 50)) * 0.18, 0, 100);
  const readiness = clamp(st.playerGuidance*0.22 + st.decisionClarity*0.18 + st.scenarioMastery*0.20 + st.tutorialDepth*0.14 + st.coachingTrust*0.12 + st.learningMomentum*0.08 + missionRatio*100*0.06 - pressureRisk*0.08, 0, 100);
  const masteryIndex = clamp(st.scenarioMastery*0.35 + st.tutorialDepth*0.22 + st.replayability*0.16 + missionRatio*100*0.20 + st.learningMomentum*0.07, 0, 100);
  const onboardingRisk = clamp(100 - readiness + pressureRisk*0.28 - st.coachingTrust*0.12, 0, 100);
  const retentionIndex = clamp(st.replayability*0.26 + st.learningMomentum*0.25 + missionRatio*100*0.18 + readiness*0.18 + st.coachingTrust*0.13, 0, 100);
  return { missionDone, missionTotal: ONBOARDING_MISSIONS.length, missionRatio, pressureRisk, readiness, masteryIndex, onboardingRisk, retentionIndex };
}

export function scenarioTutorialHealthScore(state) {
  const s = calculateScenarioTutorialSnapshot(state);
  return Math.round(clamp(s.readiness*0.42 + s.masteryIndex*0.28 + s.retentionIndex*0.20 + (100-s.onboardingRisk)*0.10, 0, 100));
}

export function setScenarioPack(state, id) {
  const st = ensureScenarioTutorialState(state);
  const pack = SCENARIO_PACKS.find(item => item.id === id) || SCENARIO_PACKS[0];
  st.activeScenario = pack.id;
  applyScenarioTutorialEffects(state, pack.effects || {});
  return pack;
}

export function setTutorialTrack(state, id) {
  const st = ensureScenarioTutorialState(state);
  const track = TUTORIAL_TRACKS_ADVANCED.find(item => item.id === id) || TUTORIAL_TRACKS_ADVANCED[0];
  st.activeTrack = track.id;
  applyScenarioTutorialEffects(state, track.effects || {});
  return track;
}

export function applyScenarioTutorialEffects(state, effects = {}) {
  const st = ensureScenarioTutorialState(state);
  const direct = ["tutorialDepth","scenarioMastery","playerGuidance","missionCompletion","decisionClarity","coachingTrust","scenarioPressure","replayability","learningMomentum"];
  const legacy = {};
  for (const [key, value] of Object.entries(effects || {})) {
    if (direct.includes(key)) {
      st[key] = clamp(Number(st[key] || 0) + Number(value || 0), 0, 100);
    } else {
      legacy[key] = value;
    }
  }
  const snapshot = calculateScenarioTutorialSnapshot(state);
  st.missionCompletion = clamp(st.missionCompletion*0.78 + snapshot.missionRatio*100*0.22, 0, 100);
  st.lastDiagnosis = diagnose(snapshot);
  return legacy;
}

export function processScenarioTutorialMonth(state, report = {}) {
  const st = ensureScenarioTutorialState(state);
  st.tutorialDepth = clamp(st.tutorialDepth + 0.35 + (st.playerGuidance - 50) * 0.008, 0, 100);
  st.decisionClarity = clamp(st.decisionClarity + (state.governance?.administrativeCapacity || 55) * 0.006 - st.scenarioPressure * 0.006, 0, 100);
  st.scenarioMastery = clamp(st.scenarioMastery + (st.learningMomentum - 45) * 0.018 + 0.25, 0, 100);
  st.coachingTrust = clamp(st.coachingTrust + (st.playerGuidance - 50) * 0.012 + ((state.approval || 50) - 50) * 0.006, 0, 100);
  st.scenarioPressure = clamp(st.scenarioPressure + Math.max(0, (state.crisis || 0) - 2) * 0.18 + Math.max(0, 55 - (state.stability || 55)) * 0.015 - st.scenarioMastery * 0.008, 0, 100);
  st.learningMomentum = clamp(st.learningMomentum + (st.replayability - 40) * 0.01 + (state.leaderXP || state.xp || 0) * 0.0009, 0, 100);
  updateMissionProgress(state);
  const snapshot = calculateScenarioTutorialSnapshot(state);
  st.lastDiagnosis = diagnose(snapshot);
  st.history.push({ m:state.month, y:state.year, health:scenarioTutorialHealthScore(state), readiness:snapshot.readiness, mastery:snapshot.masteryIndex, risk:snapshot.onboardingRisk, missions:snapshot.missionDone });
  st.history = st.history.slice(-36);
  return { health:scenarioTutorialHealthScore(state), readiness:snapshot.readiness, mastery:snapshot.masteryIndex, onboardingRisk:snapshot.onboardingRisk, missions:snapshot.missionDone };
}

export function updateMissionProgress(state) {
  const st = ensureScenarioTutorialState(state);
  st.missions = st.missions.map(entry => {
    const mission = ONBOARDING_MISSIONS.find(m => m.id === entry.id);
    if (!mission) return entry;
    const value = readMissionMetric(state, mission.metric);
    const raw = mission.reverse ? clamp((mission.target / Math.max(0.1, value)) * 100, 0, 100) : clamp((value / Math.max(1, mission.target)) * 100, 0, 100);
    const progress = Math.max(entry.progress || 0, raw);
    return { ...entry, progress, done: entry.done || progress >= 100 };
  });
  st.missionCompletion = clamp(st.missions.filter(m => m.done).length / Math.max(1, st.missions.length) * 100, 0, 100);
  return st.missions;
}

export function readMissionMetric(state, metric) {
  if (metric === "actionPoints") return Number(state.governance?.maxActionPoints || 10) - Number(state.governance?.actionPoints || 10);
  if (metric === "fiscalCredibility") return Number(state.governance?.fiscalCredibility || 55);
  if (metric === "crisis") return Number(state.crisis || 0);
  return Number(state[metric] ?? 0);
}

function diagnose(snapshot) {
  if (snapshot.onboardingRisk > 68) return { severity:"danger", messageKey:"scenario.diagnosis.risk" };
  if (snapshot.readiness < 45) return { severity:"warning", messageKey:"scenario.diagnosis.guidance" };
  if (snapshot.missionDone >= 6) return { severity:"positive", messageKey:"scenario.diagnosis.mastery" };
  if (snapshot.masteryIndex > 62) return { severity:"positive", messageKey:"scenario.diagnosis.learning" };
  return { severity:"info", messageKey:"scenario.diagnosis.stable" };
}

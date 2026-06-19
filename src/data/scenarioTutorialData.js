export const SCENARIO_PACKS = Object.freeze([
  { id:"balanced_training", icon:"⚖️", nameKey:"scenario.pack.balanced.name", textKey:"scenario.pack.balanced.text", difficulty:1, effects:{ scenarioMastery:3, playerGuidance:3, decisionClarity:2, scenarioPressure:-1, approval:1 } },
  { id:"economic_stress", icon:"📉", nameKey:"scenario.pack.economic.name", textKey:"scenario.pack.economic.text", difficulty:2, effects:{ scenarioPressure:6, tutorialDepth:3, decisionClarity:2, economy:-1, marketConfidence:-1 } },
  { id:"institutional_rebuild", icon:"🏛️", nameKey:"scenario.pack.institutional.name", textKey:"scenario.pack.institutional.text", difficulty:2, effects:{ scenarioMastery:2, missionCompletion:2, coachingTrust:2, stability:-1, coalition:-1 } },
  { id:"global_tension", icon:"🌐", nameKey:"scenario.pack.global.name", textKey:"scenario.pack.global.text", difficulty:3, effects:{ scenarioPressure:8, replayability:4, learningMomentum:2, globalTension:2, diplomacy:-1 } }
]);

export const TUTORIAL_TRACKS_ADVANCED = Object.freeze([
  { id:"guided_first_mandate", nameKey:"scenario.track.guided.name", textKey:"scenario.track.guided.text", effects:{ playerGuidance:5, coachingTrust:4, decisionClarity:2 } },
  { id:"fiscal_commander", nameKey:"scenario.track.fiscal.name", textKey:"scenario.track.fiscal.text", effects:{ tutorialDepth:4, scenarioMastery:2, fiscalCredibility:1 } },
  { id:"crisis_commander", nameKey:"scenario.track.crisis.name", textKey:"scenario.track.crisis.text", effects:{ scenarioMastery:3, scenarioPressure:2, recoveryCapacity:1 } },
  { id:"election_specialist", nameKey:"scenario.track.election.name", textKey:"scenario.track.election.text", effects:{ missionCompletion:3, learningMomentum:3, campaign:1 } }
]);

export const ONBOARDING_MISSIONS = Object.freeze([
  { id:"first_decision", icon:"✓", nameKey:"scenario.mission.firstDecision.name", textKey:"scenario.mission.firstDecision.text", metric:"actionPoints", target:8, reverse:true },
  { id:"balanced_budget", icon:"₿", nameKey:"scenario.mission.budget.name", textKey:"scenario.mission.budget.text", metric:"fiscalCredibility", target:55 },
  { id:"control_crisis", icon:"⚡", nameKey:"scenario.mission.crisis.name", textKey:"scenario.mission.crisis.text", metric:"crisis", target:3, reverse:true },
  { id:"institutional_stability", icon:"🏛️", nameKey:"scenario.mission.institutions.name", textKey:"scenario.mission.institutions.text", metric:"stability", target:60 },
  { id:"media_briefing", icon:"🎙️", nameKey:"scenario.mission.media.name", textKey:"scenario.mission.media.text", metric:"media", target:52 },
  { id:"world_presence", icon:"🌐", nameKey:"scenario.mission.world.name", textKey:"scenario.mission.world.text", metric:"influence", target:55 },
  { id:"election_path", icon:"🗳️", nameKey:"scenario.mission.election.name", textKey:"scenario.mission.election.text", metric:"campaign", target:50 },
  { id:"legacy_ready", icon:"★", nameKey:"scenario.mission.legacy.name", textKey:"scenario.mission.legacy.text", metric:"prestige", target:55 }
]);

export const SCENARIO_TUTORIAL_ACTIONS = Object.freeze([
  { id:"decision_briefing", titleKey:"scenario.action.briefing.title", textKey:"scenario.action.briefing.text", cost:8, actionPoints:1, cooldown:14, lagDays:7, effects:{ playerGuidance:8, decisionClarity:6, tutorialDepth:2 } },
  { id:"scenario_rehearsal", titleKey:"scenario.action.rehearsal.title", textKey:"scenario.action.rehearsal.text", cost:16, actionPoints:1, cooldown:24, lagDays:10, effects:{ scenarioMastery:8, learningMomentum:5, scenarioPressure:-2 } },
  { id:"risk_drill", titleKey:"scenario.action.risk.title", textKey:"scenario.action.risk.text", cost:20, actionPoints:2, cooldown:35, lagDays:14, effects:{ scenarioMastery:6, recoveryCapacity:2, crisis:-0.2, stability:1 } },
  { id:"fiscal_tutorial_lab", titleKey:"scenario.action.fiscal.title", textKey:"scenario.action.fiscal.text", cost:26, actionPoints:2, cooldown:40, lagDays:20, effects:{ tutorialDepth:7, decisionClarity:5, fiscalCredibility:2, debt:-0.4 } },
  { id:"diplomacy_simulation", titleKey:"scenario.action.diplomacy.title", textKey:"scenario.action.diplomacy.text", cost:24, actionPoints:2, cooldown:45, lagDays:18, effects:{ scenarioMastery:5, influence:2, diplomacy:2, globalTension:-1 } },
  { id:"campaign_school", titleKey:"scenario.action.campaign.title", textKey:"scenario.action.campaign.text", cost:22, actionPoints:1, cooldown:32, lagDays:12, effects:{ missionCompletion:5, campaign:2, rejection:-1, learningMomentum:4 } },
  { id:"mentor_review", titleKey:"scenario.action.mentor.title", textKey:"scenario.action.mentor.text", cost:12, actionPoints:1, cooldown:21, lagDays:7, effects:{ coachingTrust:8, playerGuidance:4, approval:1 } },
  { id:"scenario_archive", titleKey:"scenario.action.archive.title", textKey:"scenario.action.archive.text", cost:18, actionPoints:1, cooldown:30, lagDays:16, effects:{ replayability:8, tutorialDepth:3, prestige:1 } }
]);

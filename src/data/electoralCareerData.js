export const ELECTORAL_STRATEGIES = Object.freeze([
  { id:"moderate_broad_front", nameKey:"electoral.strategy.moderate.name", textKey:"electoral.strategy.moderate.text", effects:{ partyUnity:2, coalitionEndorsements:4, donorConfidence:1, ethicsRisk:-1 } },
  { id:"popular_mobilization", nameKey:"electoral.strategy.popular.name", textKey:"electoral.strategy.popular.text", effects:{ volunteerNetwork:5, groundGame:3, donorConfidence:-1, undecidedVoters:-2 } },
  { id:"data_driven_campaign", nameKey:"electoral.strategy.data.name", textKey:"electoral.strategy.data.text", effects:{ digitalMobilization:5, debatePreparedness:2, electoralLawCompliance:1, campaignFund:-2 } },
  { id:"institutional_legacy", nameKey:"electoral.strategy.legacy.name", textKey:"electoral.strategy.legacy.text", effects:{ careerMomentum:4, partyUnity:2, coalitionEndorsements:2, ethicsRisk:-2 } }
]);

export const ELECTORAL_SEGMENTS = Object.freeze([
  { id:"workers", icon:"👷", nameKey:"electoral.segment.workers.name", textKey:"electoral.segment.workers.text", base:48, source:"approval" },
  { id:"middle_class", icon:"🏙️", nameKey:"electoral.segment.middle.name", textKey:"electoral.segment.middle.text", base:44, source:"economy" },
  { id:"business", icon:"🏦", nameKey:"electoral.segment.business.name", textKey:"electoral.segment.business.text", base:40, source:"marketConfidence" },
  { id:"youth", icon:"📱", nameKey:"electoral.segment.youth.name", textKey:"electoral.segment.youth.text", base:42, source:"technology" },
  { id:"rural", icon:"🌾", nameKey:"electoral.segment.rural.name", textKey:"electoral.segment.rural.text", base:46, source:"agribusiness" },
  { id:"security_voters", icon:"🛡️", nameKey:"electoral.segment.security.name", textKey:"electoral.segment.security.text", base:43, source:"security" }
]);

export const ELECTORAL_CAREER_ACTIONS = Object.freeze([
  { id:"national_polling_lab", titleKey:"electoral.action.polling.title", textKey:"electoral.action.polling.text", cost:26, actionPoints:1, cooldown:30, lagDays:10, effects:{ pollAccuracy:9, digitalMobilization:3, campaign:2 } },
  { id:"regional_field_offices", titleKey:"electoral.action.field.title", textKey:"electoral.action.field.text", cost:68, actionPoints:2, cooldown:50, lagDays:22, effects:{ groundGame:8, volunteerNetwork:5, regionalMachine:6, campaign:3 } },
  { id:"coalition_convention", titleKey:"electoral.action.convention.title", textKey:"electoral.action.convention.text", cost:42, actionPoints:2, cooldown:55, lagDays:16, effects:{ partyUnity:8, coalitionEndorsements:7, politicalCapital:-2, campaign:2 } },
  { id:"compliance_war_room", titleKey:"electoral.action.compliance.title", textKey:"electoral.action.compliance.text", cost:34, actionPoints:1, cooldown:45, lagDays:12, effects:{ electoralLawCompliance:9, ethicsRisk:-7, corruption:-1, rejection:-1 } },
  { id:"debate_bootcamp", titleKey:"electoral.action.debate.title", textKey:"electoral.action.debate.text", cost:22, actionPoints:1, cooldown:35, lagDays:8, effects:{ debatePreparedness:10, govNarrative:2, campaign:1 } },
  { id:"donor_confidence_round", titleKey:"electoral.action.donor.title", textKey:"electoral.action.donor.text", cost:12, actionPoints:1, cooldown:40, lagDays:14, effects:{ donorConfidence:8, campaignFund:6, marketConfidence:1, ethicsRisk:2 } },
  { id:"undecided_listening_tour", titleKey:"electoral.action.undecided.title", textKey:"electoral.action.undecided.text", cost:58, actionPoints:2, cooldown:60, lagDays:18, effects:{ undecidedVoters:-8, approval:2, rejection:-2, campaign:2 } },
  { id:"legacy_platform_launch", titleKey:"electoral.action.legacy.title", textKey:"electoral.action.legacy.text", cost:74, actionPoints:2, cooldown:70, lagDays:28, effects:{ careerMomentum:9, prestige:3, policyContinuity:5, campaign:4 } }
]);

export const CAREER_LEGACY_MILESTONES = Object.freeze([
  { id:"first100", nameKey:"electoral.milestone.first100.name", textKey:"electoral.milestone.first100.text", day:100 },
  { id:"midterm", nameKey:"electoral.milestone.midterm.name", textKey:"electoral.milestone.midterm.text", day:730 },
  { id:"campaign_window", nameKey:"electoral.milestone.window.name", textKey:"electoral.milestone.window.text", day:1270 },
  { id:"election_day", nameKey:"electoral.milestone.election.name", textKey:"electoral.milestone.election.text", day:1460 }
]);

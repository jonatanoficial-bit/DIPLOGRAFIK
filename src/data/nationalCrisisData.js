export const CRISIS_DOMAINS = Object.freeze([
  { id:"social", icon:"👥", nameKey:"nationalCrisis.domain.social.name", textKey:"nationalCrisis.domain.social.text", pressureKeys:["approval","stability","inequality"], base:42 },
  { id:"economic", icon:"📉", nameKey:"nationalCrisis.domain.economic.name", textKey:"nationalCrisis.domain.economic.text", pressureKeys:["inflation","unemployment","debt"], base:38 },
  { id:"institutional", icon:"⚖️", nameKey:"nationalCrisis.domain.institutional.name", textKey:"nationalCrisis.domain.institutional.text", pressureKeys:["coalition","congressPressure","corruption"], base:36 },
  { id:"security", icon:"🛡️", nameKey:"nationalCrisis.domain.security.name", textKey:"nationalCrisis.domain.security.text", pressureKeys:["security","coupRisk","globalTension"], base:34 },
  { id:"communication", icon:"📡", nameKey:"nationalCrisis.domain.communication.name", textKey:"nationalCrisis.domain.communication.text", pressureKeys:["media","govNarrative","rejection"], base:32 },
  { id:"external", icon:"🌐", nameKey:"nationalCrisis.domain.external.name", textKey:"nationalCrisis.domain.external.text", pressureKeys:["diplomacy","influence","tradeBalance"], base:35 }
]);

export const CRISIS_PROTOCOLS = Object.freeze([
  { id:"preventive_state", nameKey:"nationalCrisis.protocol.preventive.name", textKey:"nationalCrisis.protocol.preventive.text", effects:{ earlyWarning:6, interministerialCoordination:3, publicTrustBuffer:2, fiscalBuffer:-1 } },
  { id:"social_stabilization", nameKey:"nationalCrisis.protocol.social.name", textKey:"nationalCrisis.protocol.social.text", effects:{ socialRelief:7, publicTrustBuffer:2, fiscalBuffer:-3, escalationVelocity:-2 } },
  { id:"institutional_pact", nameKey:"nationalCrisis.protocol.institutional.name", textKey:"nationalCrisis.protocol.institutional.text", effects:{ interministerialCoordination:5, legalShield:5, publicTrustBuffer:1, politicalCost:2 } },
  { id:"security_readiness", nameKey:"nationalCrisis.protocol.security.name", textKey:"nationalCrisis.protocol.security.text", effects:{ operationalReadiness:6, cyberContinuity:4, legalShield:1, publicTrustBuffer:-1 } }
]);

export const NATIONAL_CRISIS_ACTIONS = Object.freeze([
  { id:"early_warning_room", titleKey:"nationalCrisis.action.warning.title", textKey:"nationalCrisis.action.warning.text", cost:28, actionPoints:1, cooldown:35, lagDays:12, effects:{ earlyWarning:9, interministerialCoordination:4, crisis:-0.3, stability:1 } },
  { id:"single_command_center", titleKey:"nationalCrisis.action.command.title", textKey:"nationalCrisis.action.command.text", cost:44, actionPoints:2, cooldown:50, lagDays:18, effects:{ interministerialCoordination:8, operationalReadiness:4, crisis:-0.6, politicalCapital:-1 } },
  { id:"social_buffer_package", titleKey:"nationalCrisis.action.social.title", textKey:"nationalCrisis.action.social.text", cost:95, actionPoints:2, cooldown:70, lagDays:24, effects:{ socialRelief:9, publicTrustBuffer:3, approval:2, crisis:-0.8, debt:0.6 } },
  { id:"public_information_cell", titleKey:"nationalCrisis.action.info.title", textKey:"nationalCrisis.action.info.text", cost:24, actionPoints:1, cooldown:35, lagDays:10, effects:{ publicTrustBuffer:7, misinformationResistance:8, govNarrative:3, media:1 } },
  { id:"legal_continuity_plan", titleKey:"nationalCrisis.action.legal.title", textKey:"nationalCrisis.action.legal.text", cost:36, actionPoints:2, cooldown:55, lagDays:22, effects:{ legalShield:8, continuity:5, stability:2, corruption:-1 } },
  { id:"critical_supply_corridors", titleKey:"nationalCrisis.action.supply.title", textKey:"nationalCrisis.action.supply.text", cost:82, actionPoints:2, cooldown:65, lagDays:28, effects:{ logistics:9, fiscalBuffer:-2, inflation:-0.25, crisis:-0.7, economy:1 } },
  { id:"cyber_resilience_drill", titleKey:"nationalCrisis.action.cyber.title", textKey:"nationalCrisis.action.cyber.text", cost:52, actionPoints:2, cooldown:60, lagDays:20, effects:{ cyberContinuity:9, operationalReadiness:3, intelligence:2, security:1 } },
  { id:"national_recovery_compact", titleKey:"nationalCrisis.action.compact.title", textKey:"nationalCrisis.action.compact.text", cost:120, actionPoints:3, cooldown:90, lagDays:45, effects:{ interministerialCoordination:6, publicTrustBuffer:5, legalShield:4, socialRelief:5, crisis:-1.2, stability:3, coalition:2 } }
]);

export const CRISIS_SCENARIOS = Object.freeze([
  { id:"cost_of_living", nameKey:"nationalCrisis.scenario.cost.name", textKey:"nationalCrisis.scenario.cost.text", trigger:"inflation", threshold:9 },
  { id:"institutional_deadlock", nameKey:"nationalCrisis.scenario.deadlock.name", textKey:"nationalCrisis.scenario.deadlock.text", trigger:"congressPressure", threshold:68 },
  { id:"border_cyber_spillover", nameKey:"nationalCrisis.scenario.border.name", textKey:"nationalCrisis.scenario.border.text", trigger:"globalTension", threshold:66 },
  { id:"trust_collapse", nameKey:"nationalCrisis.scenario.trust.name", textKey:"nationalCrisis.scenario.trust.text", trigger:"approval", threshold:38, invert:true }
]);

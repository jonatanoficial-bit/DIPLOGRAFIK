export const INSTITUTION_PROFILES = [
  { id:"congress", icon:"🏛️", nameKey:"institutions.profile.congress.name", textKey:"institutions.profile.congress.text", autonomy:56, efficiency:48, trust:44, risk:42, weight:1.18 },
  { id:"supreme_court", icon:"⚖️", nameKey:"institutions.profile.supreme.name", textKey:"institutions.profile.supreme.text", autonomy:68, efficiency:46, trust:49, risk:36, weight:1.08 },
  { id:"federalism", icon:"🗺️", nameKey:"institutions.profile.federalism.name", textKey:"institutions.profile.federalism.text", autonomy:58, efficiency:43, trust:46, risk:48, weight:0.96 },
  { id:"audit_court", icon:"🔎", nameKey:"institutions.profile.audit.name", textKey:"institutions.profile.audit.text", autonomy:62, efficiency:51, trust:53, risk:31, weight:0.88 },
  { id:"central_bank", icon:"🏦", nameKey:"institutions.profile.centralBank.name", textKey:"institutions.profile.centralBank.text", autonomy:70, efficiency:57, trust:59, risk:25, weight:0.82 },
  { id:"civil_service", icon:"📋", nameKey:"institutions.profile.civilService.name", textKey:"institutions.profile.civilService.text", autonomy:54, efficiency:45, trust:43, risk:46, weight:0.92 },
  { id:"electoral_court", icon:"🗳️", nameKey:"institutions.profile.electoral.name", textKey:"institutions.profile.electoral.text", autonomy:66, efficiency:55, trust:56, risk:28, weight:0.76 },
  { id:"regulators", icon:"📐", nameKey:"institutions.profile.regulators.name", textKey:"institutions.profile.regulators.text", autonomy:52, efficiency:44, trust:40, risk:44, weight:0.74 }
];

export const INSTITUTIONAL_REFORMS = [
  { id:"balance_pact", nameKey:"institutions.reform.balance.name", textKey:"institutions.reform.balance.text", effects:{ checksAndBalances:1.1, constitutionalTension:-0.8, coalitionDiscipline:-0.25, ruleOfLaw:0.35 }, stance:{ executiveCentralization:0.35, oversight:0.72, judicialRespect:0.70, federalCoordination:0.56 } },
  { id:"executive_agenda", nameKey:"institutions.reform.executive.name", textKey:"institutions.reform.executive.text", effects:{ bureaucraticCapacity:0.9, legislativeBacklog:-0.6, constitutionalTension:0.55, politicalCapital:1.2 }, stance:{ executiveCentralization:0.74, oversight:0.43, judicialRespect:0.49, federalCoordination:0.50 } },
  { id:"federal_cooperation", nameKey:"institutions.reform.federal.name", textKey:"institutions.reform.federal.text", effects:{ federalCoordination:1.4, socialCohesion:0.5, regionalBalance:0.8, treasury:-8 }, stance:{ executiveCentralization:0.45, oversight:0.55, judicialRespect:0.58, federalCoordination:0.78 } },
  { id:"anti_capture_reform", nameKey:"institutions.reform.anticapture.name", textKey:"institutions.reform.anticapture.text", effects:{ transparency:1.3, oversightPressure:0.8, corruption:-0.55, coalition:-0.35 }, stance:{ executiveCentralization:0.42, oversight:0.82, judicialRespect:0.67, federalCoordination:0.52 } }
];

export const INSTITUTIONAL_ACTIONS = [
  {
    id:"appoint_technical_council", titleKey:"institutions.action.technicalCouncil.title", textKey:"institutions.action.technicalCouncil.text", cost:40, actionPoints:1, cooldown:55, lagDays:45,
    effects:{ bureaucraticCapacity:3.4, regulatoryQuality:2.3, politicalCapital:-1.2, marketConfidence:0.7 }
  },
  {
    id:"interbranch_negotiation", titleKey:"institutions.action.interbranch.title", textKey:"institutions.action.interbranch.text", cost:25, actionPoints:2, cooldown:45, lagDays:30,
    effects:{ constitutionalTension:-4.2, checksAndBalances:1.4, coalition:1.8, opposition:-1.1, stability:0.9 }
  },
  {
    id:"public_service_reform", titleKey:"institutions.action.serviceReform.title", textKey:"institutions.action.serviceReform.text", cost:65, actionPoints:2, cooldown:90, lagDays:90,
    effects:{ bureaucraticCapacity:4.5, publicSpending:-0.35, approval:-0.8, economy:0.8, reformMomentum:1.5 }
  },
  {
    id:"transparency_portal", titleKey:"institutions.action.transparency.title", textKey:"institutions.action.transparency.text", cost:35, actionPoints:1, cooldown:60, lagDays:45,
    effects:{ transparency:4.0, corruption:-1.5, media:1.1, trust:1.2, oversightPressure:1.0 }
  },
  {
    id:"federative_roundtable", titleKey:"institutions.action.federative.title", textKey:"institutions.action.federative.text", cost:55, actionPoints:2, cooldown:70, lagDays:60,
    effects:{ federalCoordination:4.2, regionalBalance:1.7, stability:0.8, inequality:-0.35, treasury:-10 }
  },
  {
    id:"judicial_backlog_taskforce", titleKey:"institutions.action.judicialBacklog.title", textKey:"institutions.action.judicialBacklog.text", cost:50, actionPoints:1, cooldown:75, lagDays:75,
    effects:{ judicialBacklog:-5.2, ruleOfLaw:2.1, businessConfidence:1.0, trust:0.8 }
  }
];

export const INSTITUTIONAL_PROTOCOLS = [
  { id:"cpi_wave", nameKey:"institutions.protocol.cpi.name", trigger:"oversightPressure", threshold:72, effects:{ politicalCapital:-0.8, coalition:-0.4, corruption:-0.12 }, severity:"warning" },
  { id:"judicial_conflict", nameKey:"institutions.protocol.judicial.name", trigger:"constitutionalTension", threshold:75, effects:{ stability:-0.7, marketConfidence:-0.35, ruleOfLaw:-0.25 }, severity:"danger" },
  { id:"federal_deadlock", nameKey:"institutions.protocol.federal.name", trigger:"federalCoordination", threshold:32, invert:true, effects:{ approval:-0.45, socialCohesion:-0.35, regionalBalance:-0.35 }, severity:"warning" },
  { id:"bureaucratic_gridlock", nameKey:"institutions.protocol.gridlock.name", trigger:"bureaucraticCapacity", threshold:34, invert:true, effects:{ economy:-0.35, administrativeCapacity:-0.35, legislativeBacklog:0.7 }, severity:"warning" }
];

export const DEFENSE_BRANCHES = [
  { id:"army", icon:"🪖", nameKey:"defense.branch.army.name", textKey:"defense.branch.army.text", readiness:58, logistics:54, modernization:46, morale:61, autonomy:44, pressure:30 },
  { id:"navy", icon:"⚓", nameKey:"defense.branch.navy.name", textKey:"defense.branch.navy.text", readiness:51, logistics:49, modernization:42, morale:58, autonomy:39, pressure:28 },
  { id:"air_space", icon:"✈️", nameKey:"defense.branch.air.name", textKey:"defense.branch.air.text", readiness:54, logistics:50, modernization:45, morale:59, autonomy:41, pressure:31 },
  { id:"cyber_command", icon:"🛰️", nameKey:"defense.branch.cyber.name", textKey:"defense.branch.cyber.text", readiness:47, logistics:52, modernization:55, morale:57, autonomy:36, pressure:43 },
  { id:"border_guard", icon:"🛂", nameKey:"defense.branch.border.name", textKey:"defense.branch.border.text", readiness:50, logistics:48, modernization:40, morale:55, autonomy:37, pressure:46 },
  { id:"civil_defense", icon:"🚨", nameKey:"defense.branch.civil.name", textKey:"defense.branch.civil.text", readiness:49, logistics:44, modernization:38, morale:63, autonomy:35, pressure:34 }
];

export const INTELLIGENCE_DESKS = [
  { id:"domestic", icon:"🏙️", nameKey:"defense.desk.domestic.name", textKey:"defense.desk.domestic.text", coverage:52, reliability:56, risk:34 },
  { id:"foreign", icon:"🌐", nameKey:"defense.desk.foreign.name", textKey:"defense.desk.foreign.text", coverage:45, reliability:51, risk:42 },
  { id:"cyber", icon:"💻", nameKey:"defense.desk.cyber.name", textKey:"defense.desk.cyber.text", coverage:43, reliability:48, risk:49 },
  { id:"financial", icon:"🏦", nameKey:"defense.desk.financial.name", textKey:"defense.desk.financial.text", coverage:50, reliability:52, risk:39 },
  { id:"crisis", icon:"⚡", nameKey:"defense.desk.crisis.name", textKey:"defense.desk.crisis.text", coverage:48, reliability:50, risk:44 },
  { id:"strategic", icon:"♟️", nameKey:"defense.desk.strategic.name", textKey:"defense.desk.strategic.text", coverage:42, reliability:49, risk:45 }
];

export const DEFENSE_DOCTRINES = [
  { id:"deterrence_balance", nameKey:"defense.doctrine.deterrence.name", textKey:"defense.doctrine.deterrence.text", effects:{deterrence:6, defenseReadiness:3, strategicAutonomy:2, globalTension:1, operationalRisk:1} },
  { id:"integrated_security", nameKey:"defense.doctrine.integrated.name", textKey:"defense.doctrine.integrated.text", effects:{borderControl:6, intelCoverage:4, security:2, threatLevel:-2, bureaucracyLoad:1} },
  { id:"cyber_sovereignty", nameKey:"defense.doctrine.cyber.name", textKey:"defense.doctrine.cyber.text", effects:{cyberResilience:8, counterIntel:3, technology:1, intelCoverage:2, treasury:-4} },
  { id:"peacekeeping_projection", nameKey:"defense.doctrine.peace.name", textKey:"defense.doctrine.peace.text", effects:{softPower:3, diplomacy:2, deterrence:2, regionalLeadership:2, defenseReadiness:-1} }
];

export const DEFENSE_INTELLIGENCE_ACTIONS = [
  { id:"joint_wargame", kind:"defense", titleKey:"defense.action.wargame.title", textKey:"defense.action.wargame.text", cost:72, actionPoints:2, cooldown:65, lagDays:30, effects:{defenseReadiness:7, deterrence:4, logistics:3, military:3, operationalRisk:-1} },
  { id:"border_integrated_command", kind:"defense", titleKey:"defense.action.border.title", textKey:"defense.action.border.text", cost:68, actionPoints:2, cooldown:75, lagDays:40, effects:{borderControl:8, security:4, threatLevel:-3, globalTension:-1, logistics:2} },
  { id:"cyber_shield", kind:"intelligence", titleKey:"defense.action.cyber.title", textKey:"defense.action.cyber.text", cost:86, actionPoints:2, cooldown:85, lagDays:45, effects:{cyberResilience:9, counterIntel:4, intelCoverage:2, technology:2, crisis:-0.15} },
  { id:"fusion_center", kind:"intelligence", titleKey:"defense.action.fusion.title", textKey:"defense.action.fusion.text", cost:58, actionPoints:2, cooldown:70, lagDays:35, effects:{intelCoverage:8, counterIntel:3, threatLevel:-2, corruption:-1, intelligence:3} },
  { id:"counter_disinformation", kind:"intelligence", titleKey:"defense.action.disinfo.title", textKey:"defense.action.disinfo.text", cost:44, actionPoints:1, cooldown:55, lagDays:25, effects:{counterIntel:5, mediaNoise:-3, govNarrative:2, publicMood:1, polarization:-2} },
  { id:"defense_industry", kind:"defense", titleKey:"defense.action.industry.title", textKey:"defense.action.industry.text", cost:140, actionPoints:3, cooldown:110, lagDays:75, effects:{strategicAutonomy:8, modernization:7, technology:3, industry:2, debt:0.6} },
  { id:"disaster_network", kind:"defense", titleKey:"defense.action.disaster.title", textKey:"defense.action.disaster.text", cost:62, actionPoints:2, cooldown:70, lagDays:35, effects:{civilPreparedness:8, stability:3, crisis:-0.35, security:2, publicMood:2} },
  { id:"peacekeeping_mission", kind:"defense", titleKey:"defense.action.peacekeeping.title", textKey:"defense.action.peacekeeping.text", cost:52, actionPoints:2, cooldown:90, lagDays:50, effects:{softPower:4, diplomacy:3, regionalLeadership:3, deterrence:2, defenseReadiness:-1} }
];

export const DEFENSE_INCIDENTS = [
  { id:"cyber_probe", titleKey:"defense.incident.cyber.title", textKey:"defense.incident.cyber.text", severity:"warning", effects:{cyberResilience:-2, threatLevel:3, mediaNoise:1} },
  { id:"border_pressure", titleKey:"defense.incident.border.title", textKey:"defense.incident.border.text", severity:"warning", effects:{borderControl:-2, globalTension:2, threatLevel:2} },
  { id:"intel_success", titleKey:"defense.incident.success.title", textKey:"defense.incident.success.text", severity:"positive", effects:{intelCoverage:2, counterIntel:2, threatLevel:-2, stability:1} },
  { id:"supply_gap", titleKey:"defense.incident.supply.title", textKey:"defense.incident.supply.text", severity:"negative", effects:{defenseReadiness:-3, logistics:-2, operationalRisk:3} },
  { id:"joint_success", titleKey:"defense.incident.joint.title", textKey:"defense.incident.joint.text", severity:"positive", effects:{defenseReadiness:2, deterrence:2, military:1} }
];

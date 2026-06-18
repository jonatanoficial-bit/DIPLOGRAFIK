export const GLOBAL_BLOCS = [
  { id:"western", icon:"🦅", nameKey:"worldDiplomacy.bloc.western.name", textKey:"worldDiplomacy.bloc.western.text", weight:24, tension:34, trade:62, alignment:54, risk:32 },
  { id:"asia_pacific", icon:"🐉", nameKey:"worldDiplomacy.bloc.asia.name", textKey:"worldDiplomacy.bloc.asia.text", weight:28, tension:38, trade:76, alignment:49, risk:36 },
  { id:"european", icon:"⭐", nameKey:"worldDiplomacy.bloc.europe.name", textKey:"worldDiplomacy.bloc.europe.text", weight:18, tension:24, trade:58, alignment:57, risk:25 },
  { id:"regional", icon:"🌎", nameKey:"worldDiplomacy.bloc.regional.name", textKey:"worldDiplomacy.bloc.regional.text", weight:14, tension:26, trade:64, alignment:62, risk:28 },
  { id:"eurasian", icon:"🛡", nameKey:"worldDiplomacy.bloc.eurasian.name", textKey:"worldDiplomacy.bloc.eurasian.text", weight:10, tension:56, trade:42, alignment:38, risk:55 },
  { id:"global_south", icon:"🌱", nameKey:"worldDiplomacy.bloc.south.name", textKey:"worldDiplomacy.bloc.south.text", weight:16, tension:30, trade:52, alignment:58, risk:30 }
];

export const DIPLOMACY_DOCTRINES = [
  { id:"balanced_multialignment", nameKey:"worldDiplomacy.doctrine.balance.name", textKey:"worldDiplomacy.doctrine.balance.text", effects:{softPower:3, neutrality:5, blocAlignment:1, globalTrust:2, globalTension:-1} },
  { id:"regional_leadership", nameKey:"worldDiplomacy.doctrine.regional.name", textKey:"worldDiplomacy.doctrine.regional.text", effects:{regionalLeadership:7, negotiationLeverage:3, softPower:2, tradeAccess:1, blocAlignment:-1} },
  { id:"economic_pragmatism", nameKey:"worldDiplomacy.doctrine.economy.name", textKey:"worldDiplomacy.doctrine.economy.text", effects:{tradeAccess:6, negotiationLeverage:4, marketConfidence:1, neutrality:-1, publicScrutiny:1} },
  { id:"values_based", nameKey:"worldDiplomacy.doctrine.values.name", textKey:"worldDiplomacy.doctrine.values.text", effects:{globalTrust:6, softPower:4, pressFreedom:1, tradeAccess:-1, blocAlignment:2} }
];

export const WORLD_AGENDAS = [
  { id:"trade", icon:"🚢", nameKey:"worldDiplomacy.agenda.trade.name", textKey:"worldDiplomacy.agenda.trade.text", pressure:42, opportunity:58, volatility:30 },
  { id:"climate", icon:"🌿", nameKey:"worldDiplomacy.agenda.climate.name", textKey:"worldDiplomacy.agenda.climate.text", pressure:48, opportunity:54, volatility:28 },
  { id:"security", icon:"🛡", nameKey:"worldDiplomacy.agenda.security.name", textKey:"worldDiplomacy.agenda.security.text", pressure:45, opportunity:42, volatility:52 },
  { id:"technology", icon:"🛰", nameKey:"worldDiplomacy.agenda.technology.name", textKey:"worldDiplomacy.agenda.technology.text", pressure:38, opportunity:66, volatility:36 },
  { id:"humanitarian", icon:"🤝", nameKey:"worldDiplomacy.agenda.humanitarian.name", textKey:"worldDiplomacy.agenda.humanitarian.text", pressure:35, opportunity:52, volatility:34 },
  { id:"energy", icon:"⚡", nameKey:"worldDiplomacy.agenda.energy.name", textKey:"worldDiplomacy.agenda.energy.text", pressure:46, opportunity:61, volatility:45 }
];

export const WORLD_DIPLOMACY_ACTIONS = [
  { id:"un_speech", titleKey:"worldDiplomacy.action.un.title", textKey:"worldDiplomacy.action.un.text", cost:18, actionPoints:1, cooldown:45, lagDays:18, effects:{softPower:5, globalTrust:4, publicScrutiny:1, diplomacy:2, prestige:1} },
  { id:"regional_summit", titleKey:"worldDiplomacy.action.regional.title", textKey:"worldDiplomacy.action.regional.text", cost:48, actionPoints:2, cooldown:75, lagDays:30, effects:{regionalLeadership:7, negotiationLeverage:3, tradeAccess:2, globalTension:-2, diplomacy:3} },
  { id:"trade_mission", titleKey:"worldDiplomacy.action.trade.title", textKey:"worldDiplomacy.action.trade.text", cost:42, actionPoints:2, cooldown:70, lagDays:45, effects:{tradeAccess:6, negotiationLeverage:4, tradeBalance:2, marketConfidence:2, diplomacy:1} },
  { id:"peace_mediation", titleKey:"worldDiplomacy.action.peace.title", textKey:"worldDiplomacy.action.peace.text", cost:36, actionPoints:2, cooldown:90, lagDays:35, effects:{softPower:6, globalTrust:5, globalTension:-5, prestige:3, crisis:-0.2} },
  { id:"climate_coalition", titleKey:"worldDiplomacy.action.climate.title", textKey:"worldDiplomacy.action.climate.text", cost:55, actionPoints:2, cooldown:85, lagDays:50, effects:{globalTrust:4, softPower:3, environment:4, tradeAccess:1, treasury:-0} },
  { id:"strategic_non_alignment", titleKey:"worldDiplomacy.action.nonalign.title", textKey:"worldDiplomacy.action.nonalign.text", cost:22, actionPoints:1, cooldown:65, lagDays:25, effects:{neutrality:7, globalTension:-3, blocAlignment:-4, securityRisk:-1, diplomacy:2} },
  { id:"consular_network", titleKey:"worldDiplomacy.action.consular.title", textKey:"worldDiplomacy.action.consular.text", cost:34, actionPoints:1, cooldown:60, lagDays:35, effects:{globalTrust:3, regionalLeadership:3, softPower:2, stability:1, influence:1} },
  { id:"strategic_export_agency", titleKey:"worldDiplomacy.action.export.title", textKey:"worldDiplomacy.action.export.text", cost:64, actionPoints:3, cooldown:100, lagDays:65, effects:{tradeAccess:7, tradeBalance:3, marketConfidence:2, technology:1, economy:1} }
];

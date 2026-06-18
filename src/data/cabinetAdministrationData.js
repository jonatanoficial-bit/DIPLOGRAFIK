export const CABINET_PORTFOLIOS = [
  { id:"civil_house", icon:"🏛️", nameKey:"cabinet.portfolio.civil.name", textKey:"cabinet.portfolio.civil.text", baseline:58, risk:26, priority:"coordination" },
  { id:"economy", icon:"₿", nameKey:"cabinet.portfolio.economy.name", textKey:"cabinet.portfolio.economy.text", baseline:55, risk:32, priority:"fiscal" },
  { id:"justice", icon:"⚖️", nameKey:"cabinet.portfolio.justice.name", textKey:"cabinet.portfolio.justice.text", baseline:53, risk:34, priority:"integrity" },
  { id:"health", icon:"✚", nameKey:"cabinet.portfolio.health.name", textKey:"cabinet.portfolio.health.text", baseline:52, risk:29, priority:"social" },
  { id:"education", icon:"📚", nameKey:"cabinet.portfolio.education.name", textKey:"cabinet.portfolio.education.text", baseline:50, risk:31, priority:"humanCapital" },
  { id:"infrastructure", icon:"🚧", nameKey:"cabinet.portfolio.infrastructure.name", textKey:"cabinet.portfolio.infrastructure.text", baseline:49, risk:37, priority:"delivery" },
  { id:"foreign", icon:"🌐", nameKey:"cabinet.portfolio.foreign.name", textKey:"cabinet.portfolio.foreign.text", baseline:56, risk:24, priority:"diplomacy" },
  { id:"planning", icon:"📊", nameKey:"cabinet.portfolio.planning.name", textKey:"cabinet.portfolio.planning.text", baseline:54, risk:28, priority:"planning" }
];

export const CABINET_STYLES = [
  { id:"coalition_balance", nameKey:"cabinet.style.coalition.name", textKey:"cabinet.style.coalition.text", effects:{ coalition:3, stability:1, appointmentPressure:5, deliveryCapacity:-1 } },
  { id:"technical_cabinet", nameKey:"cabinet.style.technical.name", textKey:"cabinet.style.technical.text", effects:{ cabinetCompetence:5, marketConfidence:2, coalition:-2, appointmentPressure:-3 } },
  { id:"regional_pact", nameKey:"cabinet.style.regional.name", textKey:"cabinet.style.regional.text", effects:{ federalAlignment:5, approval:1, budgetExecution:2, coalition:1 } },
  { id:"mission_delivery", nameKey:"cabinet.style.delivery.name", textKey:"cabinet.style.delivery.text", effects:{ deliveryCapacity:5, administrativeLoad:4, cabinetCohesion:-1, policyCoordination:2 } }
];

export const CABINET_ACTIONS = [
  { id:"performance_contracts", titleKey:"cabinet.action.contracts.title", textKey:"cabinet.action.contracts.text", cost:28, actionPoints:2, cooldown:55, lagDays:45, effects:{ deliveryCapacity:5, budgetExecution:3, cabinetCompetence:2, administrativeLoad:2, treasury:-28 } },
  { id:"ministerial_screening", titleKey:"cabinet.action.screening.title", textKey:"cabinet.action.screening.text", cost:18, actionPoints:1, cooldown:50, lagDays:30, effects:{ scandalExposure:-4, cabinetRisk:-3, corruption:-1, appointmentPressure:2, treasury:-18 } },
  { id:"interministerial_war_room", titleKey:"cabinet.action.warroom.title", textKey:"cabinet.action.warroom.text", cost:34, actionPoints:2, cooldown:60, lagDays:30, effects:{ policyCoordination:6, deliveryCapacity:3, stability:1, administrativeLoad:3, treasury:-34 } },
  { id:"digital_processes", titleKey:"cabinet.action.digital.title", textKey:"cabinet.action.digital.text", cost:46, actionPoints:2, cooldown:75, lagDays:75, effects:{ bureaucraticEfficiency:6, administrativeLoad:-5, budgetExecution:3, services:1, treasury:-46 } },
  { id:"regional_execution_offices", titleKey:"cabinet.action.regional.title", textKey:"cabinet.action.regional.text", cost:52, actionPoints:2, cooldown:80, lagDays:90, effects:{ federalAlignment:6, deliveryCapacity:3, approval:1, regionalBalance:3, treasury:-52 } },
  { id:"cabinet_reshuffle", titleKey:"cabinet.action.reshuffle.title", textKey:"cabinet.action.reshuffle.text", cost:12, actionPoints:3, cooldown:120, lagDays:15, effects:{ cabinetCompetence:4, cabinetCohesion:-5, coalition:-3, scandalExposure:-2, politicalCapital:-4, treasury:-12 } }
];

export const REGIONS = Object.freeze([
  { id:"north", nameKey:"population.region.north", icon:"🌳", populationShare:8.8, populationMillions:18.9, satisfaction:49, income:50, employment:51, education:47, health:46, security:52, infrastructure:43, housing:49, environment:70, priorities:["sanitation","health","infrastructure"] },
  { id:"northeast", nameKey:"population.region.northeast", icon:"☀", populationShare:26.9, populationMillions:57.9, satisfaction:47, income:42, employment:45, education:50, health:49, security:47, infrastructure:50, housing:46, environment:56, priorities:["income","employment","water"] },
  { id:"centralwest", nameKey:"population.region.centralwest", icon:"🌾", populationShare:8.2, populationMillions:17.7, satisfaction:55, income:62, employment:61, education:58, health:56, security:54, infrastructure:59, housing:57, environment:49, priorities:["housing","transport","environment"] },
  { id:"southeast", nameKey:"population.region.southeast", icon:"🏙", populationShare:41.8, populationMillions:90.0, satisfaction:54, income:68, employment:62, education:65, health:63, security:49, infrastructure:67, housing:48, environment:44, priorities:["housing","security","transport"] },
  { id:"south", nameKey:"population.region.south", icon:"🌲", populationShare:14.3, populationMillions:30.8, satisfaction:61, income:71, employment:69, education:70, health:68, security:62, infrastructure:70, housing:62, environment:59, priorities:["aging","health","climate"] }
]);

export const SOCIAL_GROUPS = Object.freeze([
  { id:"low_income", nameKey:"population.group.lowIncome", icon:"🏠", share:35, satisfaction:44, trust:43, incomeSecurity:39, influence:24, priorities:["food","income","housing"] },
  { id:"middle_class", nameKey:"population.group.middleClass", icon:"👨‍👩‍👧", share:36, satisfaction:54, trust:50, incomeSecurity:59, influence:31, priorities:["jobs","taxes","security"] },
  { id:"high_income", nameKey:"population.group.highIncome", icon:"🏢", share:8, satisfaction:62, trust:56, incomeSecurity:86, influence:19, priorities:["stability","market","taxes"] },
  { id:"youth", nameKey:"population.group.youth", icon:"🎓", share:17, satisfaction:49, trust:42, incomeSecurity:45, influence:11, priorities:["jobs","education","housing"] },
  { id:"elderly", nameKey:"population.group.elderly", icon:"🧓", share:15, satisfaction:63, trust:60, incomeSecurity:58, influence:10, priorities:["health","pensions","security"] },
  { id:"rural", nameKey:"population.group.rural", icon:"🚜", share:9, satisfaction:57, trust:55, incomeSecurity:53, influence:5, priorities:["credit","roads","climate"] }
]);

export const POPULATION_POLICIES = Object.freeze([
  { id:"family_health", icon:"⚕", titleKey:"population.policy.health.title", textKey:"population.policy.health.text", cost:55, actionPoints:2, cooldown:45, duration:60, targetMetric:"health", regionCount:2, regionalEffects:{health:5,satisfaction:1.4}, demographicEffects:{lifeExpectancy:0.18}, stateEffects:{approval:0.8,stability:0.3} },
  { id:"full_time_school", icon:"📚", titleKey:"population.policy.education.title", textKey:"population.policy.education.text", cost:70, actionPoints:2, cooldown:60, duration:90, targetMetric:"education", regionCount:2, regionalEffects:{education:5,income:0.8,satisfaction:1.1}, demographicEffects:{literacy:0.35}, stateEffects:{technology:1.2,approval:0.5} },
  { id:"sanitation_acceleration", icon:"💧", titleKey:"population.policy.sanitation.title", textKey:"population.policy.sanitation.text", cost:95, actionPoints:3, cooldown:75, duration:120, targetMetric:"infrastructure", regionCount:2, regionalEffects:{infrastructure:5,health:2,housing:1.5,satisfaction:1.2}, demographicEffects:{sanitation:1.3,hunger:-0.15}, stateEffects:{stability:0.7,economy:0.4} },
  { id:"popular_housing", icon:"🏘", titleKey:"population.policy.housing.title", textKey:"population.policy.housing.text", cost:110, actionPoints:3, cooldown:90, duration:120, targetMetric:"housing", regionCount:2, regionalEffects:{housing:6,income:0.5,satisfaction:1.5}, demographicEffects:{housingDeficit:-0.45,poverty:-0.25}, stateEffects:{approval:1.0,debt:0.35} },
  { id:"regional_jobs", icon:"🧰", titleKey:"population.policy.jobs.title", textKey:"population.policy.jobs.text", cost:80, actionPoints:2, cooldown:60, duration:75, targetMetric:"employment", regionCount:2, regionalEffects:{employment:5,income:3,satisfaction:1.1}, demographicEffects:{poverty:-0.55,extremePoverty:-0.18}, stateEffects:{unemployment:-0.45,economy:0.8} },
  { id:"community_security", icon:"🤝", titleKey:"population.policy.security.title", textKey:"population.policy.security.text", cost:60, actionPoints:2, cooldown:50, duration:60, targetMetric:"security", regionCount:2, regionalEffects:{security:5,satisfaction:1.0}, demographicEffects:{}, stateEffects:{security:1.2,stability:0.6} }
]);

export const NEED_KEYS = Object.freeze({
  sanitation:"population.need.sanitation", health:"population.need.health", infrastructure:"population.need.infrastructure",
  income:"population.need.income", employment:"population.need.employment", water:"population.need.water",
  housing:"population.need.housing", transport:"population.need.transport", environment:"population.need.environment",
  security:"population.need.security", aging:"population.need.aging", climate:"population.need.climate",
  food:"population.need.food", jobs:"population.need.jobs", taxes:"population.need.taxes", stability:"population.need.stability",
  market:"population.need.market", education:"population.need.education", pensions:"population.need.pensions",
  credit:"population.need.credit", roads:"population.need.roads"
});

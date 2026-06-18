export const COUNTRIES = Object.freeze([
  {
    id: "brazil",
    code: "BR",
    flag: "🇧🇷",
    nameKey: "governmentCreation.country.brazil.name",
    descriptionKey: "governmentCreation.country.brazil.description",
    officialNameKey: "governmentCreation.country.brazil.official",
    playable: true,
    effects: { prestige: 1 }
  }
]);

export const POLITICAL_SYSTEMS = Object.freeze([
  {
    id: "coalition_presidentialism",
    icon: "🏛",
    nameKey: "governmentCreation.system.presidential.name",
    descriptionKey: "governmentCreation.system.presidential.description",
    effects: { coalition: 4, politicalCapital: 3, stability: 1 },
    governance: { administrativeCapacity: 1, institutionalResilience: 1, maxActionPoints: 0 }
  },
  {
    id: "semi_presidentialism",
    icon: "⚖",
    nameKey: "governmentCreation.system.semi.name",
    descriptionKey: "governmentCreation.system.semi.description",
    effects: { coalition: 6, stability: 3, politicalCapital: -1 },
    governance: { administrativeCapacity: 5, institutionalResilience: 4, maxActionPoints: 1 }
  },
  {
    id: "parliamentarism",
    icon: "🗳",
    nameKey: "governmentCreation.system.parliamentary.name",
    descriptionKey: "governmentCreation.system.parliamentary.description",
    effects: { coalition: 9, stability: 4, approval: -2, politicalCapital: -3 },
    governance: { administrativeCapacity: 7, institutionalResilience: 5, maxActionPoints: 1 }
  }
]);

export const LEADER_IDEOLOGIES = Object.freeze([
  { id:"pragmatic_center", icon:"◆", nameKey:"governmentCreation.ideology.center.name", descriptionKey:"governmentCreation.ideology.center.description", effects:{ stability:2, coalition:3, approval:1 } },
  { id:"social_democracy", icon:"🤝", nameKey:"governmentCreation.ideology.social.name", descriptionKey:"governmentCreation.ideology.social.description", effects:{ approval:4, inequality:-3, treasury:-40, marketConfidence:-1 } },
  { id:"economic_liberalism", icon:"📈", nameKey:"governmentCreation.ideology.liberal.name", descriptionKey:"governmentCreation.ideology.liberal.description", effects:{ economy:4, marketConfidence:5, treasury:45, approval:-1 } },
  { id:"democratic_conservatism", icon:"🛡", nameKey:"governmentCreation.ideology.conservative.name", descriptionKey:"governmentCreation.ideology.conservative.description", effects:{ security:4, stability:3, loyalty:2, opposition:2 } },
  { id:"green_development", icon:"🌿", nameKey:"governmentCreation.ideology.green.name", descriptionKey:"governmentCreation.ideology.green.description", effects:{ environment:8, technology:3, approval:2, treasury:-25 } }
]);

export const DIFFICULTIES = Object.freeze([
  { id:"civic", icon:"★", nameKey:"governmentCreation.difficulty.civic.name", descriptionKey:"governmentCreation.difficulty.civic.description", effects:{ treasury:220, approval:7, stability:6, politicalCapital:8 }, governance:{ maxActionPoints:2, administrativeCapacity:7, institutionalResilience:5 }, eventIntervalModifier:1.25, pressureMultiplier:0.78 },
  { id:"standard", icon:"★★", nameKey:"governmentCreation.difficulty.standard.name", descriptionKey:"governmentCreation.difficulty.standard.description", effects:{}, governance:{ maxActionPoints:0 }, eventIntervalModifier:1, pressureMultiplier:1 },
  { id:"strategist", icon:"★★★", nameKey:"governmentCreation.difficulty.strategist.name", descriptionKey:"governmentCreation.difficulty.strategist.description", effects:{ treasury:-120, approval:-3, politicalCapital:-4, crisis:1 }, governance:{ maxActionPoints:-1, administrativeCapacity:-4 }, eventIntervalModifier:0.88, pressureMultiplier:1.12 },
  { id:"statesman", icon:"★★★★", nameKey:"governmentCreation.difficulty.statesman.name", descriptionKey:"governmentCreation.difficulty.statesman.description", effects:{ treasury:-220, approval:-6, stability:-5, politicalCapital:-8, debt:6, crisis:2 }, governance:{ maxActionPoints:-2, administrativeCapacity:-7, institutionalResilience:-5 }, eventIntervalModifier:0.72, pressureMultiplier:1.28 }
]);

export const STARTING_SCENARIOS = Object.freeze([
  {
    id:"balanced_2026", icon:"⚙", nameKey:"governmentCreation.scenario.balanced.name", descriptionKey:"governmentCreation.scenario.balanced.description",
    effects:{}, governance:{},
    goals:[
      { id:"balanced_approval", titleKey:"governmentCreation.goal.approval", target:"approval", threshold:65, reward:{xp:30,prestige:2} },
      { id:"balanced_stability", titleKey:"governmentCreation.goal.stability", target:"stability", threshold:68, reward:{xp:30,politicalCapital:5} },
      { id:"balanced_economy", titleKey:"governmentCreation.goal.economy", target:"economy", threshold:65, reward:{xp:30,treasury:60} }
    ]
  },
  {
    id:"fiscal_emergency", icon:"💸", nameKey:"governmentCreation.scenario.fiscal.name", descriptionKey:"governmentCreation.scenario.fiscal.description",
    effects:{ treasury:-300, debt:34, inflation:4.2, economy:-10, marketConfidence:-14, unemployment:3.2 }, governance:{ fiscalCredibility:-18 },
    goals:[
      { id:"fiscal_debt", titleKey:"governmentCreation.goal.debt", target:"debt", threshold:70, reverse:true, reward:{xp:45,prestige:3} },
      { id:"fiscal_inflation", titleKey:"governmentCreation.goal.inflation", target:"inflation", threshold:8, reverse:true, reward:{xp:40,treasury:90} },
      { id:"fiscal_confidence", titleKey:"governmentCreation.goal.market", target:"marketConfidence", threshold:62, reward:{xp:40,politicalCapital:5} }
    ]
  },
  {
    id:"social_unrest", icon:"📣", nameKey:"governmentCreation.scenario.social.name", descriptionKey:"governmentCreation.scenario.social.description",
    effects:{ approval:-18, stability:-16, unemployment:4, inequality:9, crisis:3, coalition:-6 }, governance:{ socialCohesion:-18, institutionalResilience:-8 },
    goals:[
      { id:"social_approval", titleKey:"governmentCreation.goal.approval", target:"approval", threshold:58, reward:{xp:45,prestige:3} },
      { id:"social_cohesion", titleKey:"governmentCreation.goal.cohesion", target:"socialCohesion", threshold:60, governanceTarget:true, reward:{xp:45,politicalCapital:6} },
      { id:"social_crisis", titleKey:"governmentCreation.goal.crisis", target:"crisis", threshold:2, reverse:true, reward:{xp:40,stability:4} }
    ]
  },
  {
    id:"global_tension", icon:"🌐", nameKey:"governmentCreation.scenario.global.name", descriptionKey:"governmentCreation.scenario.global.description",
    effects:{ globalTension:31, diplomacy:-9, influence:8, tradeBalance:-7, military:4, crisis:1 }, governance:{ institutionalResilience:-3 },
    goals:[
      { id:"global_tension_goal", titleKey:"governmentCreation.goal.tension", target:"globalTension", threshold:55, reverse:true, reward:{xp:45,prestige:4} },
      { id:"global_influence", titleKey:"governmentCreation.goal.influence", target:"influence", threshold:68, reward:{xp:40,prestige:5} },
      { id:"global_diplomacy", titleKey:"governmentCreation.goal.diplomacy", target:"diplomacy", threshold:62, reward:{xp:40,politicalCapital:4} }
    ]
  }
]);

export const STRATEGIC_OBJECTIVES = Object.freeze([
  { id:"prosperity", icon:"💰", nameKey:"governmentCreation.objective.prosperity.name", descriptionKey:"governmentCreation.objective.prosperity.description", effects:{ economy:2, marketConfidence:2 }, goals:[{id:"objective_gdp",titleKey:"governmentCreation.goal.economy",target:"economy",threshold:72,reward:{xp:45,treasury:100}},{id:"objective_jobs",titleKey:"governmentCreation.goal.unemployment",target:"unemployment",threshold:7.5,reverse:true,reward:{xp:40,prestige:3}}] },
  { id:"social_pact", icon:"🤲", nameKey:"governmentCreation.objective.social.name", descriptionKey:"governmentCreation.objective.social.description", effects:{ approval:2, inequality:-2 }, goals:[{id:"objective_approval",titleKey:"governmentCreation.goal.approval",target:"approval",threshold:70,reward:{xp:45,prestige:4}},{id:"objective_inequality",titleKey:"governmentCreation.goal.inequality",target:"inequality",threshold:45,reverse:true,reward:{xp:40,politicalCapital:5}}] },
  { id:"institutional_strength", icon:"🏛", nameKey:"governmentCreation.objective.institution.name", descriptionKey:"governmentCreation.objective.institution.description", effects:{ stability:2, corruption:-2 }, goals:[{id:"objective_stability",titleKey:"governmentCreation.goal.stability",target:"stability",threshold:75,reward:{xp:45,prestige:4}},{id:"objective_corruption",titleKey:"governmentCreation.goal.corruption",target:"corruption",threshold:15,reverse:true,reward:{xp:40,politicalCapital:6}}] },
  { id:"global_leadership", icon:"🌍", nameKey:"governmentCreation.objective.global.name", descriptionKey:"governmentCreation.objective.global.description", effects:{ influence:3, diplomacy:3 }, goals:[{id:"objective_influence",titleKey:"governmentCreation.goal.influence",target:"influence",threshold:72,reward:{xp:45,prestige:5}},{id:"objective_treaties",titleKey:"governmentCreation.goal.prestige",target:"prestige",threshold:65,reward:{xp:40,politicalCapital:4}}] },
  { id:"green_power", icon:"♻", nameKey:"governmentCreation.objective.green.name", descriptionKey:"governmentCreation.objective.green.description", effects:{ environment:5, technology:2 }, goals:[{id:"objective_environment",titleKey:"governmentCreation.goal.environment",target:"environment",threshold:75,reward:{xp:45,prestige:4}},{id:"objective_technology",titleKey:"governmentCreation.goal.technology",target:"technology",threshold:60,reward:{xp:40,treasury:70}}] }
]);

export function findSetupItem(collection, id) {
  return collection.find(item => item.id === id) || collection[0];
}

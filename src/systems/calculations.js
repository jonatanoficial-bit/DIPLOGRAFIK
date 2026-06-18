import { clamp } from "../core/dom.js";
export { clamp };

export function applyEffects(state, effects = {}) {
  for (const [key, value] of Object.entries(effects)) {
    state[key] = (state[key] ?? 0) + value;
  }
  normalizeState(state);
}

export function normalizeState(state) {
  const pctKeys = [
    "approval","economy","stability","influence","coalition","media","elite","military",
    "diplomacy","intelligence","technology","environment","prestige","opposition","security","coupRisk",
    "marketConfidence","industry","agribusiness","services","energy","campaign","rejection","loyalty",
    "govNarrative","globalTension","politicalCapital","congressPressure","tradeBalance","inequality"
  ];
  for (const key of pctKeys) state[key] = clamp(Number.isFinite(Number(state[key])) ? Number(state[key]) : 50, 0, 100);
  state.corruption = clamp(state.corruption ?? 20, 0, 100);
  state.crisis = clamp(state.crisis ?? 0, 0, 10);
  state.debt = clamp(state.debt ?? 45, 0, 160);
  state.inflation = clamp(state.inflation ?? 5, 0, 45);
  state.unemployment = clamp(state.unemployment ?? 9, 0, 35);
  state.interestRate = clamp(state.interestRate ?? 10.5, 0, 30);
  state.taxBurden = clamp(state.taxBurden ?? 33, 5, 60);
  state.publicSpending = clamp(state.publicSpending ?? 36, 5, 70);
  state.treasury = Math.max(0, Math.round(Number.isFinite(Number(state.treasury)) ? Number(state.treasury) : 0));
  state.gdp = Math.max(0, Math.round(Number.isFinite(Number(state.gdp)) ? Number(state.gdp) : 0));
  state.softCurrency = Math.max(0, Math.round(Number.isFinite(Number(state.softCurrency)) ? Number(state.softCurrency) : 0));
  state.premiumCurrency = Math.max(0, Math.round(Number.isFinite(Number(state.premiumCurrency)) ? Number(state.premiumCurrency) : 0));
  state.leaderXP = Math.max(0, Number.isFinite(Number(state.leaderXP)) ? Number(state.leaderXP) : 0);
  state.xp = Math.max(0, Number.isFinite(Number(state.xp)) ? Number(state.xp) : state.leaderXP);
  state.leaderLevel = Math.max(1, Math.round(Number.isFinite(Number(state.leaderLevel)) ? Number(state.leaderLevel) : 1));
  state.level = Math.max(1, Math.round(Number.isFinite(Number(state.level)) ? Number(state.level) : state.leaderLevel));

  if (state.deepEconomy && typeof state.deepEconomy === "object") {
    const deepPctKeys = ["productivity","privateInvestment","publicInvestment","businessConfidence","consumerConfidence","realWage","costOfLiving","householdDebt","creditAvailability","informalEconomy","povertyEconomic","middleClassSecurity"];
    for (const key of deepPctKeys) state.deepEconomy[key] = clamp(Number.isFinite(Number(state.deepEconomy[key])) ? Number(state.deepEconomy[key]) : 50, 0, 100);
    state.deepEconomy.realGdp = Math.max(350, Math.round(Number.isFinite(Number(state.deepEconomy.realGdp)) ? Number(state.deepEconomy.realGdp) : state.gdp || 2100));
    state.deepEconomy.nominalGdp = Math.max(state.deepEconomy.realGdp, Math.round(Number.isFinite(Number(state.deepEconomy.nominalGdp)) ? Number(state.deepEconomy.nominalGdp) : state.deepEconomy.realGdp));
    state.deepEconomy.exchangeRate = clamp(Number.isFinite(Number(state.deepEconomy.exchangeRate)) ? Number(state.deepEconomy.exchangeRate) : 5.15, 2.2, 9.5);
    state.deepEconomy.reserves = clamp(Number.isFinite(Number(state.deepEconomy.reserves)) ? Number(state.deepEconomy.reserves) : 338, 40, 650);
    state.deepEconomy.riskPremium = clamp(Number.isFinite(Number(state.deepEconomy.riskPremium)) ? Number(state.deepEconomy.riskPremium) : 3.9, 0.8, 14);
    state.deepEconomy.monthlyHistory = Array.isArray(state.deepEconomy.monthlyHistory) ? state.deepEconomy.monthlyHistory.slice(-48) : [];
    state.deepEconomy.quarterHistory = Array.isArray(state.deepEconomy.quarterHistory) ? state.deepEconomy.quarterHistory.slice(-24) : [];
  }

  if (state.budgetTax && typeof state.budgetTax === "object") {
    const btPctKeys = ["taxCompliance","evasionRate","spendingEfficiency","mandatorySpendingRatio","discretionarySpace","capitalExecution","regionalBalance","fiscalTransparency","earmarkingPressure","budgetCredibility"];
    for (const key of btPctKeys) state.budgetTax[key] = clamp(Number.isFinite(Number(state.budgetTax[key])) ? Number(state.budgetTax[key]) : 50, 0, 100);
    state.budgetTax.administrativeCost = clamp(Number.isFinite(Number(state.budgetTax.administrativeCost)) ? Number(state.budgetTax.administrativeCost) : 14, 2, 35);
    state.budgetTax.history = Array.isArray(state.budgetTax.history) ? state.budgetTax.history.slice(-36) : [];
  }

  if (state.institutions && typeof state.institutions === "object") {
    const instPctKeys = ["ruleOfLaw","checksAndBalances","judicialIndependence","bureaucraticCapacity","regulatoryQuality","federalCoordination","transparency","oversightPressure","constitutionalTension","coalitionDiscipline","legislativeBacklog","judicialBacklog","appointmentBalance","trust","institutionalScore"];
    for (const key of instPctKeys) state.institutions[key] = clamp(Number.isFinite(Number(state.institutions[key])) ? Number(state.institutions[key]) : 50, 0, 100);
    state.institutions.reformMomentum = clamp(Number.isFinite(Number(state.institutions.reformMomentum)) ? Number(state.institutions.reformMomentum) : 0, -25, 25);
    state.institutions.history = Array.isArray(state.institutions.history) ? state.institutions.history.slice(-36) : [];
    state.institutions.institutions = Array.isArray(state.institutions.institutions) ? state.institutions.institutions.map(item => ({
      ...item,
      autonomy: clamp(Number.isFinite(Number(item.autonomy)) ? Number(item.autonomy) : 50, 0, 100),
      efficiency: clamp(Number.isFinite(Number(item.efficiency)) ? Number(item.efficiency) : 50, 0, 100),
      trust: clamp(Number.isFinite(Number(item.trust)) ? Number(item.trust) : 50, 0, 100),
      risk: clamp(Number.isFinite(Number(item.risk)) ? Number(item.risk) : 35, 0, 100)
    })) : [];
  }

  if (state.cabinetAdministration && typeof state.cabinetAdministration === "object") {
    const cabPctKeys = ["cabinetCohesion","cabinetCompetence","policyCoordination","deliveryCapacity","bureaucraticEfficiency","administrativeLoad","appointmentPressure","budgetExecution","federalAlignment","scandalExposure","cabinetRisk"];
    for (const key of cabPctKeys) state.cabinetAdministration[key] = clamp(Number.isFinite(Number(state.cabinetAdministration[key])) ? Number(state.cabinetAdministration[key]) : 50, 0, 100);
    state.cabinetAdministration.history = Array.isArray(state.cabinetAdministration.history) ? state.cabinetAdministration.history.slice(-36) : [];
    state.cabinetAdministration.portfolios = Array.isArray(state.cabinetAdministration.portfolios) ? state.cabinetAdministration.portfolios.map(item => ({
      ...item,
      performance: clamp(Number.isFinite(Number(item.performance)) ? Number(item.performance) : 50, 0, 100),
      risk: clamp(Number.isFinite(Number(item.risk)) ? Number(item.risk) : 30, 0, 100),
      vacancies: clamp(Number.isFinite(Number(item.vacancies)) ? Number(item.vacancies) : 0, 0, 5),
      delivery: clamp(Number.isFinite(Number(item.delivery)) ? Number(item.delivery) : 50, 0, 100),
      politicalCost: clamp(Number.isFinite(Number(item.politicalCost)) ? Number(item.politicalCost) : 20, 0, 100)
    })) : [];
  }


  if (state.mediaPublic && typeof state.mediaPublic === "object") {
    const mediaPctKeys = ["publicMood","trust","pressFreedom","narrativeControl","messageDiscipline","policyClarity","socialReach","regionalReach","polarization","disinformationRisk","scandalAttention","hostility","agendaPressure"];
    for (const key of mediaPctKeys) state.mediaPublic[key] = clamp(Number.isFinite(Number(state.mediaPublic[key])) ? Number(state.mediaPublic[key]) : 50, 0, 100);
    state.mediaPublic.history = Array.isArray(state.mediaPublic.history) ? state.mediaPublic.history.slice(-36) : [];
    state.mediaPublic.outlets = Array.isArray(state.mediaPublic.outlets) ? state.mediaPublic.outlets.map(item => ({
      ...item,
      reach: clamp(Number.isFinite(Number(item.reach)) ? Number(item.reach) : 50, 0, 100),
      trust: clamp(Number.isFinite(Number(item.trust)) ? Number(item.trust) : 50, 0, 100),
      stance: clamp(Number.isFinite(Number(item.stance)) ? Number(item.stance) : 50, 0, 100),
      volatility: clamp(Number.isFinite(Number(item.volatility)) ? Number(item.volatility) : 30, 0, 100),
      pressure: clamp(Number.isFinite(Number(item.pressure)) ? Number(item.pressure) : 35, 0, 100),
      relationship: clamp(Number.isFinite(Number(item.relationship)) ? Number(item.relationship) : 50, 0, 100)
    })) : [];
    state.mediaPublic.agendas = Array.isArray(state.mediaPublic.agendas) ? state.mediaPublic.agendas.map(item => ({
      ...item,
      pressure: clamp(Number.isFinite(Number(item.pressure)) ? Number(item.pressure) : 35, 0, 100),
      salience: clamp(Number.isFinite(Number(item.salience)) ? Number(item.salience) : 40, 0, 100),
      trend: clamp(Number.isFinite(Number(item.trend)) ? Number(item.trend) : 0, -25, 25)
    })) : [];
  }

}

export function voteChance(state) {
  return clamp(
    state.approval * 0.36 +
    state.economy * 0.18 +
    state.stability * 0.12 +
    state.media * 0.14 +
    state.campaign * 0.14 +
    state.prestige * 0.06 -
    state.corruption * 0.08 -
    state.crisis * 2
  );
}

export function impeachmentRisk(state) {
  return clamp(
    (100 - state.approval) * 0.22 +
    (100 - state.stability) * 0.24 +
    (100 - state.coalition) * 0.22 +
    state.corruption * 0.18 +
    state.crisis * 4
  );
}

export function commercialScore(state) {
  return Math.round((state.approval + state.economy + state.stability + state.influence + state.prestige) / 5);
}
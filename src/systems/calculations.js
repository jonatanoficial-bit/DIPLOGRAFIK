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
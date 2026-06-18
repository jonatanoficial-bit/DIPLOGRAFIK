import { applyEffects, normalizeState } from "./calculations.js";
import { AI_COUNTRIES, INTERNATIONAL_EVENTS } from "../data/diplomacyData.js";

export function ensureDiplomacyState(state) {
  if (!state.aiCountries || !state.aiCountries.length) {
    state.aiCountries = AI_COUNTRIES.map(c => ({...c}));
  }
  if (typeof state.globalTension !== "number") state.globalTension = 35;
  if (!state.treaties) state.treaties = [];
  if (!state.diplomaticLog) state.diplomaticLog = [];
}

export function relationStatus(value) {
  if (value >= 72) return "aliado";
  if (value >= 55) return "positivo";
  if (value >= 40) return "neutro";
  if (value >= 25) return "tenso";
  return "hostil";
}

export function countryReaction(state, country, actionType) {
  ensureDiplomacyState(state);
  let delta = 0;
  let tension = 0;

  if (actionType === "deal") {
    delta = 7 + (country.tradeNeed || 50) / 25;
    tension = -1;
  } else if (actionType === "sanction") {
    delta = -12;
    tension = 5;
  } else if (actionType === "defense") {
    delta = country.personality === "militarizada" ? 4 : 2;
    tension = country.bloc === "Ocidente" ? 1 : 3;
  } else if (actionType === "climate") {
    delta = country.interests.includes("clima") ? 9 : 3;
    tension = -2;
  } else if (actionType === "tech") {
    delta = country.interests.includes("tecnologia") ? 8 : 3;
    tension = 0;
  }

  country.relation = Math.max(0, Math.min(100, country.relation + delta));
  country.tension = Math.max(0, Math.min(100, (country.tension || 30) + tension));
  state.globalTension = Math.max(0, Math.min(100, state.globalTension + tension * 0.6));
  normalizeState(state);
}

export function applyTreaty(state, countryId, treaty, log) {
  ensureDiplomacyState(state);
  const country = state.aiCountries.find(c => c.id === countryId);
  if (!country || !treaty) return false;
  const treatyKey = `${country.id}:${treaty.id}`;
  if (state.treaties.some(item => item.key === treatyKey || (item.country === country.name && item.treaty === treaty.title))) {
    log(`Tratado já ativo com ${country.name}: ${treaty.title}.`, "warning");
    return false;
  }
  if ((treaty.cost || 0) > state.treasury) {
    log("Tesouro insuficiente para assinar tratado.", "negative");
    return false;
  }
  state.treasury -= treaty.cost || 0;
  applyEffects(state, treaty.effects);
  countryReaction(state, country, treaty.id);
  state.treaties.unshift({ key: treatyKey, countryId: country.id, treatyId: treaty.id, country: country.name, treaty: treaty.title, day: state.day, month: state.month, year: state.year });
  state.treaties = state.treaties.slice(0, 24);
  log(`Tratado assinado com ${country.name}: ${treaty.title}.`, "positive");
  return true;
}

export function diplomaticAction(state, action, log) {
  ensureDiplomacyState(state);
  if (!action) return;
  if ((action.cost || 0) > state.treasury) {
    log("Tesouro insuficiente para ação diplomática.", "negative");
    return;
  }
  applyEffects(state, action.effects);
  state.aiCountries.forEach(c => {
    if (action.id === "summit") c.relation = Math.min(100, c.relation + 2);
    if (action.id === "neutrality") c.tension = Math.max(0, c.tension - 3);
    if (action.id === "mercosul" && (c.id === "arg")) c.relation = Math.min(100, c.relation + 8);
  });
  log(`Diplomacia: ${action.title} executada.`, "positive");
}

export function processDiplomacyAI(state, log) {
  ensureDiplomacyState(state);

  for (const country of state.aiCountries) {
    const personalityPressure =
      country.personality === "dominante" ? 0.35 :
      country.personality === "estratégica" ? 0.25 :
      country.personality === "militarizada" ? 0.45 :
      country.personality === "instável" ? 0.55 : 0.22;

    const tradeEffect = ((state.tradeBalance || 50) - 50) * 0.015;
    const tensionEffect = ((state.globalTension || 35) - 35) * personalityPressure * 0.03;
    const diplomacyEffect = ((state.diplomacy || 50) - 50) * 0.018;

    country.relation = Math.max(0, Math.min(100, country.relation + tradeEffect + diplomacyEffect - tensionEffect));
    country.tension = Math.max(0, Math.min(100, country.tension + tensionEffect - diplomacyEffect * 0.4));
  }

  if (state.day % 17 === 0) {
    const ev = INTERNATIONAL_EVENTS[Math.floor(Math.random() * INTERNATIONAL_EVENTS.length)];
    applyEffects(state, ev.effects);
    log(`Cenário internacional: ${ev.title}. ${ev.text}`, ev.type);
  }
}

export function globalRisk(state) {
  ensureDiplomacyState(state);
  const avgTension = state.aiCountries.reduce((s,c)=>s+(c.tension||0),0) / state.aiCountries.length;
  return Math.max(0, Math.min(100, avgTension * 0.55 + (state.globalTension || 35) * 0.45));
}
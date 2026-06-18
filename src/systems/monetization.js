import { applyEffects, normalizeState } from "./calculations.js";
import { STORE_ITEMS, REWARDED_ADS, PREMIUM_PACKS } from "../data/monetizationData.js";
import { addXP } from "./progression.js";

export function ensureMonetizationState(state) {
  if (typeof state.softCurrency !== "number") state.softCurrency = 180;
  if (typeof state.premiumCurrency !== "number") state.premiumCurrency = 0;
  if (!state.ownedItems) state.ownedItems = {};
  if (!state.adCooldowns) state.adCooldowns = {};
  if (!state.purchaseHistory) state.purchaseHistory = [];
  if (!state.cosmeticTheme) state.cosmeticTheme = "default";
}

export function tickMonetizationCooldowns(state) {
  ensureMonetizationState(state);
  for (const key of Object.keys(state.adCooldowns)) {
    state.adCooldowns[key] -= 1;
    if (state.adCooldowns[key] <= 0) delete state.adCooldowns[key];
  }
}

export function buyStoreItem(state, itemId, log) {
  ensureMonetizationState(state);
  const item = STORE_ITEMS.find(i => i.id === itemId);
  if (!item) return false;

  if (state.ownedItems[item.id] && item.type === "cosmetic") {
    applyCosmetic(state, item);
    if (log) log(`Cosmético aplicado: ${item.title}.`, "positive");
    return true;
  }

  const needsSoft = item.priceSoft || 0;
  const needsPremium = item.pricePremium || 0;

  if (state.softCurrency < needsSoft || state.premiumCurrency < needsPremium) {
    if (log) log("Moedas insuficientes para este item.", "warning");
    return false;
  }

  state.softCurrency -= needsSoft;
  state.premiumCurrency -= needsPremium;
  state.ownedItems[item.id] = true;

  applyStoreEffects(state, item, log);

  state.purchaseHistory.unshift({
    type:"store",
    title:item.title,
    day:state.day,
    month:state.month,
    year:state.year
  });
  state.purchaseHistory = state.purchaseHistory.slice(0, 12);

  if (log) log(`Loja: ${item.title} adquirido.`, "positive");
  normalizeState(state);
  return true;
}

export function claimRewardedAd(state, adId, log) {
  ensureMonetizationState(state);
  const ad = REWARDED_ADS.find(a => a.id === adId);
  if (!ad) return false;

  if (state.adCooldowns[ad.id]) {
    if (log) log("Anúncio recompensado ainda está em cooldown.", "warning");
    return false;
  }

  applyReward(state, ad.reward, log);
  state.adCooldowns[ad.id] = ad.cooldown || 1;

  state.purchaseHistory.unshift({
    type:"rewarded_ad",
    title:ad.title,
    day:state.day,
    month:state.month,
    year:state.year
  });
  state.purchaseHistory = state.purchaseHistory.slice(0, 12);

  if (log) log(`Anúncio recompensado simulado: ${ad.title}.`, "positive");
  normalizeState(state);
  return true;
}

export function simulatePremiumPack(state, packId, log) {
  ensureMonetizationState(state);
  const pack = PREMIUM_PACKS.find(p => p.id === packId);
  if (!pack) return false;

  state.premiumCurrency += pack.premium;
  state.softCurrency += pack.soft;

  state.purchaseHistory.unshift({
    type:"premium_pack_simulated",
    title:pack.title,
    day:state.day,
    month:state.month,
    year:state.year
  });
  state.purchaseHistory = state.purchaseHistory.slice(0, 12);

  if (log) log(`Compra simulada: ${pack.title}. Nenhuma cobrança real foi feita.`, "info");
  return true;
}

export function monetizationScore(state) {
  ensureMonetizationState(state);
  const owned = Object.keys(state.ownedItems).length;
  const retention = state.retentionStreak || 1;
  return Math.min(100, Math.round(owned * 8 + retention * 4 + (state.leaderLevel || 1) * 3));
}

function applyStoreEffects(state, item, log) {
  if (item.effects?.cosmeticTheme || item.effects?.founderBadge) {
    applyCosmetic(state, item);
    return;
  }
  const effects = { ...(item.effects || {}) };
  const xp = effects.xp || 0;
  delete effects.xp;
  applyEffects(state, effects);
  if (xp) addXP(state, xp, log);
}

function applyCosmetic(state, item) {
  if (item.effects?.cosmeticTheme) state.cosmeticTheme = item.effects.cosmeticTheme;
  if (item.effects?.founderBadge) state.founderBadge = true;
}

function applyReward(state, reward = {}, log) {
  const effects = { ...reward };
  const soft = effects.softCurrency || 0;
  const premium = effects.premiumCurrency || 0;
  const xp = effects.xp || 0;
  delete effects.softCurrency;
  delete effects.premiumCurrency;
  delete effects.xp;

  state.softCurrency += soft;
  state.premiumCurrency += premium;
  applyEffects(state, effects);
  if (xp) addXP(state, xp, log);
}
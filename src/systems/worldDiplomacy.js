import { clamp } from "./calculations.js";
import { GLOBAL_BLOCS, WORLD_AGENDAS, DIPLOMACY_DOCTRINES } from "../data/worldDiplomacyData.js";

export const WORLD_DIPLOMACY_SCHEMA = 1;

function cloneRecords(items) {
  return items.map(item => ({ ...item }));
}

function value(state, key, fallback = 50) {
  const raw = Number(state?.[key]);
  return Number.isFinite(raw) ? raw : fallback;
}

function clampMetric(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(v) || 0));
}

export function createWorldDiplomacyState() {
  return {
    schema: WORLD_DIPLOMACY_SCHEMA,
    activeDoctrine: "balanced_multialignment",
    softPower: 50,
    globalTrust: 52,
    tradeAccess: 55,
    negotiationLeverage: 50,
    regionalLeadership: 48,
    blocAlignment: 44,
    neutrality: 58,
    securityRisk: 36,
    publicScrutiny: 34,
    multilateralScore: 50,
    diplomaticCapital: 42,
    blocs: cloneRecords(GLOBAL_BLOCS),
    agendas: cloneRecords(WORLD_AGENDAS),
    history: [],
    lastDiagnosis: { severity:"info", messageKey:"worldDiplomacy.diagnosis.stable" }
  };
}

export function ensureWorldDiplomacyState(state) {
  if (!state.worldDiplomacy || typeof state.worldDiplomacy !== "object") state.worldDiplomacy = createWorldDiplomacyState();
  const world = state.worldDiplomacy;
  const defaults = createWorldDiplomacyState();
  for (const [key, fallback] of Object.entries(defaults)) {
    if (world[key] === undefined || world[key] === null) world[key] = structuredClone(fallback);
  }
  world.schema = WORLD_DIPLOMACY_SCHEMA;
  world.blocs = reconcileCollection(world.blocs, GLOBAL_BLOCS);
  world.agendas = reconcileCollection(world.agendas, WORLD_AGENDAS);
  normalizeWorldDiplomacyState(state);
  return world;
}

function reconcileCollection(existing, defaults) {
  const map = new Map(Array.isArray(existing) ? existing.map(item => [item.id, item]) : []);
  return defaults.map(item => ({ ...item, ...(map.get(item.id) || {}) }));
}

export function normalizeWorldDiplomacyState(state) {
  const world = state.worldDiplomacy || createWorldDiplomacyState();
  ["softPower","globalTrust","tradeAccess","negotiationLeverage","regionalLeadership","blocAlignment","neutrality","securityRisk","publicScrutiny","multilateralScore","diplomaticCapital"].forEach(key => {
    world[key] = clampMetric(world[key]);
  });
  world.blocs = (world.blocs || []).map(bloc => ({ ...bloc, tension:clampMetric(bloc.tension), trade:clampMetric(bloc.trade), alignment:clampMetric(bloc.alignment), risk:clampMetric(bloc.risk) }));
  world.agendas = (world.agendas || []).map(agenda => ({ ...agenda, pressure:clampMetric(agenda.pressure), opportunity:clampMetric(agenda.opportunity), volatility:clampMetric(agenda.volatility) }));
  world.history = Array.isArray(world.history) ? world.history.slice(-36) : [];
  state.worldDiplomacy = world;
  return world;
}

export function calculateWorldDiplomacySnapshot(state) {
  const world = ensureWorldDiplomacyState(state);
  const blocCount = Math.max(1, world.blocs.length);
  const avgBlocTension = world.blocs.reduce((sum, b) => sum + Number(b.tension || 0), 0) / blocCount;
  const avgBlocAlignment = world.blocs.reduce((sum, b) => sum + Number(b.alignment || 0), 0) / blocCount;
  const avgTrade = world.blocs.reduce((sum, b) => sum + Number(b.trade || 0), 0) / blocCount;
  const avgAgendaPressure = world.agendas.reduce((sum, a) => sum + Number(a.pressure || 0), 0) / Math.max(1, world.agendas.length);
  const leverage = clampMetric(world.negotiationLeverage * 0.42 + world.softPower * 0.22 + world.tradeAccess * 0.18 + value(state, "influence") * 0.18);
  const diplomaticRisk = clampMetric(avgBlocTension * 0.34 + value(state, "globalTension", 35) * 0.28 + world.securityRisk * 0.22 + avgAgendaPressure * 0.16 - world.neutrality * 0.18);
  const multilateralScore = clampMetric(world.globalTrust * 0.3 + world.softPower * 0.25 + world.regionalLeadership * 0.18 + avgBlocAlignment * 0.15 + value(state, "diplomacy") * 0.12 - diplomaticRisk * 0.08);
  const tradeWindow = clampMetric(avgTrade * 0.32 + world.tradeAccess * 0.32 + value(state, "tradeBalance") * 0.22 + value(state, "marketConfidence") * 0.14 - diplomaticRisk * 0.07);
  return { avgBlocTension, avgBlocAlignment, avgTrade, avgAgendaPressure, leverage, diplomaticRisk, multilateralScore, tradeWindow };
}

export function worldDiplomacyHealthScore(state) {
  const world = ensureWorldDiplomacyState(state);
  const s = calculateWorldDiplomacySnapshot(state);
  return Math.round(clampMetric(
    world.softPower * 0.18 + world.globalTrust * 0.16 + s.multilateralScore * 0.2 + s.tradeWindow * 0.16 + world.regionalLeadership * 0.12 + world.neutrality * 0.08 + (100 - s.diplomaticRisk) * 0.1
  ));
}

export function setWorldDiplomacyDoctrine(state, doctrineId) {
  const world = ensureWorldDiplomacyState(state);
  const selected = DIPLOMACY_DOCTRINES.find(item => item.id === doctrineId) || DIPLOMACY_DOCTRINES[0];
  world.activeDoctrine = selected.id;
  applyWorldDiplomacyEffects(state, selected.effects || {});
  return selected;
}

export function applyWorldDiplomacyEffects(state, effects = {}) {
  const world = ensureWorldDiplomacyState(state);
  const legacy = {};
  for (const [key, amount] of Object.entries(effects || {})) {
    const delta = Number(amount) || 0;
    if (["softPower","globalTrust","tradeAccess","negotiationLeverage","regionalLeadership","blocAlignment","neutrality","securityRisk","publicScrutiny","multilateralScore","diplomaticCapital"].includes(key)) {
      world[key] = clampMetric((world[key] || 0) + delta);
    } else if (key === "pressFreedom" && state.mediaPublic) {
      state.mediaPublic.pressFreedom = clampMetric(Number(state.mediaPublic.pressFreedom || 50) + delta);
    } else {
      legacy[key] = (legacy[key] || 0) + delta;
    }
  }
  normalizeWorldDiplomacyState(state);
  return legacy;
}

export function processWorldDiplomacyMonth(state, economyReport = {}) {
  const world = ensureWorldDiplomacyState(state);
  const snapshot = calculateWorldDiplomacySnapshot(state);
  const doctrine = DIPLOMACY_DOCTRINES.find(item => item.id === world.activeDoctrine) || DIPLOMACY_DOCTRINES[0];
  const fiscalStress = Number(economyReport.monthlyBalance || 0) < -80 ? 1.3 : 1;
  const economySignal = (value(state, "tradeBalance") - 50) * 0.025 + (value(state, "marketConfidence") - 50) * 0.018;
  const mediaSignal = ((value(state, "media") + value(state, "govNarrative") + value(state, "prestige")) / 3 - 50) * 0.025;
  const institutionSignal = ((state.institutions?.legalCertainty || value(state, "stability")) - 50) * 0.018;

  world.softPower = clampMetric(world.softPower + mediaSignal + value(state, "diplomacy") * 0.006 - snapshot.diplomaticRisk * 0.006);
  world.globalTrust = clampMetric(world.globalTrust + institutionSignal + mediaSignal * 0.4 - value(state, "corruption", 20) * 0.01);
  world.tradeAccess = clampMetric(world.tradeAccess + economySignal + (value(state, "technology") - 50) * 0.01 - fiscalStress * 0.15);
  world.negotiationLeverage = clampMetric(world.negotiationLeverage + (world.softPower - 50) * 0.01 + (world.tradeAccess - 50) * 0.012 + (value(state, "influence") - 50) * 0.012);
  world.regionalLeadership = clampMetric(world.regionalLeadership + (value(state, "diplomacy") - 50) * 0.014 + (value(state, "stability") - 50) * 0.008 + (world.activeDoctrine === "regional_leadership" ? 0.35 : 0));
  world.securityRisk = clampMetric(world.securityRisk + (value(state, "globalTension", 35) - 35) * 0.015 + (value(state, "military") < 35 ? 0.35 : -0.05));
  world.publicScrutiny = clampMetric(world.publicScrutiny + Math.max(0, world.blocAlignment - 62) * 0.015 + Math.max(0, value(state, "corruption") - 35) * 0.01 - world.globalTrust * 0.002);
  world.multilateralScore = snapshot.multilateralScore;

  world.blocs.forEach(bloc => {
    const blocTilt = world.activeDoctrine === "balanced_multialignment" ? 0.2 : world.activeDoctrine === "values_based" && ["western","european"].includes(bloc.id) ? 0.35 : world.activeDoctrine === "regional_leadership" && bloc.id === "regional" ? 0.55 : 0.05;
    bloc.alignment = clampMetric(Number(bloc.alignment || 50) + blocTilt + (world.softPower - 50) * 0.008 - (world.neutrality - 50) * 0.003);
    bloc.trade = clampMetric(Number(bloc.trade || 50) + (world.tradeAccess - 50) * 0.006 + (value(state, "tradeBalance") - 50) * 0.006);
    bloc.tension = clampMetric(Number(bloc.tension || 30) + (value(state, "globalTension", 35) - 35) * 0.01 - world.neutrality * 0.004 + (bloc.id === "eurasian" ? 0.05 : 0));
    bloc.risk = clampMetric(Number(bloc.risk || 30) + (bloc.tension - 45) * 0.012 - (bloc.alignment - 50) * 0.006);
  });

  world.agendas.forEach(agenda => {
    agenda.pressure = clampMetric(Number(agenda.pressure || 40) + (snapshot.diplomaticRisk - 45) * 0.008 + (agenda.id === "trade" ? (50 - value(state, "tradeBalance")) * 0.01 : 0));
    agenda.opportunity = clampMetric(Number(agenda.opportunity || 50) + (world.negotiationLeverage - 50) * 0.009 + (world.tradeAccess - 50) * 0.006);
    agenda.volatility = clampMetric(Number(agenda.volatility || 35) + (value(state, "globalTension", 35) - 35) * 0.012 - world.globalTrust * 0.003);
  });

  diagnoseWorldDiplomacy(state);
  world.history.push({ y: state.year, m: state.month === 1 ? 12 : state.month - 1, health: worldDiplomacyHealthScore(state), risk: Number(snapshot.diplomaticRisk.toFixed(1)), trust: Number(world.globalTrust.toFixed(1)), trade: Number(snapshot.tradeWindow.toFixed(1)), doctrine: world.activeDoctrine });
  world.history = world.history.slice(-36);
  normalizeWorldDiplomacyState(state);
  return { health: worldDiplomacyHealthScore(state), risk: snapshot.diplomaticRisk, trust: world.globalTrust, tradeWindow: snapshot.tradeWindow, doctrine: doctrine.id };
}

function diagnoseWorldDiplomacy(state) {
  const world = ensureWorldDiplomacyState(state);
  const s = calculateWorldDiplomacySnapshot(state);
  if (s.diplomaticRisk > 72) world.lastDiagnosis = { severity:"negative", messageKey:"worldDiplomacy.diagnosis.risk" };
  else if (world.tradeAccess < 34) world.lastDiagnosis = { severity:"warning", messageKey:"worldDiplomacy.diagnosis.trade" };
  else if (world.globalTrust < 36) world.lastDiagnosis = { severity:"warning", messageKey:"worldDiplomacy.diagnosis.trust" };
  else if (worldDiplomacyHealthScore(state) > 68) world.lastDiagnosis = { severity:"positive", messageKey:"worldDiplomacy.diagnosis.strong" };
  else world.lastDiagnosis = { severity:"info", messageKey:"worldDiplomacy.diagnosis.stable" };
}

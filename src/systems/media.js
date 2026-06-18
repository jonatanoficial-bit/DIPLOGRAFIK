import { applyEffects, normalizeState, clamp } from "./calculations.js";
import { HEADLINE_TEMPLATES, MEDIA_OUTLET_PROFILES, MEDIA_DOCTRINES, MEDIA_AGENDAS } from "../data/mediaData.js";

export const MEDIA_PUBLIC_SCHEMA = 1;
export const MEDIA_HISTORY_LIMIT = 36;
export const HEADLINE_LIMIT = 14;

function n(value, fallback = 50) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bounded(value, min = 0, max = 100) {
  return clamp(n(value), min, max);
}

export function createMediaPublicState() {
  return {
    schema: MEDIA_PUBLIC_SCHEMA,
    activeDoctrine: "transparent_accountability",
    publicMood: 56,
    trust: 52,
    pressFreedom: 58,
    narrativeControl: 45,
    messageDiscipline: 50,
    policyClarity: 49,
    socialReach: 52,
    regionalReach: 48,
    polarization: 42,
    disinformationRisk: 36,
    scandalAttention: 28,
    hostility: 42,
    agendaPressure: 38,
    lastDiagnosis: { severity: "info", messageKey: "media.diagnosis.normal" },
    outlets: MEDIA_OUTLET_PROFILES.map(item => ({
      id: item.id,
      reach: item.reach,
      trust: item.trust,
      stance: item.stance,
      volatility: item.volatility,
      pressure: Math.max(20, Math.round(item.volatility * 0.8)),
      relationship: Math.round((item.stance + item.trust) / 2)
    })),
    agendas: MEDIA_AGENDAS.map(item => ({ id: item.id, pressure: 35, salience: 40, trend: 0 })),
    history: []
  };
}

export function ensureMediaPublicState(state) {
  const defaults = createMediaPublicState();
  const existing = state.mediaPublic && typeof state.mediaPublic === "object" ? state.mediaPublic : {};
  state.mediaPublic = existing;
  for (const [key, value] of Object.entries(defaults)) {
    if (existing[key] === undefined || existing[key] === null) existing[key] = structuredClone(value);
  }
  existing.schema = MEDIA_PUBLIC_SCHEMA;
  existing.activeDoctrine = MEDIA_DOCTRINES.some(item => item.id === existing.activeDoctrine) ? existing.activeDoctrine : "transparent_accountability";
  const pctKeys = ["publicMood","trust","pressFreedom","narrativeControl","messageDiscipline","policyClarity","socialReach","regionalReach","polarization","disinformationRisk","scandalAttention","hostility","agendaPressure"];
  for (const key of pctKeys) existing[key] = bounded(existing[key], 0, 100);
  existing.history = Array.isArray(existing.history) ? existing.history.slice(-MEDIA_HISTORY_LIMIT) : [];
  existing.lastDiagnosis = existing.lastDiagnosis && typeof existing.lastDiagnosis === "object" ? existing.lastDiagnosis : { severity:"info", messageKey:"media.diagnosis.normal" };
  const outletsById = new Map(Array.isArray(existing.outlets) ? existing.outlets.map(item => [item.id, item]) : []);
  existing.outlets = MEDIA_OUTLET_PROFILES.map(profile => {
    const current = outletsById.get(profile.id) || {};
    return {
      id: profile.id,
      reach: bounded(current.reach ?? profile.reach),
      trust: bounded(current.trust ?? profile.trust),
      stance: bounded(current.stance ?? profile.stance),
      volatility: bounded(current.volatility ?? profile.volatility),
      pressure: bounded(current.pressure ?? Math.max(20, profile.volatility * 0.8)),
      relationship: bounded(current.relationship ?? (profile.stance + profile.trust) / 2)
    };
  });
  const agendasById = new Map(Array.isArray(existing.agendas) ? existing.agendas.map(item => [item.id, item]) : []);
  existing.agendas = MEDIA_AGENDAS.map(profile => {
    const current = agendasById.get(profile.id) || {};
    return {
      id: profile.id,
      pressure: bounded(current.pressure ?? 35),
      salience: bounded(current.salience ?? 40),
      trend: clamp(n(current.trend, 0), -25, 25)
    };
  });
  state.headlines = Array.isArray(state.headlines) ? state.headlines.slice(0, HEADLINE_LIMIT) : [];
  return existing;
}

export function calculateMediaSnapshot(state) {
  const media = ensureMediaPublicState(state);
  const outletTrust = media.outlets.reduce((sum, item) => sum + n(item.trust) * (n(item.reach) / 100), 0) / Math.max(1, media.outlets.reduce((sum, item) => sum + n(item.reach) / 100, 0));
  const outletPressure = media.outlets.reduce((sum, item) => sum + n(item.pressure) * (n(item.reach) / 100), 0) / Math.max(1, media.outlets.reduce((sum, item) => sum + n(item.reach) / 100, 0));
  const agendaPressure = media.agendas.reduce((sum, item) => sum + n(item.pressure), 0) / Math.max(1, media.agendas.length);
  const mood = bounded(
    n(state.approval) * 0.26 +
    n(state.media) * 0.12 +
    n(state.economy) * 0.13 +
    n(state.stability) * 0.13 +
    n(state.prestige) * 0.08 +
    media.trust * 0.12 +
    media.policyClarity * 0.07 +
    media.regionalReach * 0.04 +
    media.socialReach * 0.03 -
    n(state.crisis, 0) * 1.6 -
    n(state.corruption, 20) * 0.07 -
    media.polarization * 0.05 -
    media.disinformationRisk * 0.04
  );
  const hostility = bounded(
    (100 - n(state.media)) * 0.20 +
    n(state.opposition) * 0.16 +
    n(state.corruption) * 0.16 +
    n(state.crisis, 0) * 2.6 +
    Math.max(0, n(state.inflation, 6) - 8) * 1.15 +
    media.polarization * 0.12 +
    media.disinformationRisk * 0.11 +
    media.scandalAttention * 0.11 +
    outletPressure * 0.10 -
    media.pressFreedom * 0.04 -
    media.messageDiscipline * 0.04
  );
  const credibility = bounded(media.trust * 0.22 + media.pressFreedom * 0.15 + media.policyClarity * 0.15 + outletTrust * 0.20 + n(state.govNarrative, 50) * 0.12 + media.messageDiscipline * 0.10 - media.disinformationRisk * 0.10 - media.polarization * 0.04);
  const agendaRisk = bounded(agendaPressure * 0.42 + hostility * 0.24 + media.scandalAttention * 0.18 + Math.max(0, n(state.congressPressure, 35) - 50) * 0.12 + Math.max(0, n(state.debt, 48) - 60) * 0.05);
  return { publicMood:mood, hostility, credibility, agendaPressure, agendaRisk, outletTrust, outletPressure };
}

export function publicMood(state) {
  return Math.round(calculateMediaSnapshot(state).publicMood);
}

export function mediaHostility(state) {
  return Math.round(calculateMediaSnapshot(state).hostility);
}

export function mediaHealthScore(state) {
  const snapshot = calculateMediaSnapshot(state);
  return Math.round(bounded(snapshot.publicMood * 0.33 + snapshot.credibility * 0.31 + (100 - snapshot.hostility) * 0.21 + (100 - snapshot.agendaRisk) * 0.15));
}

export function setMediaDoctrine(state, id) {
  const media = ensureMediaPublicState(state);
  const doctrine = MEDIA_DOCTRINES.find(item => item.id === id) || MEDIA_DOCTRINES[0];
  media.activeDoctrine = doctrine.id;
  const legacyEffects = applyMediaPublicEffects(state, doctrine.effects || {});
  return { ...doctrine, legacyEffects };
}

export function applyMediaPublicEffects(state, effects = {}) {
  const media = ensureMediaPublicState(state);
  const legacy = {};
  const mediaMap = {
    publicMood:"publicMood", trust:"trust", pressFreedom:"pressFreedom", narrativeControl:"narrativeControl",
    messageDiscipline:"messageDiscipline", policyClarity:"policyClarity", socialReach:"socialReach", regionalReach:"regionalReach",
    polarization:"polarization", disinformationRisk:"disinformationRisk", scandalAttention:"scandalAttention", hostility:"hostility", agendaPressure:"agendaPressure"
  };
  const institutionMap = { transparency:"transparency", constitutionalTension:"constitutionalTension", institutionalResilience:"institutionalResilience" };
  const cabinetMap = { deliveryCapacity:"deliveryCapacity" };
  const budgetMap = { fiscalCredibility:"budgetCredibility" };
  for (const [key, raw] of Object.entries(effects || {})) {
    const amount = n(raw, 0);
    if (mediaMap[key]) {
      media[mediaMap[key]] = bounded(media[mediaMap[key]] + amount);
    } else if (institutionMap[key]) {
      if (key === "institutionalResilience") {
        state.governance = state.governance || {};
        state.governance.institutionalResilience = bounded(n(state.governance.institutionalResilience, 60) + amount);
      } else {
        state.institutions = state.institutions || {};
        state.institutions[institutionMap[key]] = bounded(n(state.institutions[institutionMap[key]], 50) + amount);
      }
    } else if (cabinetMap[key]) {
      state.cabinetAdministration = state.cabinetAdministration || {};
      state.cabinetAdministration[cabinetMap[key]] = bounded(n(state.cabinetAdministration[cabinetMap[key]], 50) + amount);
    } else if (budgetMap[key]) {
      state.budgetTax = state.budgetTax || {};
      state.budgetTax[budgetMap[key]] = bounded(n(state.budgetTax[budgetMap[key]], 50) + amount);
    } else {
      legacy[key] = (legacy[key] || 0) + amount;
    }
  }
  recalculateMediaOutlets(state);
  recalculateAgendas(state);
  normalizeState(state);
  return legacy;
}

export function processMediaPublicMonth(state, economyReport = {}) {
  const media = ensureMediaPublicState(state);
  const budget = state.budgetTax || {};
  const institutions = state.institutions || {};
  const cabinet = state.cabinetAdministration || {};
  const economyStress = Math.max(0, 52 - n(state.economy, 50)) * 0.035 + Math.max(0, n(state.inflation, 6) - 8) * 0.11 + Math.max(0, n(state.unemployment, 9) - 11) * 0.08;
  const crisisStress = n(state.crisis, 0) * 0.42 + Math.max(0, n(state.congressPressure, 35) - 55) * 0.018;
  const integrityStress = n(state.corruption, 20) * 0.018 + Math.max(0, n(media.scandalAttention, 25) - 45) * 0.026;
  media.publicMood = bounded(media.publicMood + (n(state.approval, 50) - 50) * 0.026 + (n(state.economy, 50) - 50) * 0.018 + (n(cabinet.deliveryCapacity, 50) - 50) * 0.012 - economyStress - crisisStress * 0.25);
  media.trust = bounded(media.trust + (n(institutions.transparency, 50) - 50) * 0.018 + (n(budget.fiscalTransparency, 50) - 50) * 0.012 + (media.pressFreedom - 50) * 0.012 - media.disinformationRisk * 0.012 - integrityStress * 0.38);
  media.policyClarity = bounded(media.policyClarity + (n(cabinet.policyCoordination, 50) - 50) * 0.018 + (n(cabinet.cabinetCompetence, 50) - 50) * 0.014 - media.polarization * 0.01);
  media.messageDiscipline = bounded(media.messageDiscipline + (n(cabinet.policyCoordination, 50) - 50) * 0.014 - Math.max(0, n(cabinet.scandalExposure, 24) - 45) * 0.018 - crisisStress * 0.08);
  media.disinformationRisk = bounded(media.disinformationRisk + media.polarization * 0.018 + Math.max(0, n(state.opposition, 38) - 55) * 0.024 + crisisStress * 0.14 - media.trust * 0.018 - media.pressFreedom * 0.008);
  media.polarization = bounded(media.polarization + Math.max(0, n(state.opposition, 38) - 50) * 0.014 + Math.max(0, media.narrativeControl - 60) * 0.018 - media.regionalReach * 0.011 - media.trust * 0.008);
  media.scandalAttention = bounded(media.scandalAttention + Math.max(0, n(state.corruption, 22) - 30) * 0.04 + Math.max(0, n(cabinet.scandalExposure, 24) - 35) * 0.045 - media.messageDiscipline * 0.012 - media.trust * 0.008);
  recalculateMediaOutlets(state);
  recalculateAgendas(state, economyReport);
  const snapshot = calculateMediaSnapshot(state);
  media.hostility = bounded(snapshot.hostility);
  media.agendaPressure = bounded(snapshot.agendaPressure);
  media.lastDiagnosis = diagnoseMedia(snapshot, media);
  media.history.push({ y: state.year, m: state.month, mood: Number(snapshot.publicMood.toFixed(2)), hostility: Number(snapshot.hostility.toFixed(2)), credibility: Number(snapshot.credibility.toFixed(2)), risk: Number(snapshot.agendaRisk.toFixed(2)) });
  media.history = media.history.slice(-MEDIA_HISTORY_LIMIT);
  state.media = bounded(n(state.media, 50) + (snapshot.credibility - 50) * 0.018 - Math.max(0, snapshot.hostility - 60) * 0.018 + (media.pressFreedom - 50) * 0.006);
  state.govNarrative = bounded(n(state.govNarrative, 50) + (media.narrativeControl - 50) * 0.018 + (media.messageDiscipline - 50) * 0.014 - Math.max(0, media.disinformationRisk - 55) * 0.018);
  state.approval = bounded(n(state.approval, 50) + (snapshot.publicMood - 50) * 0.012 - Math.max(0, snapshot.agendaRisk - 68) * 0.01);
  state.stability = bounded(n(state.stability, 50) + (snapshot.credibility - 50) * 0.006 - Math.max(0, media.polarization - 60) * 0.014);
  return snapshot;
}

function recalculateMediaOutlets(state) {
  const media = ensureMediaPublicState(state);
  media.outlets = media.outlets.map(item => {
    const profile = MEDIA_OUTLET_PROFILES.find(p => p.id === item.id) || {};
    const marketBias = profile.id === "mercadonews" ? (n(state.marketConfidence, 50) - 50) * 0.045 : 0;
    const socialBias = profile.typeKey === "media.type.social" || profile.typeKey === "media.type.influencer" ? (media.socialReach - 50) * 0.04 + (media.polarization - 50) * 0.035 : 0;
    const publicBias = (media.publicMood - 50) * 0.025 + (media.trust - 50) * 0.02 + marketBias + socialBias;
    const trust = bounded(n(item.trust, profile.trust || 55) + (media.pressFreedom - 50) * 0.018 + (media.trust - 50) * 0.016 - media.disinformationRisk * 0.01);
    const pressure = bounded(n(item.pressure, 35) + (media.scandalAttention - 35) * 0.018 + (media.polarization - 50) * 0.014 + Math.max(0, n(state.corruption, 20) - 30) * 0.02 - media.messageDiscipline * 0.008);
    const relationship = bounded(n(item.relationship, profile.stance || 50) + publicBias - pressure * 0.012 + media.narrativeControl * 0.006);
    return { ...item, trust, pressure, relationship };
  });
}

function recalculateAgendas(state, economyReport = {}) {
  const media = ensureMediaPublicState(state);
  const institutions = state.institutions || {};
  const cabinet = state.cabinetAdministration || {};
  const values = {
    economy: 100 - n(state.economy, 50) + Math.max(0, n(state.inflation, 6) - 8) * 2 + Math.max(0, n(state.unemployment, 9) - 10) * 1.2,
    integrity: n(state.corruption, 20) + media.scandalAttention * 0.7 + Math.max(0, n(cabinet.scandalExposure, 24) - 30) * 0.8,
    security: 100 - n(state.security, 52) + n(state.crisis, 0) * 6,
    social: n(state.inequality, 52) * 0.55 + Math.max(0, 55 - n(state.approval, 50)) * 0.9,
    institutions: Math.max(0, n(institutions.constitutionalTension, 35)) * 0.75 + Math.max(0, n(state.congressPressure, 35) - 45) * 0.8,
    cabinet: Math.max(0, n(cabinet.cabinetRisk, 31)) * 0.72 + Math.max(0, 56 - n(cabinet.deliveryCapacity, 51)) * 0.9
  };
  media.agendas = media.agendas.map(item => {
    const raw = bounded(values[item.id] ?? 38);
    const previous = n(item.pressure, 35);
    return { ...item, pressure: bounded(previous * 0.72 + raw * 0.28), salience: bounded(n(item.salience, 40) * 0.64 + raw * 0.36), trend: clamp(raw - previous, -25, 25) };
  });
}

function diagnoseMedia(snapshot, media) {
  if (snapshot.hostility > 72 || snapshot.agendaRisk > 74) return { severity:"danger", messageKey:"media.diagnosis.hostile" };
  if (media.disinformationRisk > 65 || media.polarization > 68) return { severity:"warning", messageKey:"media.diagnosis.noise" };
  if (snapshot.credibility > 66 && snapshot.publicMood > 60) return { severity:"positive", messageKey:"media.diagnosis.credible" };
  return { severity:"info", messageKey:"media.diagnosis.normal" };
}

export function generateHeadline(state) {
  const snapshot = calculateMediaSnapshot(state);
  let type = "warning";
  if (snapshot.publicMood > 64 && snapshot.hostility < 45 && snapshot.credibility > 54) type = "positive";
  if (snapshot.publicMood < 45 || snapshot.hostility > 65 || snapshot.agendaRisk > 72) type = "negative";
  const list = HEADLINE_TEMPLATES.filter(h => h.type === type);
  const headline = list[Math.floor(Math.random() * list.length)] || HEADLINE_TEMPLATES[0];
  return { ...headline, mood: Math.round(snapshot.publicMood), hostility: Math.round(snapshot.hostility), credibility: Math.round(snapshot.credibility), agendaRisk: Math.round(snapshot.agendaRisk) };
}

export function answerPressQuestion(state, answer, log) {
  if (!answer) return;
  const legacy = applyMediaPublicEffects(state, answer.effects || {});
  applyEffects(state, legacy);
  const headline = generateHeadline(state);
  state.headlines = state.headlines || [];
  state.headlines.unshift({
    text: headline.text,
    textKey: headline.textKey,
    type: headline.type,
    mood: headline.mood,
    hostility: headline.hostility,
    credibility: headline.credibility,
    agendaRisk: headline.agendaRisk
  });
  state.headlines = state.headlines.slice(0, HEADLINE_LIMIT);
  log(`Coletiva (${answer.tone || answer.toneKey || "resposta"}): ${headline.text}.`, headline.type);
  normalizeState(state);
}

export function updateMediaCycle(state, log) {
  ensureMediaPublicState(state);
  const headline = generateHeadline(state);
  state.headlines = state.headlines || [];
  state.headlines.unshift({
    text: headline.text,
    textKey: headline.textKey,
    type: headline.type,
    mood: headline.mood,
    hostility: headline.hostility,
    credibility: headline.credibility,
    agendaRisk: headline.agendaRisk
  });
  state.headlines = state.headlines.slice(0, HEADLINE_LIMIT);

  if (headline.type === "negative") {
    applyMediaPublicEffects(state, { publicMood:-1.2, trust:-0.8, scandalAttention:0.6, hostility:0.7 });
    applyEffects(state, { approval: -1, media: -0.8, crisis: 0.2 });
  } else if (headline.type === "positive") {
    applyMediaPublicEffects(state, { publicMood:0.8, trust:0.5, hostility:-0.4 });
    applyEffects(state, { approval: 0.8, media: 0.6 });
  } else {
    applyMediaPublicEffects(state, { agendaPressure:0.2 });
  }

  log(`Manchete: ${headline.text}.`, headline.type);
}

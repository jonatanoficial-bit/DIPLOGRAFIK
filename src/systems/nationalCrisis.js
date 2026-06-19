import { clamp } from "../core/dom.js";
import { CRISIS_DOMAINS, CRISIS_PROTOCOLS, CRISIS_SCENARIOS } from "../data/nationalCrisisData.js";

export function createNationalCrisisState() {
  return {
    schema: 1,
    activeProtocol: "preventive_state",
    earlyWarning: 52,
    interministerialCoordination: 50,
    operationalReadiness: 49,
    publicTrustBuffer: 46,
    misinformationResistance: 44,
    legalShield: 48,
    socialRelief: 43,
    logistics: 47,
    cyberContinuity: 45,
    fiscalBuffer: 41,
    continuity: 50,
    escalationVelocity: 0,
    compoundRisk: 38,
    nationalReadiness: 50,
    recoveryCapacity: 46,
    lastDiagnosis: { severity: "info", messageKey: "nationalCrisis.diagnosis.stable" },
    domains: CRISIS_DOMAINS.map(d => ({ ...d, pressure: d.base, trend: 0 })),
    scenarios: CRISIS_SCENARIOS.map(s => ({ ...s, active:false, risk:0 })),
    history: []
  };
}

export function ensureNationalCrisisState(state) {
  if (!state.nationalCrisis || typeof state.nationalCrisis !== "object") state.nationalCrisis = createNationalCrisisState();
  const base = createNationalCrisisState();
  const nc = state.nationalCrisis;
  for (const [key, value] of Object.entries(base)) {
    if (nc[key] === undefined || nc[key] === null) nc[key] = structuredClone(value);
  }
  nc.schema = 1;
  nc.domains = CRISIS_DOMAINS.map(profile => {
    const existing = (Array.isArray(nc.domains) ? nc.domains : []).find(item => item.id === profile.id) || {};
    return { ...profile, ...existing, pressure: clamp(Number(existing.pressure ?? profile.base), 0, 100), trend: clamp(Number(existing.trend || 0), -25, 25) };
  });
  nc.scenarios = CRISIS_SCENARIOS.map(profile => {
    const existing = (Array.isArray(nc.scenarios) ? nc.scenarios : []).find(item => item.id === profile.id) || {};
    return { ...profile, ...existing, risk: clamp(Number(existing.risk || 0), 0, 100), active: !!existing.active };
  });
  nc.history = Array.isArray(nc.history) ? nc.history.slice(-36) : [];
  return nc;
}

function valuePressure(state, key) {
  const v = Number(state[key] ?? 50);
  if (["approval","stability","coalition","security","media","govNarrative","diplomacy","influence","tradeBalance"].includes(key)) return clamp(100 - v, 0, 100);
  if (key === "inflation") return clamp(v * 7.5, 0, 100);
  if (key === "unemployment") return clamp(v * 6.2, 0, 100);
  if (key === "debt") return clamp((v - 35) * 1.25, 0, 100);
  if (key === "globalTension" || key === "congressPressure" || key === "coupRisk" || key === "corruption" || key === "rejection" || key === "inequality") return clamp(v, 0, 100);
  return clamp(v, 0, 100);
}

export function calculateNationalCrisisSnapshot(state) {
  const nc = ensureNationalCrisisState(state);
  const protocol = CRISIS_PROTOCOLS.find(p => p.id === nc.activeProtocol) || CRISIS_PROTOCOLS[0];
  const domains = nc.domains.map(domain => {
    const source = domain.pressureKeys.map(key => valuePressure(state, key));
    const external = (state.globalTension || 35) * (domain.id === "external" ? 0.18 : 0.04);
    const activeChain = Object.values(state.crisisChains || {}).some(chain => chain.active && chain.level > 0) ? 5 : 0;
    const target = clamp((source.reduce((a,b)=>a+b,0) / Math.max(1, source.length)) * 0.76 + domain.base * 0.14 + external + activeChain, 0, 100);
    return { ...domain, target };
  });
  const readiness = clamp(
    Number(nc.earlyWarning) * 0.13 + Number(nc.interministerialCoordination) * 0.18 + Number(nc.operationalReadiness) * 0.14 +
    Number(nc.publicTrustBuffer) * 0.12 + Number(nc.legalShield) * 0.11 + Number(nc.socialRelief) * 0.10 +
    Number(nc.logistics) * 0.10 + Number(nc.cyberContinuity) * 0.08 + Number(nc.fiscalBuffer) * 0.08 + Number(nc.continuity) * 0.06,
    0, 100
  );
  const compound = clamp(domains.reduce((sum,d)=>sum+d.target,0)/domains.length + (state.crisis || 0) * 4.5 - readiness * 0.26 - (state.governance?.recoveryMomentum || 0) * 0.4, 0, 100);
  const recovery = clamp(readiness * 0.62 + (state.stability || 50) * 0.18 + (state.approval || 50) * 0.08 + (state.governance?.institutionalResilience || 50) * 0.12 - compound * 0.15, 0, 100);
  return { protocol, domains, readiness, compound, recovery, escalationVelocity: clamp(compound - readiness + (state.crisis || 0) * 3, -30, 50) };
}

export function nationalCrisisHealthScore(state) {
  const snapshot = calculateNationalCrisisSnapshot(state);
  return Math.round(clamp(snapshot.readiness * 0.55 + snapshot.recovery * 0.35 + (100 - snapshot.compound) * 0.1, 0, 100));
}

export function setNationalCrisisProtocol(state, id) {
  const nc = ensureNationalCrisisState(state);
  const protocol = CRISIS_PROTOCOLS.find(p => p.id === id) || CRISIS_PROTOCOLS[0];
  nc.activeProtocol = protocol.id;
  applyNationalCrisisEffects(state, protocol.effects || {});
  return protocol;
}

export function applyNationalCrisisEffects(state, effects = {}) {
  const nc = ensureNationalCrisisState(state);
  const legacy = {};
  const direct = ["earlyWarning","interministerialCoordination","operationalReadiness","publicTrustBuffer","misinformationResistance","legalShield","socialRelief","logistics","cyberContinuity","fiscalBuffer","continuity","escalationVelocity"];
  for (const [key, value] of Object.entries(effects || {})) {
    if (direct.includes(key)) nc[key] = clamp(Number(nc[key] || 0) + Number(value || 0), key === "escalationVelocity" ? -30 : 0, 100);
    else legacy[key] = value;
  }
  const snapshot = calculateNationalCrisisSnapshot(state);
  nc.compoundRisk = snapshot.compound;
  nc.nationalReadiness = snapshot.readiness;
  nc.recoveryCapacity = snapshot.recovery;
  return legacy;
}

export function processNationalCrisisMonth(state, economyReport = {}) {
  const nc = ensureNationalCrisisState(state);
  const snapshot = calculateNationalCrisisSnapshot(state);
  nc.domains = snapshot.domains.map(domain => {
    const previous = Number((nc.domains.find(d => d.id === domain.id) || {}).pressure || domain.base);
    const pressure = clamp(previous * 0.62 + domain.target * 0.38, 0, 100);
    return { ...domain, pressure, trend: clamp(pressure - previous, -25, 25) };
  });
  nc.scenarios = CRISIS_SCENARIOS.map(scenario => {
    const raw = Number(state[scenario.trigger] ?? 50);
    const risk = scenario.invert ? clamp((scenario.threshold - raw) * 3.2 + snapshot.compound * 0.32, 0, 100) : clamp((raw - scenario.threshold) * 3.0 + snapshot.compound * 0.28, 0, 100);
    return { ...scenario, risk, active: risk > 54 };
  });
  nc.compoundRisk = snapshot.compound;
  nc.nationalReadiness = snapshot.readiness;
  nc.recoveryCapacity = snapshot.recovery;
  nc.escalationVelocity = snapshot.escalationVelocity;
  nc.lastDiagnosis = diagnose(snapshot, nc);

  if (snapshot.compound > 72 && snapshot.readiness < 54) {
    state.crisis = clamp(Number(state.crisis || 0) + 0.7, 0, 10);
    state.stability = clamp(Number(state.stability || 50) - 1.2, 0, 100);
    state.approval = clamp(Number(state.approval || 50) - 0.8, 0, 100);
  } else if (snapshot.recovery > 62 && Number(state.crisis || 0) > 0) {
    state.crisis = clamp(Number(state.crisis || 0) - 0.45, 0, 10);
    state.governance.recoveryMomentum = clamp(Number(state.governance?.recoveryMomentum || 0) + 0.8, 0, 20);
  }

  nc.history.push({ m:state.month, y:state.year, health:nationalCrisisHealthScore(state), compound:nc.compoundRisk, readiness:nc.nationalReadiness, recovery:nc.recoveryCapacity, active:nc.scenarios.filter(s=>s.active).length });
  nc.history = nc.history.slice(-36);
  return { health:nationalCrisisHealthScore(state), compound:nc.compoundRisk, readiness:nc.nationalReadiness, recovery:nc.recoveryCapacity, activeScenarios:nc.scenarios.filter(s=>s.active).length };
}

function diagnose(snapshot, nc) {
  if (snapshot.compound > 76) return { severity:"danger", messageKey:"nationalCrisis.diagnosis.compound" };
  if (snapshot.escalationVelocity > 18) return { severity:"warning", messageKey:"nationalCrisis.diagnosis.acceleration" };
  if ((nc.scenarios || []).filter(s=>s.active).length >= 2) return { severity:"warning", messageKey:"nationalCrisis.diagnosis.multi" };
  if (snapshot.recovery > 64) return { severity:"positive", messageKey:"nationalCrisis.diagnosis.recovery" };
  return { severity:"info", messageKey:"nationalCrisis.diagnosis.stable" };
}

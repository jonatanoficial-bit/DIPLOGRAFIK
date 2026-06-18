import { applyEffects, normalizeState } from "./calculations.js";
import { SECURITY_EVENTS } from "../data/securityData.js";

export function ensureSecurityState(state) {
  if (typeof state.security !== "number") state.security = 52;
  if (typeof state.coupRisk !== "number") state.coupRisk = 18;
  if (!state.securityLog) state.securityLog = [];
  if (!state.activeOperations) state.activeOperations = [];
}

export function calculateCoupRisk(state) {
  ensureSecurityState(state);
  return Math.max(0, Math.min(100,
    (100 - (state.loyalty || 50)) * 0.35 +
    (100 - (state.stability || 50)) * 0.18 +
    (state.crisis || 0) * 4 +
    (state.corruption || 0) * 0.08 +
    Math.max(0, (state.military || 50) - 70) * 0.12 -
    (state.politicalCapital || 0) * 0.04
  ));
}

export function calculateInternalThreat(state) {
  ensureSecurityState(state);
  return Math.max(0, Math.min(100,
    (100 - (state.security || 50)) * 0.28 +
    (100 - (state.stability || 50)) * 0.22 +
    (state.crisis || 0) * 5 +
    Math.max(0, (state.unemployment || 9) - 10) * 1.3 +
    Math.max(0, (state.inflation || 6) - 8) * 1.1
  ));
}

export function runIntelOperation(state, operation, log) {
  ensureSecurityState(state);
  if (!operation) return;
  if ((operation.cost || 0) > state.treasury) {
    log("Tesouro insuficiente para operação de inteligência.", "negative");
    return;
  }

  state.treasury -= operation.cost || 0;
  const successChance = Math.max(10, Math.min(90, (state.intelligence || 40) + (state.stability || 50) * 0.2 - operation.risk * 0.35));
  const roll = Math.random() * 100;

  if (roll <= successChance) {
    const { treasury: ignoredTreasury, ...successEffects } = operation.effects || {};
    applyEffects(state, successEffects);
    state.activeOperations.unshift({ title: operation.title, result: "sucesso", day: state.day, month: state.month, year: state.year });
    log(`Inteligência: ${operation.title} concluída com sucesso.`, "positive");
  } else {
    applyEffects(state, { media: -2, corruption: 2, stability: -2, crisis: 1 });
    state.activeOperations.unshift({ title: operation.title, result: "falha", day: state.day, month: state.month, year: state.year });
    log(`Inteligência: ${operation.title} falhou e gerou desgaste.`, "negative");
  }
  state.activeOperations = state.activeOperations.slice(0, 10);
  normalizeState(state);
}

export function runMilitaryAction(state, action, log) {
  ensureSecurityState(state);
  if (!action) return;
  if ((action.cost || 0) > state.treasury) {
    log("Tesouro insuficiente para ação militar.", "negative");
    return;
  }
  applyEffects(state, action.effects);
  log(`Comando militar: ${action.title} executado.`, "positive");
  normalizeState(state);
}

export function processSecurityCycle(state, log) {
  ensureSecurityState(state);
  state.coupRisk = calculateCoupRisk(state);

  if (state.day % 11 === 0) {
    const threat = calculateInternalThreat(state);
    if (threat > 60 || Math.random() < 0.22) {
      const event = SECURITY_EVENTS[Math.floor(Math.random() * SECURITY_EVENTS.length)];
      applyEffects(state, event.effects);
      log(`Segurança: ${event.title}. ${event.text}`, event.type);
    }
  }

  if (state.coupRisk > 76 && (state.governance?.totalDays || 0) % 7 === 0) {
    applyEffects(state, { stability: -0.55, approval: -0.25, crisis: 0.18 });
    log("Alerta: risco de ruptura militar em zona crítica.", "negative");
  } else if (state.coupRisk < 45 && state.loyalty < 58) {
    applyEffects(state, { loyalty: 0.18 });
  }
}
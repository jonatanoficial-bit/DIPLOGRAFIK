import { $, $$, clamp } from "./core/dom.js";
import { saveGame, loadGame, deleteSave, getLastStorageError, hasAnyCareerSave, ensureSaveArchitecture } from "./core/storage.js";
import { installResilience, getResilienceStatus } from "./core/resilience.js";
import { showScreen, showTab } from "./core/router.js";
import { avatarPictureMarkup, partyPictureMarkup, bindImageFallbacks, initializeAssetPipeline } from "./core/assets.js";
import { enterFullscreen, installViewportFix } from "./core/fullscreen.js";
import { installMobileExperience } from "./core/mobile.js";
import { installDesktopExperience } from "./core/desktop.js";
import { installScrollExperience } from "./core/scrollExperience.js";
import { installSaveManager, openSaveManager, quickBackupCurrent, quickExportActive } from "./core/saveManager.js";
import { installPWA, promptPWAInstall, checkPWAUpdate, applyPWAUpdate } from "./core/pwa.js";
import { installErrorBoundary, reportFatalError } from "./core/errorBoundary.js";
import { BUILD, BUILD_LABEL } from "./core/build.js";
import { installI18n, t, translateText, translateElement, formatDateParts, getLocale } from "./core/i18n.js";
import { createNewState } from "./core/stateFactory.js";
import { PARTIES } from "./data/parties.js";
import { COUNTRIES, POLITICAL_SYSTEMS, LEADER_IDEOLOGIES, DIFFICULTIES, STARTING_SCENARIOS, STRATEGIC_OBJECTIVES } from "./data/governmentCreationData.js";
import { AVATARS } from "./data/avatars.js";
import { DECISIONS, PROJECTS, PRESS_QUESTIONS } from "./data/content.js";
import { ECONOMIC_MEASURES, TAX_PROFILES } from "./data/economyData.js";
import { FISCAL_RULES, MONETARY_POLICIES, TRADE_STRATEGIES, PRODUCTIVE_PROGRAMS } from "./data/economyDeepData.js";
import { GOVERNMENT_ACTIONS, LAW_PROJECTS } from "./data/governmentData.js";
import { MEDIA_ACTIONS, PRESS_BRIEFINGS } from "./data/mediaData.js";
import { CAMPAIGN_ACTIONS } from "./data/electionData.js";
import { TREATIES, DIPLOMACY_ACTIONS } from "./data/diplomacyData.js";
import { MILITARY_ACTIONS, INTEL_OPERATIONS } from "./data/securityData.js";
import { CRISIS_ACTIONS } from "./data/crisisData.js";
import { POPULATION_POLICIES } from "./data/populationData.js";
import { applyEffects, normalizeState } from "./systems/calculations.js";
import { advanceDay, ensureCoreLoopState, consumeActionCapacity, scheduleActionConsequence, queueConsequence, holdElection, acknowledgeCareerOutcome } from "./systems/coreLoop.js";
import { applyGovernmentCreation } from "./systems/governmentCreation.js";
import { applyCampaignAction } from "./systems/elections.js";
import { applyBudgetChange, applyBudgetPolicy, applyTaxProfile } from "./systems/economy.js";
import { ensureDeepEconomyState, setFiscalRule as setDeepFiscalRule, setMonetaryPolicy as setDeepMonetaryPolicy, applyDeepEconomyActionEffects } from "./systems/economyDeep.js";
import { voteLaw as processLawVote } from "./systems/government.js";
import { answerPressQuestion } from "./systems/media.js";
import { ensureDiplomacyState, countryReaction, applyTreaty, diplomaticAction } from "./systems/diplomacy.js";
import { ensureSecurityState, runMilitaryAction as processMilitaryAction, runIntelOperation as processIntelOperation } from "./systems/security.js";
import { ensureCrisisState, runCrisisAction as processCrisisAction } from "./systems/crisis.js";
import { ensureProgressionState, addXP, checkAchievements, checkMandateGoals, updateGlobalRank, claimDailyReward } from "./systems/progression.js";
import { ensureMonetizationState, buyStoreItem as processStoreBuy, claimRewardedAd as processRewardedAd, simulatePremiumPack as processPremiumPack } from "./systems/monetization.js";
import { ensurePopulationState, runPopulationPolicy as processPopulationPolicy } from "./systems/population.js";
import { renderAll } from "./ui/render.js";
import { feedback, pulse } from "./ui/feedback.js";
import { setupAudioControls, playSfx, setAudioMood } from "./ui/audio.js";
import { setupTutorial, maybeAutoTutorial } from "./ui/tutorial.js";

let selectedAvatar = AVATARS[0];
let selectedParty = PARTIES[0];
let governmentSelection = {
  countryId: COUNTRIES[0].id,
  systemId: POLITICAL_SYSTEMS[0].id,
  ideologyId: LEADER_IDEOLOGIES[0].id,
  difficultyId: DIFFICULTIES[1].id,
  scenarioId: STARTING_SCENARIOS[0].id,
  objectiveId: STRATEGIC_OBJECTIVES[0].id,
};
let autoTimer = null;
let resilience = null;
let state = createNewState();

function log(message, type = "info") {
  const canonical = String(message ?? "");
  state.feed.unshift({ date: formatDateParts(state.day, state.month, state.year), message: canonical, type });
  state.feed = state.feed.slice(0, 22);
  feedback(canonical, type);
}

function renderGame(context = "render") {
  try {
    renderAll(state, actions);
    resilience?.heartbeat(context);
    if (document.getElementById("game")?.classList.contains("active")) resilience?.scheduleAutosave(state, context);
    return true;
  } catch (error) {
    resilience?.recordIncident(error, context);
    reportFatalError(error, context);
    return false;
  }
}

function applyRecoveredState(restored) {
  if (!restored || typeof restored !== "object") return false;
  state = { ...createNewState(), ...restored };
  normalizeState(state);
  ensureDiplomacyState(state);
  ensureSecurityState(state);
  ensureCrisisState(state);
  ensureProgressionState(state);
  ensureMonetizationState(state);
  ensureCoreLoopState(state);
  ensurePopulationState(state);
  ensureDeepEconomyState(state);
  updateGlobalRank(state);
  renderGame("snapshot-restored");
  updateMobileChrome();
  return true;
}

function runSafely(context, callback) {
  try {
    return callback();
  } catch (error) {
    resilience?.recordIncident(error, context);
    reportFatalError(error, context);
    return undefined;
  }
}

const actions = {
  runDecision(id) {
    const decision = DECISIONS.find(d => d.id === id);
    executeTimedAction(decision, id);
  },
  runEconomyMeasure(id) {
    const measure = ECONOMIC_MEASURES.find(m => m.id === id);
    executeTimedAction(measure, id, "Medida econômica");
  },
  setFiscalRule(id) {
    const rule = FISCAL_RULES.find(item => item.id === id);
    if (!rule) return renderGame();
    if (state.deepEconomy?.fiscalRule === id) { log(t("economyDeep.policyAlreadyActive"), "info"); return renderGame(); }
    if (!consumeActionCapacity(state, 1, log, t(rule.nameKey))) return renderGame();
    const selected = setDeepFiscalRule(state, id);
    applyEffects(state, selected.effects || {});
    state.cooldowns[`deep:fiscal:${id}`] = 30;
    log(t("economyDeep.fiscalChanged", { name: t(selected.nameKey) }), "positive");
    renderGame("deep-fiscal-rule");
  },
  setMonetaryPolicy(id) {
    const policy = MONETARY_POLICIES.find(item => item.id === id);
    if (!policy) return renderGame();
    if (state.deepEconomy?.monetaryPolicy === id) { log(t("economyDeep.policyAlreadyActive"), "info"); return renderGame(); }
    if (!consumeActionCapacity(state, 1, log, t(policy.nameKey))) return renderGame();
    const selected = setDeepMonetaryPolicy(state, id);
    applyEffects(state, selected.effects || {});
    state.cooldowns[`deep:monetary:${id}`] = 30;
    log(t("economyDeep.monetaryChanged", { name: t(selected.nameKey) }), "positive");
    renderGame("deep-monetary-policy");
  },
  runDeepEconomyAction(id) {
    const action = [...TRADE_STRATEGIES, ...PRODUCTIVE_PROGRAMS].find(item => item.id === id);
    if (!action) return renderGame();
    const cooldownKey = `deep:economy:${id}`;
    if (Number(state.cooldowns?.[cooldownKey] || 0) > 0) { log(t("economyDeep.cooldownWarning"), "warning"); return renderGame(); }
    if (Number(state.treasury || 0) < Number(action.cost || 0)) { log(t("economyDeep.insufficientTreasury"), "negative"); return renderGame(); }
    if (!consumeActionCapacity(state, action.actionPoints || 1, log, t(action.titleKey || action.nameKey))) return renderGame();
    state.treasury -= Number(action.cost || 0);
    const legacyEffects = applyDeepEconomyActionEffects(state, action.effects || {});
    applyEffects(state, legacyEffects);
    scheduleActionConsequence(state, { id: `deep-${id}`, title: t(action.titleKey || action.nameKey), effects: legacyEffects, lagDays: action.lagDays || 60 }, "Economia profunda");
    state.cooldowns[cooldownKey] = Number(action.cooldown || 45);
    addXP(state, 8, log);
    log(t("economyDeep.actionStarted", { name: t(action.titleKey || action.nameKey) }), "positive");
    renderGame("deep-economy-action");
  },
  runGovernmentAction(id) {
    const action = GOVERNMENT_ACTIONS.find(a => a.id === id);
    executeTimedAction(action, id, "Ação de governo");
  },
  voteLaw(id) {
    const law = LAW_PROJECTS.find(l => l.id === id);
    if (!law || !consumeActionCapacity(state, 2, log, law.title)) return renderGame();
    const approved = processLawVote(state, law, log);
    if (approved) scheduleActionConsequence(state, { ...law, lagDays: 45 }, "Lei aprovada");
    renderGame();
  },
  runMediaAction(id) {
    const action = MEDIA_ACTIONS.find(a => a.id === id);
    executeTimedAction(action, id, "Ação de comunicação");
  },
  runCampaignAction(id) {
    const action = CAMPAIGN_ACTIONS.find(a => a.id === id);
    if (!action) return;
    if (state.cooldowns[id]) { log("Ação de campanha ainda está em cooldown.", "warning"); return renderGame(); }
    if (!consumeActionCapacity(state, 1, log, action.title)) return renderGame();
    applyCampaignAction(state, action, log);
    state.cooldowns[id] = action.cooldown || 5;
    renderGame();
  },
  runDiplomacyAction(id) {
    const action = DIPLOMACY_ACTIONS.find(a => a.id === id);
    if (!action) return;
    if (state.cooldowns[id]) { log("Ação diplomática ainda está em cooldown.", "warning"); return renderGame(); }
    if (!consumeActionCapacity(state, 2, log, action.title)) return renderGame();
    diplomaticAction(state, action, log);
    scheduleActionConsequence(state, action, "Diplomacia");
    state.cooldowns[id] = action.cooldown || 8;
    renderGame();
  },
  signTreaty(countryId, treatyId) {
    const treaty = TREATIES.find(t => t.id === treatyId);
    if (!treaty || !consumeActionCapacity(state, 2, log, treaty.title)) return renderGame();
    const signed = applyTreaty(state, countryId, treaty, log);
    if (signed) scheduleActionConsequence(state, { ...treaty, id: `treaty-${countryId}-${treaty.id}`, lagDays: 45 }, "Tratado");
    renderGame();
  },
  runMilitaryAction(id) {
    const action = MILITARY_ACTIONS.find(a => a.id === id);
    if (!action) return;
    if (state.cooldowns[id]) { log("Ação militar ainda está em cooldown.", "warning"); return renderGame(); }
    if (!consumeActionCapacity(state, 2, log, action.title)) return renderGame();
    processMilitaryAction(state, action, log);
    scheduleActionConsequence(state, action, "Defesa");
    state.cooldowns[id] = action.cooldown || 8;
    renderGame();
  },
  runIntelOperation(id) {
    const operation = INTEL_OPERATIONS.find(o => o.id === id);
    if (!operation) return;
    if (state.cooldowns[id]) { log("Operação ainda está em cooldown.", "warning"); return renderGame(); }
    if (!consumeActionCapacity(state, 2, log, operation.title)) return renderGame();
    processIntelOperation(state, operation, log);
    state.cooldowns[id] = operation.cooldown || 8;
    renderGame();
  },
  runCrisisAction(id) {
    const action = CRISIS_ACTIONS.find(a => a.id === id);
    if (!action) return;
    if (state.cooldowns[id]) { log("Resposta de crise ainda está em cooldown.", "warning"); return renderGame(); }
    if (!consumeActionCapacity(state, 1, log, action.title)) return renderGame();
    processCrisisAction(state, action, log);
    scheduleActionConsequence(state, action, "Resposta de crise");
    state.cooldowns[id] = action.cooldown || 7;
    renderGame();
  },
  runPopulationPolicy(id) {
    const policy = POPULATION_POLICIES.find(item => item.id === id);
    if (!policy) return;
    const cooldownKey = `population:${policy.id}`;
    if (Number(state.cooldowns?.[cooldownKey] || 0) > 0) {
      log(t("population.policyCooldownWarning"), "warning");
      return renderGame();
    }
    if (Number(state.treasury || 0) < Number(policy.cost || 0)) {
      log(t("population.insufficientTreasury"), "negative");
      return renderGame();
    }
    if (!consumeActionCapacity(state, policy.actionPoints || 2, log, t(policy.titleKey))) return renderGame();
    if (!processPopulationPolicy(state, policy, log)) return renderGame();
    addXP(state, 8, log);
    renderGame("population-policy");
  },
  claimDaily() {
    claimDailyReward(state, log);
    checkAchievements(state, log);
    checkMandateGoals(state, log);
    updateGlobalRank(state);
    renderGame();
  },
  buyStoreItem(id) {
    processStoreBuy(state, id, log);
    renderGame();
    applyTheme();
  },
  claimRewardedAd(id) {
    processRewardedAd(state, id, log);
    renderGame();
  },
  simulatePremiumPack(id) {
    processPremiumPack(state, id, log);
    renderGame();
  },
  changeBudget(key, value) {
    applyBudgetChange(state, key, value);
    renderGame();
  },
  applyBudget() {
    const cycle = `${state.year}-${state.month}`;
    ensureCoreLoopState(state);
    if (state.governance.lastBudgetCycle === cycle) { log("O orçamento deste mês já foi aplicado.", "warning"); return renderGame(); }
    if (!consumeActionCapacity(state, 3, log, "Orçamento nacional")) return renderGame();
    applyBudgetPolicy(state);
    state.governance.lastBudgetCycle = cycle;
    queueConsequence(state, { id:`budget:${cycle}`, title:"Execução do orçamento nacional", days:30, effects:{ economy:0.8, stability:0.6, debt:0.35 }, type:"info" });
    log("Orçamento nacional aplicado. Os resultados setoriais amadurecerão ao longo do mês.", "positive");
    renderGame();
  },
  applyTax(id) {
    const profile = TAX_PROFILES.find(p => p.id === id);
    if (!profile) return;
    const cycle = `${state.year}-${state.month}`;
    ensureCoreLoopState(state);
    if (state.governance.lastTaxCycle === cycle) { log("A política tributária só pode ser alterada uma vez por mês.", "warning"); return renderGame(); }
    if (!consumeActionCapacity(state, 2, log, profile.name)) return renderGame();
    applyTaxProfile(state, profile);
    state.governance.lastTaxCycle = cycle;
    scheduleActionConsequence(state, { ...profile, id:`tax-${profile.id}-${cycle}`, lagDays:45 }, "Política tributária");
    log(`Perfil tributário aplicado: ${profile.name}.`, "info");
    renderGame();
    pulse("#decisionDeck");
  },
  countryAction(countryId, act) {
    ensureDiplomacyState(state);
    const c = state.aiCountries.find(x => x.id === countryId);
    if (!c) return;
    if (!consumeActionCapacity(state, 1, log, c.name)) return renderGame();
    if (act === "deal") {
      if (state.treasury < 20) { log("Tesouro insuficiente para acordo.", "negative"); return renderGame(); }
      state.treasury -= 20;
      countryReaction(state, c, "deal");
      applyEffects(state, { influence: 2, diplomacy: 3, tradeBalance: 1 });
      log(`Acordo diplomático com ${c.name}.`, "positive");
    } else {
      countryReaction(state, c, "sanction");
      applyEffects(state, { influence: -1, stability: -1, diplomacy: -2, tradeBalance: -2 });
      log(`Sanções contra ${c.name} elevaram tensão.`, "negative");
    }
    renderGame();
    pulse("#countries");
  },
  startProject(id) {
    const project = PROJECTS.find(p => p.id === id);
    if (!project) return;
    if (state.projects.some(item => item.id === project.id) || state.completedProjects.includes(project.title)) { log("Este projeto já está ativo ou foi concluído.", "warning"); return renderGame(); }
    if (state.projects.length >= 3) { log("Fila de projetos cheia. Máximo de 3 projetos ativos.", "warning"); return renderGame(); }
    if (state.treasury < project.cost) { log("Tesouro insuficiente para iniciar projeto.", "negative"); return renderGame(); }
    if (!consumeActionCapacity(state, 2, log, project.title)) return renderGame();
    state.treasury -= project.cost;
    state.projects.push({ ...project, left: project.days });
    log(`Projeto iniciado: ${project.title}.`, "positive");
    renderGame();
    pulse("#projectQueue");
  },
  answerPress(index) {
    const press = PRESS_BRIEFINGS[(state.day + state.month) % PRESS_BRIEFINGS.length];
    const ans = press.answers[index];
    if (!ans) return;
    if (!consumeActionCapacity(state, 1, log, "Coletiva de imprensa")) return renderGame();
    answerPressQuestion(state, ans, log);
    renderGame();
  }
};

function executeTimedAction(item, id, label = "Decisão") {
  if (!item) return;
  if (state.cooldowns[id]) { log("Ação ainda está em cooldown.", "warning"); return renderGame(); }
  if ((item.cost || 0) > state.treasury) { log("Tesouro insuficiente.", "negative"); return renderGame(); }
  const capacityCost = item.capacityCost || (item.cost >= 100 ? 3 : item.cost >= 40 ? 2 : 1);
  if (!consumeActionCapacity(state, capacityCost, log, item.title || label)) return renderGame();
  applyEffects(state, item.effects);
  scheduleActionConsequence(state, item, label);
  state.cooldowns[id] = item.cooldown || 4;
  addXP(state, 7, log);
  log(`${label} executada: ${item.title}.`, "positive");
  ensureDiplomacyState(state);
  ensureSecurityState(state);
  ensureCrisisState(state);
  ensureProgressionState(state);
  ensureMonetizationState(state);
  ensureCoreLoopState(state);
  ensurePopulationState(state);
  ensureDeepEconomyState(state);
  updateGlobalRank(state);
  renderGame();
  applyTheme();
  updateMobileChrome();
  maybeAutoTutorial();
}

function setupCreateScreen() {
  $("#avatars").innerHTML = AVATARS.map((a, i) => `<button type="button" class="avatarCard ${i === 0 ? "active" : ""}" data-avatar="${a.id}" aria-pressed="${i === 0}">${avatarPictureMarkup(a, i)}<span>${translateText(a.name)}</span></button>`).join("");
  translateElement($("#avatars"));
  bindImageFallbacks($("#avatars"));
  $$(".avatarCard").forEach(card => {
    card.onclick = () => {
      $$(".avatarCard").forEach(c => { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
      card.classList.add("active");
      card.setAttribute("aria-pressed", "true");
      selectedAvatar = AVATARS.find(a => a.id === card.dataset.avatar) || AVATARS[0];
    };
  });
  $("#partySearch").oninput = renderParties;
  $("#ideology").onchange = renderParties;
  renderSetupChoices();
  renderParties();
}

function setupChoiceCard(item, group, selectedId) {
  return `<button type="button" class="setupChoice ${item.id === selectedId ? "active" : ""}" data-setup-group="${group}" data-setup-id="${item.id}" aria-pressed="${item.id === selectedId}"><span class="setupIcon">${item.icon || item.flag || "◆"}</span><b>${t(item.nameKey)}</b><small>${t(item.descriptionKey)}</small></button>`;
}

function renderSetupChoices() {
  $("#countryChoices").innerHTML = COUNTRIES.map(item => setupChoiceCard(item, "countryId", governmentSelection.countryId)).join("");
  $("#systemChoices").innerHTML = POLITICAL_SYSTEMS.map(item => setupChoiceCard(item, "systemId", governmentSelection.systemId)).join("");
  $("#leaderIdeologyChoices").innerHTML = LEADER_IDEOLOGIES.map(item => setupChoiceCard(item, "ideologyId", governmentSelection.ideologyId)).join("");
  $("#difficultyChoices").innerHTML = DIFFICULTIES.map(item => setupChoiceCard(item, "difficultyId", governmentSelection.difficultyId)).join("");
  $("#scenarioChoices").innerHTML = STARTING_SCENARIOS.map(item => setupChoiceCard(item, "scenarioId", governmentSelection.scenarioId)).join("");
  $("#objectiveChoices").innerHTML = STRATEGIC_OBJECTIVES.map(item => setupChoiceCard(item, "objectiveId", governmentSelection.objectiveId)).join("");
  $$("[data-setup-group]").forEach(card => {
    card.onclick = () => {
      governmentSelection[card.dataset.setupGroup] = card.dataset.setupId;
      renderSetupChoices();
    };
  });
  renderGovernmentSetupSummary();
}

function renderGovernmentSetupSummary() {
  const find = (items, id) => items.find(item => item.id === id) || items[0];
  const rows = [
    [t("governmentCreation.summaryCountry"), t(find(COUNTRIES, governmentSelection.countryId).nameKey)],
    [t("governmentCreation.summarySystem"), t(find(POLITICAL_SYSTEMS, governmentSelection.systemId).nameKey)],
    [t("governmentCreation.summaryIdeology"), t(find(LEADER_IDEOLOGIES, governmentSelection.ideologyId).nameKey)],
    [t("governmentCreation.summaryDifficulty"), t(find(DIFFICULTIES, governmentSelection.difficultyId).nameKey)],
    [t("governmentCreation.summaryScenario"), t(find(STARTING_SCENARIOS, governmentSelection.scenarioId).nameKey)],
    [t("governmentCreation.summaryObjective"), t(find(STRATEGIC_OBJECTIVES, governmentSelection.objectiveId).nameKey)],
    [t("governmentCreation.summaryParty"), `${selectedParty.sigla} ${selectedParty.numero}`],
  ];
  $("#governmentSetupSummary").innerHTML = rows.map(([label,value]) => `<div><span>${label}</span><b>${value}</b></div>`).join("");
}

function renderParties() {
  const q = ($("#partySearch").value || "").toLowerCase();
  const ide = $("#ideology").value;
  const list = PARTIES.filter(p => (ide === "all" || p.ideologia === ide) && (p.sigla.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q) || String(p.numero).includes(q)));
  $("#parties").innerHTML = list.map((p,index) => `<button type="button" class="party partyLogoCard ${p.sigla === selectedParty.sigla ? "active" : ""}" data-party="${p.sigla}" aria-pressed="${p.sigla === selectedParty.sigla}" aria-label="${t("governmentCreation.selectParty", { party: translateText(p.nome) })}">${partyPictureMarkup(p,index)}<span class="srOnly">${translateText(p.nome)} • ${p.numero}</span></button>`).join("");
  bindImageFallbacks($("#parties"));
  $$(".party").forEach(card => {
    card.onclick = () => {
      selectedParty = PARTIES.find(p => p.sigla === card.dataset.party) || PARTIES[0];
      renderParties();
      renderGovernmentSetupSummary();
    };
  });
}

function startGame() {
  state = createNewState();
  const bonus = selectedParty.bonus || {};
  state.leader = ($("#leaderName").value || "Líder Nacional").trim();
  state.party = selectedParty.sigla;
  state.partyName = selectedParty.nome;
  state.avatar = selectedAvatar.src;
  state.avatarFallback = selectedAvatar.source;
  state.avatarAssetKey = selectedAvatar.assetKey;
  applyGovernmentCreation(state, governmentSelection, key => t(key));
  applyEffects(state, {
    approval: bonus.approval || 0,
    economy: bonus.economy || bonus.market || 0,
    stability: bonus.stability || 0,
    coalition: bonus.coalition || 0,
    diplomacy: bonus.diplomacy || 0,
    environment: bonus.environment || 0
  });
  log(`Posse concluída: ${state.leader} assume o ${state.country} pelo ${state.party}.`, "positive");
  ensureProgressionState(state);
  ensureMonetizationState(state);
  ensureCoreLoopState(state);
  ensurePopulationState(state);
  ensureDeepEconomyState(state);
  updateGlobalRank(state);
  log("Tutorial de posse disponível no menu inicial.", "info");
  showScreen("game");
  showTab("dashboard");
  renderGame();
  saveGame(state, { reason: "new-career" });
  updateMobileChrome();
  setTimeout(() => maybeAutoTutorial(), 450);
}

function bindGlobalEvents() {
  document.addEventListener("pointerdown", e => {
    const actionable = e.target.closest("button, [data-decision], [data-gov-action], [data-law], [data-economy-measure], [data-diplomacy-action], [data-military-action], [data-intel-operation], [data-crisis-action], [data-population-policy]");
    if (actionable && document.getElementById("game")?.classList.contains("active")) resilience?.checkpoint(`before:${actionable.id || actionable.dataset.tab || actionable.textContent?.trim().slice(0,32) || "action"}`);
  }, { capture: true });

  document.addEventListener("click", e => {
    if (e.target.closest("button")) playSfx("click");
    const go = e.target.closest("[data-go]");
    if (go) showScreen(go.dataset.go);
    const tab = e.target.closest("[data-tab]");
    if (tab) { showScreen("game"); showTab(tab.dataset.tab); renderGame(); }
  });

  $("#startGame").onclick = startGame;
  $("#continueBtn").onclick = () => {
    const save = loadGame();
    if (!save) {
      const storageError = getLastStorageError();
      if (hasAnyCareerSave()) {
        feedback(t("save.chooseCareer"), "info");
        openSaveManager();
      } else {
        feedback(storageError || t("runtime.noSave"), storageError ? "warning" : "info");
      }
      return;
    }
    const recoveryNotice = getLastStorageError();
    if (recoveryNotice) feedback(recoveryNotice, "warning");
    state = {...createNewState(), ...save};
    normalizeState(state);
    ensureDiplomacyState(state);
    ensureSecurityState(state);
    ensureCrisisState(state);
    ensureProgressionState(state);
    ensureMonetizationState(state);
    ensureCoreLoopState(state);
    showScreen("game");
    showTab("dashboard");
    renderGame();
  };
  $("#advanceDay").onclick = () => advanceTime(1, "manual-day");
  $("#advanceWeek").onclick = () => advanceTime(7, "manual-week");
  $("#simulateElection").onclick = () => { holdElection(state, log); renderGame("election"); updateMobileChrome(); };
  $("#applyBudget").onclick = () => actions.applyBudget();
  const dailyBtn = $("#claimDaily");
  if (dailyBtn) dailyBtn.onclick = () => actions.claimDaily();
  $("#saveGame").onclick = () => {
    if (saveGame(state, { reason: "manual" })) log(t("runtime.saveOk"), "positive");
    else log(getLastStorageError() || t("runtime.saveFail"), "negative");
    renderGame();
  };
  $("#resetGame").onclick = () => { if(confirm(t("runtime.confirmReset"))) { resilience?.checkpoint("before-reset"); deleteSave(); location.reload(); } };
  $("#autoToggle").onclick = () => {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; $("#autoToggle").textContent = t("hud.paused"); }
    else if (getResilienceStatus().safeMode) { feedback(t("runtime.autoSafe"), "warning"); }
    else if (state.careerStatus !== "active") { feedback(t("coreLoop.careerConcluded"), "warning"); }
    else { autoTimer = setInterval(() => runSafely("Avanço automático", () => advanceTime(1, "auto-day")), 2200); $("#autoToggle").textContent = t("hud.auto"); }
  };
  $$("#fullscreenBtn, #fullscreenHud, #mobileFullscreen, #desktopFullscreen").forEach(btn => btn && (btn.onclick = enterFullscreen));
  const installButtons = [$("#installAppBtn"), $("#installPwaRelease")].filter(Boolean);
  installButtons.forEach(btn => btn.onclick = async () => {
    const result = await promptPWAInstall();
    feedback(result.accepted ? t("runtime.installed") : t("runtime.installDeclined"), result.accepted ? "positive" : "info");
    renderGame("pwa-install");
  });
  const checkUpdate = $("#checkPwaUpdate");
  if (checkUpdate) checkUpdate.onclick = async () => {
    const available = await checkPWAUpdate();
    feedback(available ? t("runtime.updateReady") : t("runtime.latestBuild"), available ? "warning" : "positive");
    renderGame("pwa-update-check");
  };
  [$("#applyPwaUpdate"), $("#applyPwaUpdateBanner")].filter(Boolean).forEach(btn => btn.onclick = () => {
    if (!applyPWAUpdate()) feedback(t("runtime.noPendingUpdate"), "info");
  });
  const dismissUpdate = $("#dismissPwaUpdate");
  if (dismissUpdate) dismissUpdate.onclick = () => {
    const banner = $("#pwaUpdateBanner");
    banner?.classList.remove("open");
    banner?.setAttribute("aria-hidden", "true");
  };
  document.addEventListener("diplocraft:pwa-status", () => {
    if (document.getElementById("game")?.classList.contains("active")) renderGame("pwa-status");
  });
  const rcInfo = $("#rcInfoBtn");
  if (rcInfo) rcInfo.onclick = () => { showScreen("game"); showTab("release"); renderGame(); };
  const quick = $("#quickAdvance");
  if (quick) quick.onclick = () => runSafely("Avanço rápido", () => advanceTime(1, "quick-day"));
  const diagnosticsBtn = $("#diagnosticDownload");
  if (diagnosticsBtn) diagnosticsBtn.onclick = () => resilience?.exportDiagnostics();
  const restoreBtn = $("#restoreLatestSave");
  if (restoreBtn) restoreBtn.onclick = () => {
    const restored = resilience?.restoreLatest();
    feedback(restored ? t("runtime.snapshotRestored") : t("runtime.noSnapshot"), restored ? "positive" : "warning");
    renderGame("manual-restore");
  };
  [$("#saveManagerMenuBtn"), $("#openSaveManagerRelease")].filter(Boolean).forEach(btn => btn.onclick = openSaveManager);
  const quickBackup = $("#quickCareerBackup");
  if (quickBackup) quickBackup.onclick = () => quickBackupCurrent();
  const quickExport = $("#quickCareerExport");
  if (quickExport) quickExport.onclick = () => quickExportActive();

  const outcomeClose = $("#careerOutcomeClose");
  if (outcomeClose) outcomeClose.onclick = () => { acknowledgeCareerOutcome(state); renderGame("outcome-acknowledged"); };
  const outcomeMenu = $("#careerOutcomeMenu");
  if (outcomeMenu) outcomeMenu.onclick = () => { acknowledgeCareerOutcome(state); showScreen("menu"); };
  const outcomeNew = $("#careerOutcomeNew");
  if (outcomeNew) outcomeNew.onclick = () => { acknowledgeCareerOutcome(state); showScreen("create"); };

  const safeBtn = $("#safeModeToggle");
  if (safeBtn) safeBtn.onclick = () => {
    const enabled = !getResilienceStatus().safeMode;
    resilience?.setSafeMode(enabled, "painel-release");
    feedback(enabled ? t("runtime.safeOn") : t("runtime.safeOff"), "info");
    renderGame("safe-mode-toggle");
  };
}

function advanceTime(days, context) {
  const advanced = advanceDay(state, log, days);
  if (state.careerStatus !== "active" && autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    const toggle = $("#autoToggle");
    if (toggle) toggle.textContent = t("hud.paused");
  }
  renderGame(context);
  updateMobileChrome();
  return advanced;
}

function init() {
  installI18n({ onChange: ({ label }) => {
    setupCreateScreen();
    renderGame("locale-change");
    updateMobileChrome();
    translateElement(document);
    feedback(t("language.changed", { language: label }), "info");
  }});
  window.DIPLOCRAFT_BUILD_LABEL = BUILD_LABEL;
  ensureSaveArchitecture();
  resilience = installResilience({ getState: () => state, applyRestoredState: applyRecoveredState });
  installSaveManager({
    getState: () => state,
    applyState: applyRecoveredState,
    feedback,
    afterLoad: () => { showScreen("game"); showTab("dashboard"); renderGame("career-loaded"); updateMobileChrome(); }
  });
  installErrorBoundary({ onRestore: applyRecoveredState });
  try {
    installViewportFix();
    initializeAssetPipeline();
    setupAudioControls();
    setupTutorial(() => renderGame("tutorial"));
    setupCreateScreen();
    bindGlobalEvents();
    installMobileExperience();
    installDesktopExperience();
    installScrollExperience();
    installPWA();
    showScreen("menu");
    const ribbon = document.querySelector(".build-ribbon");
    if (ribbon) ribbon.textContent = BUILD_LABEL;
    const menuBuild = document.getElementById("menuBuild");
    if (menuBuild) menuBuild.textContent = `v${BUILD.version} • ${BUILD.date} ${BUILD.time} • mobile-first • desktop responsivo`;
    const mobileBuild = document.getElementById("mobileBuild");
    if (mobileBuild) mobileBuild.textContent = `v${BUILD.version} • ${BUILD.date.slice(0,5)} ${BUILD.time}`;
    document.title = `DIPLOCRAFT v${BUILD.version}`;
    translateElement(document);
    renderGame("initial-render");
    updateMobileChrome();
  } catch (error) {
    resilience?.recordIncident(error, "Falha ao iniciar a build");
    reportFatalError(error, "Falha ao iniciar a build");
  }
}

init();

function updateMobileChrome() {
  const mobileDate = document.getElementById("mobileDate");
  if (mobileDate) mobileDate.textContent = formatDateParts(state.day, state.month, state.year);
  setAudioMood(state.crisis > 5 ? "crisis" : state.electionDays < 90 ? "election" : "neutral");
}


function applyTheme() {
  document.body.dataset.theme = state.cosmeticTheme || "default";
}

import { $, $$, fmt, pct, clamp } from "../core/dom.js";
import { DECISIONS, PROJECTS, PRESS_QUESTIONS } from "../data/content.js";
import { ECONOMIC_MEASURES, TAX_PROFILES, ECONOMIC_SECTORS } from "../data/economyData.js";
import { FISCAL_RULES, MONETARY_POLICIES, TRADE_STRATEGIES, PRODUCTIVE_PROGRAMS } from "../data/economyDeepData.js";
import { TAX_INSTRUMENTS, SPENDING_RULES, BUDGET_TAX_ACTIONS } from "../data/budgetTaxData.js";
import { impeachmentRisk, commercialScore } from "../systems/calculations.js";
import { voteChance, nationalPoll, mainOpponent, regionalPolls } from "../systems/elections.js";
import { calculateMonthlyEconomy } from "../systems/economy.js";
import { calculateDeepEconomySnapshot, ensureDeepEconomyState, economicHealthScore } from "../systems/economyDeep.js";
import { ensureBudgetTaxState, calculateBudgetTaxSnapshot, budgetTaxHealthScore } from "../systems/budgetTax.js";
import { CONGRESS_PARTIES, LAW_PROJECTS, GOVERNMENT_ACTIONS } from "../data/governmentData.js";
import { INSTITUTION_PROFILES, INSTITUTIONAL_REFORMS, INSTITUTIONAL_ACTIONS } from "../data/governmentInstitutionData.js";
import { CABINET_PORTFOLIOS, CABINET_STYLES, CABINET_ACTIONS } from "../data/cabinetAdministrationData.js";
import { votingPower } from "../systems/government.js";
import { ensureInstitutionalState, calculateInstitutionalSnapshot, institutionalHealthScore } from "../systems/governmentInstitutions.js";
import { ensureCabinetState, calculateCabinetSnapshot, cabinetHealthScore } from "../systems/cabinetAdministration.js";
import { MEDIA_OUTLETS, MEDIA_ACTIONS, PRESS_BRIEFINGS, MEDIA_DOCTRINES, MEDIA_AGENDAS } from "../data/mediaData.js";
import { GLOBAL_BLOCS, WORLD_AGENDAS, DIPLOMACY_DOCTRINES, WORLD_DIPLOMACY_ACTIONS } from "../data/worldDiplomacyData.js";
import { publicMood, mediaHostility, ensureMediaPublicState, calculateMediaSnapshot, mediaHealthScore } from "../systems/media.js";
import { CAMPAIGN_ACTIONS } from "../data/electionData.js";
import { TREATIES, DIPLOMACY_ACTIONS } from "../data/diplomacyData.js";
import { relationStatus, globalRisk } from "../systems/diplomacy.js";
import { ensureWorldDiplomacyState, calculateWorldDiplomacySnapshot, worldDiplomacyHealthScore } from "../systems/worldDiplomacy.js";
import { MILITARY_ACTIONS, INTEL_OPERATIONS, SECURITY_FORCES } from "../data/securityData.js";
import { calculateCoupRisk, calculateInternalThreat } from "../systems/security.js";
import { CRISIS_ACTIONS } from "../data/crisisData.js";
import { POPULATION_POLICIES, NEED_KEYS } from "../data/populationData.js";
import { activeCrises, crisisSeverity } from "../systems/crisis.js";
import { ACHIEVEMENTS, UNLOCKS } from "../data/progressionData.js";
import { xpToNext } from "../systems/progression.js";
import { STORE_ITEMS, REWARDED_ADS, PREMIUM_PACKS, MONETIZATION_RULES } from "../data/monetizationData.js";
import { monetizationScore } from "../systems/monetization.js";
import { getGovernmentSetupDefinition } from "../systems/governmentCreation.js";
import { ensureCoreLoopState, getGovernancePhase, legacyScore, canHoldElection } from "../systems/coreLoop.js";
import { populationSummary } from "../systems/population.js";
import { RELEASE_CHECKLIST, TEST_CHECKLIST, NEXT_RELEASE_STEPS } from "../data/releaseData.js";
import { BUILD } from "../core/build.js";
import { attachImageFallback } from "../core/assets.js";
import { getResilienceStatus } from "../core/resilience.js";
import { getPWAStatus } from "../core/pwa.js";
import { getStorageDiagnostics } from "../core/storage.js";
import { t, translateText, translateElement, formatDateParts, getLocale } from "../core/i18n.js";

export function renderAll(state, actions) {
  renderHud(state);
  renderKpis(state);
  renderDashboard(state, actions);
  renderGovernment(state, actions);
  renderEconomy(state, actions);
  renderPopulation(state, actions);
  renderDiplomacy(state, actions);
  renderMilitary(state, actions);
  renderIntelligence(state, actions);
  renderProjects(state, actions);
  renderPress(state, actions);
  renderElections(state, actions);
  renderCrisis(state, actions);
  renderProgression(state, actions);
  renderStore(state, actions);
  renderRelease(state, actions);
  renderCareerOutcome(state);
  renderFeed(state);
  drawCharts(state);
  translateElement(document.getElementById("game"));
}

function setText(id, value) { const el = document.getElementById(id); if (el) { el.removeAttribute("data-i18n-final"); el.setAttribute("data-i18n-source", String(value ?? "")); el.textContent = translateText(value); } }
function setLocalizedText(id, value) { const el = document.getElementById(id); if (el) { el.removeAttribute("data-i18n-source"); el.setAttribute("data-i18n-final", "true"); el.textContent = String(value ?? ""); } }
function setHTML(id, value) { const el = document.getElementById(id); if (el) { el.innerHTML = value; translateElement(el); } }

function renderHud(state) {
  const avatar = $("#hudAvatar");
  if (avatar) {
    avatar.dataset.fallbackTried = "0";
    attachImageFallback(avatar, state.avatarFallback || "assets/characters/char_leader_male_white_v1.png");
    avatar.src = state.avatar;
  }
  setText("hudName", state.leader);
  setLocalizedText("hudRole", t("hud.role"));
  setText("hudParty", `${state.party} • ${state.partyName}`);
  setText("dateHud", formatDateParts(state.day, state.month, state.year));
  setText("treasury", `₿ ${fmt(state.treasury)} bi`);
  setText("politicalCapital", fmt(state.politicalCapital));
  setText("prestige", fmt(state.prestige));
  setText("level", state.level);
  setLocalizedText("nextEvent", t("runtime.nextEvent", { days: state.nextEventIn, election: state.electionDays }));
}

function bar(id, value, danger = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = pct(value);
  if (danger) el.style.background = "linear-gradient(90deg,#7a2222,#ef4d4d)";
}

function renderKpis(state) {
  setText("approvalTxt", pct(state.approval)); bar("approvalBar", state.approval);
  setText("economyTxt", pct(state.economy)); bar("economyBar", state.economy);
  setText("stabilityTxt", pct(state.stability)); bar("stabilityBar", state.stability);
  setText("influenceTxt", pct(state.influence)); bar("influenceBar", state.influence);
  setText("commercialScore", commercialScore(state));
  setText("impeachmentRisk", pct(impeachmentRisk(state)));
}

function renderDashboard(state, actions) {
  renderGovernanceCycle(state);
  setHTML("situation", situationText(state));
  const available = DECISIONS.filter(d => !state.cooldowns[d.id]).slice(0, 5);
  setHTML("decisionDeck", available.map(d => decisionCard(d, "decision")).join("") || "<p>Todas as decisões estão em cooldown.</p>");
  bind("[data-decision]", btn => actions.runDecision(btn.dataset.decision));
}

function renderGovernanceCycle(state) {
  const gov = ensureCoreLoopState(state);
  const phase = getGovernancePhase(state);
  const score = Math.round(legacyScore(state));
  const creation = getGovernmentSetupDefinition(state);
  setHTML("governanceCycle", `
    <div class="governmentIdentityLine"><span>${creation.country.flag} ${t(creation.country.nameKey)}</span><b>${t(creation.system.nameKey)}</b><small>${t(creation.difficulty.nameKey)} • ${t(creation.scenario.nameKey)}</small></div>
    <div class="econHero coreLoopHero">
      <div><span>${t("coreLoop.term")}</span><b>${gov.termNumber}/2</b></div>
      <div><span>${t("coreLoop.week")}</span><b>${gov.weekNumber}</b></div>
      <div><span>${t("coreLoop.actionPoints")}</span><b>${Math.round(gov.actionPoints)}/${Math.round(gov.maxActionPoints)}</b></div>
    </div>
    <div class="coreLoopPhase"><span>${t("coreLoop.phase")}</span><b>${translateText(phase)}</b><small data-i18n-final="true">${t("coreLoop.termDay", { day: gov.termDay })}</small></div>
    ${metric(t("coreLoop.administrativeCapacity"), gov.administrativeCapacity, gov.administrativeCapacity < 30)}
    ${metric(t("coreLoop.fiscalCredibility"), gov.fiscalCredibility, gov.fiscalCredibility < 30)}
    ${metric(t("coreLoop.institutionalResilience"), gov.institutionalResilience, gov.institutionalResilience < 30)}
    ${metric(t("coreLoop.socialCohesion"), gov.socialCohesion, gov.socialCohesion < 30)}
    ${metric(t("coreLoop.policyFatigue"), gov.policyFatigue, gov.policyFatigue > 70)}
    <div class="coreLoopLegacy"><span>${t("coreLoop.provisionalLegacy")}</span><b>${score}/100</b></div>
  `);

  const pending = gov.pendingConsequences || [];
  setHTML("pendingConsequences", pending.length ? pending
    .slice().sort((a,b)=>a.daysLeft-b.daysLeft).slice(0,8)
    .map(item => `<div class="consequenceItem ${item.type || "info"}"><b>${translateText(item.title)}</b><span>${t("coreLoop.daysRemaining", { days: item.daysLeft })}</span><small>${formatEffects(item.effects)}</small></div>`).join("")
    : `<p>${t("coreLoop.noPending")}</p>`);

  const active = state.careerStatus === "active";
  ["advanceDay","advanceWeek","quickAdvance","autoToggle"].forEach(id => { const el=document.getElementById(id); if (el) el.disabled=!active; });
  const election = document.getElementById("simulateElection");
  if (election) {
    election.disabled = !canHoldElection(state);
    election.title = canHoldElection(state) ? t("coreLoop.electionReady") : t("coreLoop.electionLocked", { days: state.electionDays });
  }
}

function formatEffects(effects = {}) {
  return Object.entries(effects).slice(0,4).map(([key,value]) => `${translateText(labelEffect(key))} ${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(Math.abs(value) < 1 ? 1 : 0)}`).join(" • ");
}

function labelEffect(key) {
  const labels = { economy:"Economia", approval:"Aprovação", stability:"Estabilidade", debt:"Dívida/PIB", marketConfidence:"Confiança mercado", unemployment:"Desemprego", politicalCapital:"Capital político", prestige:"Prestígio", campaign:"Campanha", crisis:"Crise nacional", media:"Confiança na imprensa", govNarrative:"Narrativa do governo", tradeBalance:"Balança comercial" };
  return labels[key] || key;
}

function renderCareerOutcome(state) {
  const gov = ensureCoreLoopState(state);
  const overlay = document.getElementById("careerOutcomeOverlay");
  if (!overlay) return;
  const outcome = gov.outcome;
  const open = Boolean(outcome && !gov.outcomePresented);
  overlay.classList.toggle("open", open);
  overlay.setAttribute("aria-hidden", open ? "false" : "true");
  if (!outcome) return;
  setText("careerOutcomeTitle", outcome.title);
  setText("careerOutcomeReason", outcome.reason);
  setText("careerOutcomeSeal", outcome.status === "victory" ? "★" : "!");
  const stats = document.getElementById("careerOutcomeStats");
  if (stats) {
    stats.innerHTML = `
      <div><span>${t("coreLoop.legacyScore")}</span><b>${outcome.score}/100</b></div>
      <div><span>${t("coreLoop.governedDays")}</span><b>${outcome.totalDays}</b></div>
      <div><span>${t("coreLoop.completedTerm")}</span><b>${outcome.termNumber}/2</b></div>
    `;
    translateElement(stats);
  }
  overlay.dataset.status = outcome.status;
}

function decisionCard(d, kind) {
  const cost = d.cost ? `₿ ${d.cost} bi` : "executar";
  return `<article class="decision"><h4>${d.title}</h4><p>${d.text}</p><button data-${kind}="${d.id}">${cost}</button></article>`;
}

function situationText(state) {
  if (state.crisis >= 7) return t("situation.severe");
  if (impeachmentRisk(state) > 65) return t("situation.institutional");
  if (state.economy < 42) return t("situation.weakEconomy");
  if (state.approval > 70) return t("situation.highApproval");
  return t("situation.normal");
}


function renderGovernment(state, actions) {
  const institutions = ensureInstitutionalState(state);
  const cabinet = ensureCabinetState(state);
  const cabinetSnapshot = calculateCabinetSnapshot(state);
  const activeCabinetStyle = CABINET_STYLES.find(item => item.id === cabinet.activeStyle) || CABINET_STYLES[0];
  const snapshot = calculateInstitutionalSnapshot(state);
  const activeReform = INSTITUTIONAL_REFORMS.find(item => item.id === institutions.activeReform) || INSTITUTIONAL_REFORMS[0];
  setHTML("coalitionView", `
    ${metric("Coalizão", state.coalition)}
    ${metric("Oposição", state.opposition, true)}
    ${metric("Corrupção", state.corruption, true)}
    ${metric("Pressão Congresso", state.congressPressure || 0, (state.congressPressure || 0) > 65)}
    ${metric("Força de votação", votingPower(state))}
    ${metric("Risco impeachment", impeachmentRisk(state), true)}
  `);

  setHTML("institutionalOverview", `
    <div data-i18n-final="true">
      <div class="institutionHero">
        <div><span>${t("institutions.health")}</span><b>${institutionalHealthScore(state)}/100</b><small>${t(activeReform.nameKey)}</small></div>
        <div><span>${t("institutions.governability")}</span><b>${Math.round(snapshot.governability)}%</b><small>${t("institutions.reformCapacity")}: ${Math.round(snapshot.reformCapacity)}%</small></div>
        <div><span>${t("institutions.legalSecurity")}</span><b>${Math.round(snapshot.legalSecurity)}%</b><small>${t("institutions.ruleOfLaw")}: ${Math.round(institutions.ruleOfLaw)}%</small></div>
        <div><span>${t("institutions.institutionalRisk")}</span><b class="${snapshot.institutionalRisk>65?"neg":"pos"}">${Math.round(snapshot.institutionalRisk)}%</b><small>${t("institutions.tension")}: ${Math.round(institutions.constitutionalTension)}%</small></div>
      </div>
      <div class="institutionAlert ${institutions.lastDiagnosis?.severity || "info"}"><b>${t("institutions.currentDiagnosis")}</b><span>${t(institutions.lastDiagnosis?.messageKey || "institutions.diagnosis.normal")}</span></div>
    </div>
  `);

  setHTML("institutionalMetrics", `
    <div data-i18n-final="true" class="institutionMetricGrid">
      ${metric(t("institutions.checks"), institutions.checksAndBalances, institutions.checksAndBalances < 38)}
      ${metric(t("institutions.judiciary"), institutions.judicialIndependence, institutions.judicialIndependence < 38)}
      ${metric(t("institutions.bureaucracy"), institutions.bureaucraticCapacity, institutions.bureaucraticCapacity < 38)}
      ${metric(t("institutions.regulatoryQuality"), institutions.regulatoryQuality, institutions.regulatoryQuality < 38)}
      ${metric(t("institutions.federalCoordination"), institutions.federalCoordination, institutions.federalCoordination < 38)}
      ${metric(t("institutions.transparency"), institutions.transparency, institutions.transparency < 38)}
      ${metric(t("institutions.oversightPressure"), institutions.oversightPressure, institutions.oversightPressure > 72)}
      ${metric(t("institutions.legislativeBacklog"), institutions.legislativeBacklog, institutions.legislativeBacklog > 70)}
    </div>
  `);

  setHTML("institutionProfiles", `<div data-i18n-final="true" class="institutionGrid">${INSTITUTION_PROFILES.map(profile => { const current = institutions.institutions.find(item => item.id === profile.id) || profile; return `<article class="institutionCard"><header><span>${profile.icon}</span><div><b>${t(profile.nameKey)}</b><small>${t(profile.textKey)}</small></div></header>${metric(t("institutions.efficiency"), current.efficiency, current.efficiency < 38)}${metric(t("institutions.trust"), current.trust, current.trust < 38)}${metric(t("institutions.risk"), current.risk, current.risk > 66)}</article>`; }).join("")}</div>`);

  setHTML("institutionalReforms", `<div data-i18n-final="true" class="policyGridInner">${INSTITUTIONAL_REFORMS.map(reform => `<article class="policyTile ${reform.id===institutions.activeReform?"active":""}"><h4>${t(reform.nameKey)}</h4><p>${t(reform.textKey)}</p><button class="dark" data-institutional-reform="${reform.id}" ${reform.id===institutions.activeReform?"disabled":""}>${reform.id===institutions.activeReform?t("institutions.active"):t("institutions.adopt")}</button></article>`).join("")}</div>`);
  bind("[data-institutional-reform]", btn => actions.setInstitutionalReform(btn.dataset.institutionalReform));

  setHTML("institutionalActions", `<div data-i18n-final="true" class="decisionDeckInner">${INSTITUTIONAL_ACTIONS.map(action => { const key=`institutions:action:${action.id}`; const cooldown=Number(state.cooldowns?.[key]||0); const disabled=cooldown>0 || Number(state.treasury||0)<Number(action.cost||0) || state.careerStatus!=="active"; return `<article class="decision"><h4>${t(action.titleKey)}</h4><p>${t(action.textKey)}</p><small>${t("institutions.costLine", { cost:action.cost, ap:action.actionPoints, days:action.lagDays||60 })}${cooldown?` • ${t("institutions.cooldown", { days:cooldown })}`:""}</small><button data-institutional-action="${action.id}" ${disabled?"disabled":""}>${cooldown?t("institutions.wait"):t("institutions.execute")}</button></article>`; }).join("")}</div>`);
  bind("[data-institutional-action]", btn => actions.runInstitutionalAction(btn.dataset.institutionalAction));

  setHTML("institutionalHistory", `<div data-i18n-final="true">${institutions.history.length ? institutions.history.slice(-8).reverse().map(item => `<div class="historyRow"><b>${String(item.m).padStart(2,"0")}/${item.y}</b><span>${t("institutions.health")}: ${Number(item.score).toFixed(1)}%</span><span>${t("institutions.institutionalRisk")}: ${Number(item.risk).toFixed(1)}%</span><span>${t("institutions.governability")}: ${Number(item.governability).toFixed(1)}%</span></div>`).join("") : `<p>${t("institutions.noHistory")}</p>`}</div>`);

  setHTML("cabinetOverview", `
    <div data-i18n-final="true">
      <div class="cabinetHero">
        <div><span>${t("cabinet.health")}</span><b>${cabinetHealthScore(state)}/100</b><small>${t(activeCabinetStyle.nameKey)}</small></div>
        <div><span>${t("cabinet.governability")}</span><b>${Math.round(cabinetSnapshot.governability)}%</b><small>${t("cabinet.coordination")}: ${Math.round(cabinet.policyCoordination)}%</small></div>
        <div><span>${t("cabinet.delivery")}</span><b>${Math.round(cabinetSnapshot.deliveryAvg)}%</b><small>${t("cabinet.budgetExecution")}: ${Math.round(cabinet.budgetExecution)}%</small></div>
        <div><span>${t("cabinet.executionRisk")}</span><b class="${cabinetSnapshot.executionRisk>65?"neg":"pos"}">${Math.round(cabinetSnapshot.executionRisk)}%</b><small>${t("cabinet.scandalExposure")}: ${Math.round(cabinet.scandalExposure)}%</small></div>
      </div>
      <div class="institutionAlert ${cabinet.lastDiagnosis?.severity || "info"}"><b>${t("cabinet.currentDiagnosis")}</b><span>${t(cabinet.lastDiagnosis?.messageKey || "cabinet.diagnosis.normal")}</span></div>
    </div>
  `);

  setHTML("cabinetMetrics", `
    <div data-i18n-final="true" class="cabinetMetricGrid">
      ${metric(t("cabinet.cohesion"), cabinet.cabinetCohesion, cabinet.cabinetCohesion < 38)}
      ${metric(t("cabinet.competence"), cabinet.cabinetCompetence, cabinet.cabinetCompetence < 38)}
      ${metric(t("cabinet.coordination"), cabinet.policyCoordination, cabinet.policyCoordination < 38)}
      ${metric(t("cabinet.deliveryCapacity"), cabinet.deliveryCapacity, cabinet.deliveryCapacity < 38)}
      ${metric(t("cabinet.bureaucraticEfficiency"), cabinet.bureaucraticEfficiency, cabinet.bureaucraticEfficiency < 38)}
      ${metric(t("cabinet.administrativeLoad"), cabinet.administrativeLoad, cabinet.administrativeLoad > 72)}
      ${metric(t("cabinet.appointmentPressure"), cabinet.appointmentPressure, cabinet.appointmentPressure > 72)}
      ${metric(t("cabinet.federalAlignment"), cabinet.federalAlignment, cabinet.federalAlignment < 38)}
    </div>
  `);

  setHTML("cabinetPortfolios", `<div data-i18n-final="true" class="cabinetPortfolioGrid">${CABINET_PORTFOLIOS.map(profile => { const current = cabinet.portfolios.find(item => item.id === profile.id) || {}; return `<article class="cabinetCard"><header><span>${profile.icon}</span><div><b>${t(profile.nameKey)}</b><small>${t(profile.textKey)}</small></div></header>${metric(t("cabinet.performance"), current.performance, current.performance < 38)}${metric(t("cabinet.delivery"), current.delivery, current.delivery < 38)}${metric(t("cabinet.risk"), current.risk, current.risk > 66)}</article>`; }).join("")}</div>`);

  setHTML("cabinetStyles", `<div data-i18n-final="true" class="policyGridInner">${CABINET_STYLES.map(style => `<article class="policyTile ${style.id===cabinet.activeStyle?"active":""}"><h4>${t(style.nameKey)}</h4><p>${t(style.textKey)}</p><button class="dark" data-cabinet-style="${style.id}" ${style.id===cabinet.activeStyle?"disabled":""}>${style.id===cabinet.activeStyle?t("cabinet.active"):t("cabinet.adopt")}</button></article>`).join("")}</div>`);
  bind("[data-cabinet-style]", btn => actions.setCabinetStyle(btn.dataset.cabinetStyle));

  setHTML("cabinetActions", `<div data-i18n-final="true" class="decisionDeckInner">${CABINET_ACTIONS.map(action => { const key=`cabinet:action:${action.id}`; const cooldown=Number(state.cooldowns?.[key]||0); const disabled=cooldown>0 || Number(state.treasury||0)<Number(action.cost||0) || state.careerStatus!=="active"; return `<article class="decision"><h4>${t(action.titleKey)}</h4><p>${t(action.textKey)}</p><small>${t("cabinet.costLine", { cost:action.cost, ap:action.actionPoints, days:action.lagDays||45 })}${cooldown?` • ${t("cabinet.cooldown", { days:cooldown })}`:""}</small><button data-cabinet-action="${action.id}" ${disabled?"disabled":""}>${cooldown?t("cabinet.wait"):t("cabinet.execute")}</button></article>`; }).join("")}</div>`);
  bind("[data-cabinet-action]", btn => actions.runCabinetAction(btn.dataset.cabinetAction));

  setHTML("cabinetHistory", `<div data-i18n-final="true">${cabinet.history.length ? cabinet.history.slice(-8).reverse().map(item => `<div class="historyRow"><b>${String(item.m).padStart(2,"0")}/${item.y}</b><span>${t("cabinet.health")}: ${Number(item.score).toFixed(1)}%</span><span>${t("cabinet.executionRisk")}: ${Number(item.risk).toFixed(1)}%</span><span>${t("cabinet.delivery")}: ${Number(item.delivery).toFixed(1)}%</span></div>`).join("") : `<p>${t("cabinet.noHistory")}</p>`}</div>`);

  setHTML("congressView", CONGRESS_PARTIES.map(p => `
    <div class="sector">
      <b>${p.sigla} • ${p.seats} deputados</b>
      ${miniBar(adjustPartyLoyalty(state, p))}
      <small>${p.leaning} • demanda: ${p.demand}</small>
    </div>
  `).join(""));

  setHTML("ministries", cabinet.portfolios.map(item => { const profile = CABINET_PORTFOLIOS.find(p => p.id === item.id) || {}; return `
    <div class="sector" data-i18n-final="true">
      <b>${t(profile.nameKey || "cabinet.portfolio.civil.name")}</b>
      ${miniBar(item.performance, item.performance < 38)}
      <small>${t("cabinet.delivery")}: ${Math.round(item.delivery)}% • ${t("cabinet.risk")}: ${Math.round(item.risk)}%</small>
    </div>
  `; }).join(""));

  setHTML("governmentActions", GOVERNMENT_ACTIONS.map(a => `<article class="decision"><h4>${a.title}</h4><p>${a.text}</p><button data-gov-action="${a.id}">${a.cost ? "₿ "+a.cost+" bi" : "EXECUTAR"}</button></article>`).join(""));
  bind("[data-gov-action]", btn => actions.runGovernmentAction(btn.dataset.govAction));

  setHTML("lawProjects", LAW_PROJECTS.map(l => `<article class="decision"><h4>${l.title}</h4><p>${l.text}</p><small>Dificuldade ${l.difficulty}% • Capital ${l.costPolitical}</small><button data-law="${l.id}">VOTAR LEI</button></article>`).join(""));
  bind("[data-law]", btn => actions.voteLaw(btn.dataset.law));

  setHTML("approvedLaws", (state.approvedLaws || []).map(l => `<div class="feedItem positive">${l}</div>`).join("") || "<p>Nenhuma lei aprovada ainda.</p>");
}

function adjustPartyLoyalty(state, party) {
  let value = party.loyalty + (state.coalition - 50) * 0.45 - (state.corruption > 45 ? 5 : 0);
  if (party.sigla === state.party) value += 15;
  return clamp(value);
}

function renderEconomy(state, actions) {
  const report = calculateMonthlyEconomy(state);
  const deep = ensureDeepEconomyState(state);
  const snapshot = calculateDeepEconomySnapshot(state, report);
  const health = economicHealthScore(state);
  const activeFiscal = FISCAL_RULES.find(item => item.id === deep.fiscalRule) || FISCAL_RULES[0];
  const activeMonetary = MONETARY_POLICIES.find(item => item.id === deep.monetaryPolicy) || MONETARY_POLICIES[0];
  const budgetTax = ensureBudgetTaxState(state);
  const budgetSnapshot = calculateBudgetTaxSnapshot(state, report);
  const budgetHealth = budgetTaxHealthScore(state);
  const activeSpendingRule = SPENDING_RULES.find(item => item.id === budgetTax.activeSpendingRule) || SPENDING_RULES[0];
  setHTML("econReport", `
    <div data-i18n-final="true">
    <div class="econHero deepEconomyHero">
      <div><span>${t("economyDeep.realGdp")}</span><b>₿ ${fmt(deep.realGdp)} bi</b><small>${t("economyDeep.nominal")}: ₿ ${fmt(deep.nominalGdp)} bi</small></div>
      <div><span>${t("economyDeep.monthlyBalance")}</span><b class="${snapshot.fiscalBalance>=0?"pos":"neg"}">₿ ${fmt(snapshot.fiscalBalance)} bi</b><small>${t("economyDeep.primary")}: ₿ ${fmt(snapshot.primaryResult)} bi</small></div>
      <div><span>${t("economyDeep.growth")}</span><b>${snapshot.annualizedGrowth.toFixed(2)}%</b><small>${t("economyDeep.quarter")}: ${snapshot.quarterlyGrowth.toFixed(2)}%</small></div>
      <div><span>${t("economyDeep.health")}</span><b>${health}/100</b><small>${t(activeFiscal.nameKey)} • ${t(activeMonetary.nameKey)}</small></div>
    </div>
    <div class="econGrid deepEconomyGrid">
      ${metric(t("economyDeep.debt"), state.debt, state.debt > 70)}
      ${metric(t("economyDeep.inflation"), state.inflation * 4, state.inflation > 9)}
      ${metric(t("economyDeep.unemployment"), state.unemployment * 5, state.unemployment > 12)}
      ${metric(t("economyDeep.interest"), state.interestRate * 4, state.interestRate > 12)}
      ${metric(t("economyDeep.exchange"), deep.exchangeRate * 10, deep.exchangeRate > 6.2)}
      ${metric(t("economyDeep.reserves"), deep.reserves / 5, deep.reserves < 180)}
      ${metric(t("economyDeep.productivity"), deep.productivity, deep.productivity < 38)}
      ${metric(t("economyDeep.costOfLiving"), deep.costOfLiving, deep.costOfLiving > 65)}
      ${metric(t("economyDeep.privateInvestment"), deep.privateInvestment, deep.privateInvestment < 35)}
      ${metric(t("economyDeep.realWage"), deep.realWage, deep.realWage < 38)}
      ${metric(t("economyDeep.informalEconomy"), deep.informalEconomy, deep.informalEconomy > 45)}
      ${metric(t("economyDeep.riskPremium"), deep.riskPremium * 7, deep.riskPremium > 7)}
    </div>
    </div>
  `);

  setHTML("deepEconomyPanel", `
    <div data-i18n-final="true">
    <div class="deepEconomyMatrix">
      <article><b>${t("economyDeep.fiscalPosition")}</b><span>${t("economyDeep.revenue")}: ₿ ${fmt(snapshot.primaryRevenue)} bi</span><span>${t("economyDeep.expense")}: ₿ ${fmt(snapshot.primaryExpense)} bi</span><span>${t("economyDeep.debtService")}: ₿ ${fmt(snapshot.debtService)} bi</span></article>
      <article><b>${t("economyDeep.externalSector")}</b><span>${t("economyDeep.exports")}: ₿ ${fmt(deep.exports)} bi</span><span>${t("economyDeep.imports")}: ₿ ${fmt(deep.imports)} bi</span><span>${t("economyDeep.currentAccount")}: ${deep.currentAccount.toFixed(2)}%</span></article>
      <article><b>${t("economyDeep.households")}</b><span>${t("economyDeep.consumerConfidence")}: ${Math.round(deep.consumerConfidence)}%</span><span>${t("economyDeep.householdDebt")}: ${Math.round(deep.householdDebt)}%</span><span>${t("economyDeep.middleClass")}: ${Math.round(deep.middleClassSecurity)}%</span></article>
    </div>
    <div class="economicShock ${deep.lastShock?.severity || "info"}"><b>${t("economyDeep.currentDiagnosis")}</b><span>${translateText(deep.lastShock?.message || t("economyDeep.noShock"))}</span></div>
    </div>
  `);

  setHTML("fiscalRules", `<div data-i18n-final="true" class="policyGridInner">${FISCAL_RULES.map(rule => `<article class="policyTile ${rule.id===deep.fiscalRule?"active":""}"><h4>${t(rule.nameKey)}</h4><p>${t(rule.textKey)}</p><button class="dark" data-fiscal-rule="${rule.id}" ${rule.id===deep.fiscalRule?"disabled":""}>${rule.id===deep.fiscalRule?t("economyDeep.active"):t("economyDeep.adopt")}</button></article>`).join("")}</div>`);
  bind("[data-fiscal-rule]", btn => actions.setFiscalRule(btn.dataset.fiscalRule));
  setHTML("monetaryPolicies", `<div data-i18n-final="true" class="policyGridInner">${MONETARY_POLICIES.map(policy => `<article class="policyTile ${policy.id===deep.monetaryPolicy?"active":""}"><h4>${t(policy.nameKey)}</h4><p>${t(policy.textKey)}</p><button class="dark" data-monetary-policy="${policy.id}" ${policy.id===deep.monetaryPolicy?"disabled":""}>${policy.id===deep.monetaryPolicy?t("economyDeep.active"):t("economyDeep.adopt")}</button></article>`).join("")}</div>`);
  bind("[data-monetary-policy]", btn => actions.setMonetaryPolicy(btn.dataset.monetaryPolicy));
  setHTML("productivePrograms", `<div data-i18n-final="true" class="decisionDeckInner">${[...TRADE_STRATEGIES, ...PRODUCTIVE_PROGRAMS].map(action => { const key=`deep:economy:${action.id}`; const cooldown=Number(state.cooldowns?.[key]||0); const disabled=cooldown>0 || Number(state.treasury||0)<Number(action.cost||0) || state.careerStatus!=="active"; return `<article class="decision"><h4>${t(action.titleKey || action.nameKey)}</h4><p>${t(action.textKey)}</p><small>${t("economyDeep.costLine", { cost:action.cost, ap:action.actionPoints, days:action.lagDays||60 })}${cooldown?` • ${t("economyDeep.cooldown", { days:cooldown })}`:""}</small><button data-deep-economy-action="${action.id}" ${disabled?"disabled":""}>${cooldown?t("economyDeep.wait"):t("economyDeep.execute")}</button></article>`; }).join("")}</div>`);
  bind("[data-deep-economy-action]", btn => actions.runDeepEconomyAction(btn.dataset.deepEconomyAction));

  setHTML("deepEconomyHistory", `<div data-i18n-final="true">${deep.monthlyHistory.length ? deep.monthlyHistory.slice(-8).reverse().map(item => `<div class="historyRow"><b>${String(item.m).padStart(2,"0")}/${item.y}</b><span>${t("economyDeep.growth")}: ${Number(item.growth).toFixed(2)}%</span><span>${t("economyDeep.balance")}: ₿ ${fmt(item.balance)} bi</span><span>${t("economyDeep.debt")}: ${Number(item.debt).toFixed(1)}%</span></div>`).join("") : `<p>${t("economyDeep.noHistory")}</p>`}</div>`);


  setHTML("budgetTaxOverview", `
    <div data-i18n-final="true">
      <div class="budgetTaxHero">
        <div><span>${t("budgetTax.health")}</span><b>${budgetHealth}/100</b><small>${t(activeSpendingRule.nameKey)}</small></div>
        <div><span>${t("budgetTax.primaryBalance")}</span><b class="${budgetSnapshot.primaryBalance>=0?"pos":"neg"}">₿ ${fmt(budgetSnapshot.primaryBalance)} bi</b><small>${t("budgetTax.fiscalSpace")}: ${Math.round(budgetSnapshot.fiscalSpace)}%</small></div>
        <div><span>${t("budgetTax.weightedRate")}</span><b>${budgetSnapshot.weightedRate.toFixed(1)}%</b><small>${t("budgetTax.taxPressure")}: ${Math.round(budgetSnapshot.taxPressure)}%</small></div>
        <div><span>${t("budgetTax.compliance")}</span><b>${Math.round(budgetTax.taxCompliance)}%</b><small>${t("budgetTax.evasion")}: ${Math.round(budgetTax.evasionRate)}%</small></div>
      </div>
      <div class="deepEconomyMatrix budgetTaxMatrix">
        <article><b>${t("budgetTax.revenueComposition")}</b><span>${t("budgetTax.direct")}: ${budgetTax.revenueMix.direct}%</span><span>${t("budgetTax.indirect")}: ${budgetTax.revenueMix.indirect}%</span><span>${t("budgetTax.payroll")}: ${budgetTax.revenueMix.payroll}% • ${t("budgetTax.green")}: ${budgetTax.revenueMix.green}%</span></article>
        <article><b>${t("budgetTax.spendingQuality")}</b><span>${t("budgetTax.mandatory")}: ${Math.round(budgetTax.mandatorySpendingRatio)}%</span><span>${t("budgetTax.efficiency")}: ${Math.round(budgetTax.spendingEfficiency)}%</span><span>${t("budgetTax.capitalExecution")}: ${Math.round(budgetTax.capitalExecution)}%</span></article>
        <article><b>${t("budgetTax.returnTitle")}</b><span>${t("budgetTax.socialReturn")}: ${Math.round(budgetSnapshot.socialReturn)}%</span><span>${t("budgetTax.investmentReturn")}: ${Math.round(budgetSnapshot.investmentReturn)}%</span><span>${t("budgetTax.regionalBalance")}: ${Math.round(budgetTax.regionalBalance)}%</span></article>
      </div>
    </div>
  `);

  setHTML("taxInstrumentControls", `<div data-i18n-final="true" class="taxInstrumentGrid">${TAX_INSTRUMENTS.map(item => `<article class="taxInstrument"><header><b>${t(item.nameKey)}</b><strong>${Math.round(budgetTax.taxRates[item.rateKey])}%</strong></header><p>${t(item.textKey)}</p><input type="range" min="${item.min}" max="${item.max}" value="${Math.round(budgetTax.taxRates[item.rateKey])}" data-tax-rate="${item.rateKey}"><small>${t("budgetTax.range", { min:item.min, max:item.max })}</small></article>`).join("")}</div>`);
  bind("[data-tax-rate]", input => actions.setTaxRate(input.dataset.taxRate, input.value));

  setHTML("spendingRules", `<div data-i18n-final="true" class="policyGridInner">${SPENDING_RULES.map(rule => `<article class="policyTile ${rule.id===budgetTax.activeSpendingRule?"active":""}"><h4>${t(rule.nameKey)}</h4><p>${t(rule.textKey)}</p><button class="dark" data-spending-rule="${rule.id}" ${rule.id===budgetTax.activeSpendingRule?"disabled":""}>${rule.id===budgetTax.activeSpendingRule?t("economyDeep.active"):t("economyDeep.adopt")}</button></article>`).join("")}</div>`);
  bind("[data-spending-rule]", btn => actions.setSpendingRule(btn.dataset.spendingRule));

  setHTML("budgetTaxActions", `<div data-i18n-final="true" class="decisionDeckInner">${BUDGET_TAX_ACTIONS.map(action => { const key=`budget:tax:${action.id}`; const cooldown=Number(state.cooldowns?.[key]||0); const disabled=cooldown>0 || Number(state.treasury||0)<Number(action.cost||0) || state.careerStatus!=="active"; return `<article class="decision"><h4>${t(action.titleKey)}</h4><p>${t(action.textKey)}</p><small>${t("economyDeep.costLine", { cost:action.cost, ap:action.actionPoints, days:action.lagDays||60 })}${cooldown?` • ${t("economyDeep.cooldown", { days:cooldown })}`:""}</small><button data-budget-tax-action="${action.id}" ${disabled?"disabled":""}>${cooldown?t("economyDeep.wait"):t("economyDeep.execute")}</button></article>`; }).join("")}</div>`);
  bind("[data-budget-tax-action]", btn => actions.runBudgetTaxAction(btn.dataset.budgetTaxAction));

  setHTML("budgetTaxHistory", `<div data-i18n-final="true">${budgetTax.history.length ? budgetTax.history.slice(-8).reverse().map(item => `<div class="historyRow"><b>${String(item.m).padStart(2,"0")}/${item.y}</b><span>${t("budgetTax.revenue")}: ₿ ${fmt(item.revenue)} bi</span><span>${t("budgetTax.expense")}: ₿ ${fmt(item.expense)} bi</span><span>${t("budgetTax.balance")}: ₿ ${fmt(item.balance)} bi</span></div>`).join("") : `<p>${t("budgetTax.noHistory")}</p>`}</div>`);

  setHTML("budgetSliders", Object.entries(state.budget).map(([k,v]) => `
    <div class="metricRow budgetRow">
      <label>${labelBudget(k)}</label>
      <input type="range" min="10" max="45" value="${v}" data-budget="${k}">
      <b>${v}%</b>
    </div>
  `).join(""));
  bind("[data-budget]", input => actions.changeBudget(input.dataset.budget, input.value));

  setHTML("taxProfiles", TAX_PROFILES.map(p => `<button class="dark" data-tax="${p.id}">${translateText(p.name)}</button>`).join(""));
  bind("[data-tax]", btn => actions.applyTax(btn.dataset.tax));

  setHTML("economicMeasures", `<div data-i18n-final="true" class="decisionDeckInner">${ECONOMIC_MEASURES.map(m => `<article class="decision"><h4>${translateText(m.title)}</h4><p>${translateText(m.text)}</p><button data-econ-measure="${m.id}">${m.cost ? "₿ "+m.cost+" bi" : t("economyDeep.execute")}</button></article>`).join("")}</div>`);
  bind("[data-econ-measure]", btn => actions.runEconomyMeasure(btn.dataset.econMeasure));

  setHTML("sectorReport", `<div data-i18n-final="true" class="sectorReportInner">${ECONOMIC_SECTORS.map(s => `<div class="sector"><b>${s.icon} ${translateText(s.name)}</b>${miniBar(state[s.id] ?? 50)}<small>${t("economyDeep.sensitivity")}: ${translateText(s.sensitivity)}</small></div>`).join("")}</div>`);
}

function labelBudget(k) {
  const map = {health:"Saúde",education:"Educação",security:"Segurança",infrastructure:"Infra",social:"Social",industry:"Indústria",technology:"Tecnologia"};
  return map[k] || k;
}



function renderPopulation(state, actions) {
  const population = populationSummary(state);
  const d = population.demographics;
  setHTML("populationOverview", `
    <div class="populationHero">
      <div><span>${t("population.total")}</span><b>${Number(d.populationMillions).toFixed(1)} mi</b></div>
      <div><span>${t("population.satisfaction")}</span><b>${Math.round(population.nationalSatisfaction)}%</b></div>
      <div><span>${t("population.qualityOfLife")}</span><b>${Math.round(population.qualityOfLife)}%</b></div>
      <div><span>${t("population.regionalInequality")}</span><b>${Math.round(population.regionalInequality)}%</b></div>
    </div>
    <div class="populationAlert ${population.nationalSatisfaction < 40 ? "danger" : ""}">
      <span>${t("population.weakestRegion")}</span><b>${population.weakestRegion.icon} ${t(population.weakestRegion.nameKey)}</b>
      <small>${t("population.satisfaction")}: ${Math.round(population.weakestRegion.satisfaction)}%</small>
    </div>`);
  setHTML("regionalPopulation", population.regions.map(region => `
    <article class="regionCard"><header><span>${region.icon}</span><div><b>${t(region.nameKey)}</b><small>${Number(region.populationMillions).toFixed(1)} mi • ${Number(region.populationShare).toFixed(1)}%</small></div><strong>${Math.round(region.satisfaction)}%</strong></header>
      ${miniBar(region.satisfaction, region.satisfaction < 40)}
      <div class="regionMetrics"><span>${t("population.health")} <b>${Math.round(region.health)}</b></span><span>${t("population.education")} <b>${Math.round(region.education)}</b></span><span>${t("population.jobs")} <b>${Math.round(region.employment)}</b></span><span>${t("population.security")} <b>${Math.round(region.security)}</b></span><span>${t("population.infrastructure")} <b>${Math.round(region.infrastructure)}</b></span><span>${t("population.housing")} <b>${Math.round(region.housing)}</b></span></div>
      <footer>${(region.priorities || []).map(need => `<span class="populationNeed">${t(NEED_KEYS[need] || need)}</span>`).join("")}</footer>
    </article>`).join(""));
  setHTML("socialGroups", population.groups.map(group => `
    <article class="socialGroupCard"><header><span>${group.icon}</span><div><b>${t(group.nameKey)}</b><small>${t("population.segmentShare", { value: group.share })}</small></div></header>
      ${metric(t("population.satisfaction"), group.satisfaction, group.satisfaction < 40)}${metric(t("population.trust"), group.trust, group.trust < 40)}${metric(t("population.incomeSecurity"), group.incomeSecurity, group.incomeSecurity < 40)}
      <footer>${(group.priorities || []).map(need => `<span class="populationNeed">${t(NEED_KEYS[need] || need)}</span>`).join("")}</footer>
    </article>`).join(""));
  const rows=[["population.lifeExpectancy",`${Number(d.lifeExpectancy).toFixed(1)} ${t("population.years")}`],["population.literacy",`${Number(d.literacy).toFixed(1)}%`],["population.poverty",`${Number(d.poverty).toFixed(1)}%`],["population.extremePoverty",`${Number(d.extremePoverty).toFixed(1)}%`],["population.hunger",`${Number(d.hunger).toFixed(1)}%`],["population.sanitation",`${Number(d.sanitation).toFixed(1)}%`],["population.housingDeficit",`${Number(d.housingDeficit).toFixed(1)}%`],["population.urbanization",`${Number(d.urbanization).toFixed(1)}%`],["population.medianAge",`${Number(d.medianAge).toFixed(1)} ${t("population.years")}`],["population.growth",`${Number(d.populationGrowth).toFixed(2)}%`]];
  setHTML("demographicIndicators", rows.map(([key,value]) => `<div class="demographicItem"><span>${t(key)}</span><b>${value}</b></div>`).join(""));
  setHTML("populationPolicies", POPULATION_POLICIES.map(policy => { const cooldown=Number(state.cooldowns?.[`population:${policy.id}`]||0); const disabled=cooldown>0||Number(state.treasury||0)<policy.cost||state.careerStatus!=="active"; return `<article class="decision populationPolicy"><h4>${policy.icon} ${t(policy.titleKey)}</h4><p>${t(policy.textKey)}</p><small>${t("population.policyCost", { cost:policy.cost, ap:policy.actionPoints, days:policy.duration })}${cooldown ? ` • ${t("population.cooldown", { days:cooldown })}` : ""}</small><button data-population-policy="${policy.id}" ${disabled ? "disabled" : ""}>${cooldown ? t("population.wait") : t("population.launch")}</button></article>`; }).join(""));
  bind("[data-population-policy]", btn => actions.runPopulationPolicy(btn.dataset.populationPolicy));
  setHTML("populationPrograms", population.activePrograms.length ? population.activePrograms.map(program => { const policy=POPULATION_POLICIES.find(item=>item.id===program.policyId); const targets=(program.targets||[]).map(id=>population.regions.find(r=>r.id===id)).filter(Boolean).map(r=>t(r.nameKey)).join(", "); const progress=100-(Number(program.daysLeft||0)/Math.max(1,Number(program.totalDays||1))*100); return `<div class="populationProgram"><header><b>${policy?.icon||"◆"} ${t(program.titleKey)}</b><span>${t("population.daysRemaining", { days:program.daysLeft })}</span></header>${miniBar(progress)}<small>${targets}</small></div>`; }).join("") : `<p>${t("population.noPrograms")}</p>`);
}

function renderDiplomacy(state, actions) {
  const countries = state.aiCountries || state.relations || [];
  const world = ensureWorldDiplomacyState(state);
  const snapshot = calculateWorldDiplomacySnapshot(state);
  const activeDoctrine = DIPLOMACY_DOCTRINES.find(item => item.id === world.activeDoctrine) || DIPLOMACY_DOCTRINES[0];

  setHTML("globalRiskPanel", `
    <div data-i18n-final="true">
      <div class="mediaHero">
        <div><span>${t("worldDiplomacy.health")}</span><b>${worldDiplomacyHealthScore(state)}/100</b><small>${t(activeDoctrine.nameKey)}</small></div>
        <div><span>${t("worldDiplomacy.globalTrust")}</span><b>${Math.round(world.globalTrust)}%</b><small>${t("worldDiplomacy.softPower")}: ${Math.round(world.softPower)}%</small></div>
        <div><span>${t("worldDiplomacy.risk")}</span><b class="${snapshot.diplomaticRisk>65?"neg":"pos"}">${Math.round(snapshot.diplomaticRisk)}%</b><small>${t("worldDiplomacy.globalTension")}: ${Math.round(state.globalTension || 35)}%</small></div>
        <div><span>${t("worldDiplomacy.tradeWindow")}</span><b>${Math.round(snapshot.tradeWindow)}%</b><small>${t("worldDiplomacy.leverage")}: ${Math.round(snapshot.leverage)}%</small></div>
      </div>
      <div class="institutionAlert ${world.lastDiagnosis?.severity || "info"}"><b>${t("worldDiplomacy.currentDiagnosis")}</b><span>${t(world.lastDiagnosis?.messageKey || "worldDiplomacy.diagnosis.stable")}</span></div>
      <div class="mediaMetricGrid">
        ${metric(t("worldDiplomacy.regionalLeadership"), world.regionalLeadership)}
        ${metric(t("worldDiplomacy.neutrality"), world.neutrality)}
        ${metric(t("worldDiplomacy.blocAlignment"), world.blocAlignment, world.blocAlignment>72)}
        ${metric(t("worldDiplomacy.securityRisk"), world.securityRisk, world.securityRisk>65)}
        ${metric(t("worldDiplomacy.publicScrutiny"), world.publicScrutiny, world.publicScrutiny>65)}
        ${metric(t("worldDiplomacy.multilateralScore"), snapshot.multilateralScore)}
      </div>
    </div>
  `);

  setHTML("countries", `<div data-i18n-final="true" class="countryGrid">${countries.map(c => `
    <div class="country">
      <b>${translateText(c.name)}</b>
      <p>${translateText(c.bloc || c.type)} • ${translateText(c.personality || c.stance)} • ${translateText(relationStatus(c.relation ?? c.rel))}</p>
      ${miniBar(c.relation ?? c.rel)}
      <small>${t("worldDiplomacy.countryTension", { tension: Math.round(c.tension || 0), interests: (c.interests || []).map(item => translateText(item)).join(", ") })}</small>
      <button data-country="${c.id}" data-act="deal" class="dark">${t("worldDiplomacy.deal")}</button>
      <button data-country="${c.id}" data-act="sanction" class="dark">${t("worldDiplomacy.sanction")}</button>
    </div>
  `).join("")}</div>`);
  bind("[data-country]", btn => actions.countryAction(btn.dataset.country, btn.dataset.act));

  setHTML("worldDiplomacyDoctrinePanel", `<div data-i18n-final="true" class="policyGridInner">${DIPLOMACY_DOCTRINES.map(doctrine => `<article class="policyTile ${doctrine.id===world.activeDoctrine?"active":""}"><h4>${t(doctrine.nameKey)}</h4><p>${t(doctrine.textKey)}</p><button class="dark" data-world-diplomacy-doctrine="${doctrine.id}" ${doctrine.id===world.activeDoctrine?"disabled":""}>${doctrine.id===world.activeDoctrine?t("worldDiplomacy.active"):t("worldDiplomacy.adopt")}</button></article>`).join("")}</div>`);
  bind("[data-world-diplomacy-doctrine]", btn => actions.setWorldDiplomacyDoctrine(btn.dataset.worldDiplomacyDoctrine));

  setHTML("globalBlocsPanel", `<div data-i18n-final="true" class="mediaOutletGrid">${(world.blocs || GLOBAL_BLOCS).map(bloc => `<article class="mediaOutletCard"><header><span>${bloc.icon || "◆"}</span><div><b>${t(bloc.nameKey)}</b><small>${t(bloc.textKey)}</small></div></header>${metric(t("worldDiplomacy.alignment"), bloc.alignment)}${metric(t("worldDiplomacy.trade"), bloc.trade)}${metric(t("worldDiplomacy.tension"), bloc.tension, bloc.tension>65)}</article>`).join("")}</div>`);

  setHTML("worldAgendaPanel", `<div data-i18n-final="true" class="mediaAgendaGrid">${(world.agendas || WORLD_AGENDAS).map(agenda => `<article class="mediaAgendaCard"><header><span>${agenda.icon || "◆"}</span><div><b>${t(agenda.nameKey)}</b><small>${t(agenda.textKey)}</small></div></header>${metric(t("worldDiplomacy.pressure"), agenda.pressure, agenda.pressure>66)}${metric(t("worldDiplomacy.opportunity"), agenda.opportunity)}<small>${t("worldDiplomacy.volatility")}: ${Math.round(agenda.volatility)}%</small></article>`).join("")}</div>`);

  setHTML("diplomacyActions", `<div data-i18n-final="true" class="decisionDeckInner">${[...DIPLOMACY_ACTIONS.map(a => ({...a, legacy:true})), ...WORLD_DIPLOMACY_ACTIONS].map(a => { const key = a.legacy ? a.id : `world:diplomacy:action:${a.id}`; const cooldown=Number(state.cooldowns?.[key]||0); const disabled=cooldown>0 || Number(state.treasury||0)<Number(a.cost||0) || state.careerStatus!=="active"; return `<article class="decision"><h4>${a.titleKey?t(a.titleKey):translateText(a.title)}</h4><p>${a.textKey?t(a.textKey):translateText(a.text)}</p><small>${t("worldDiplomacy.costLine", { cost:a.cost||0, ap:a.actionPoints||2, days:a.lagDays||30 })}${cooldown?` • ${t("worldDiplomacy.cooldown", { days:cooldown })}`:""}</small><button ${a.legacy?`data-diplomacy-action="${a.id}"`:`data-world-diplomacy-action="${a.id}"`} ${disabled?"disabled":""}>${cooldown?t("worldDiplomacy.wait"):t("action.execute")}</button></article>`; }).join("")}</div>`);
  bind("[data-diplomacy-action]", btn => actions.runDiplomacyAction(btn.dataset.diplomacyAction));
  bind("[data-world-diplomacy-action]", btn => actions.runWorldDiplomacyAction(btn.dataset.worldDiplomacyAction));

  setHTML("treatyPanel", `<div data-i18n-final="true">${countries.map(c => `
    <div class="sector">
      <b>${translateText(c.name)}</b>
      <div class="buttonGrid">
        ${TREATIES.map(treaty => `<button class="dark" data-treaty="${treaty.id}" data-treaty-country="${c.id}">${translateText(treaty.title)}</button>`).join("")}
      </div>
    </div>
  `).join("")}</div>`);
  bind("[data-treaty]", btn => actions.signTreaty(btn.dataset.treatyCountry, btn.dataset.treaty));

  setHTML("diplomaticHistory", `<div data-i18n-final="true">${(state.treaties || []).map(item => `<div class="feedItem positive"><b>${translateText(item.treaty)}</b><br>${translateText(item.country)} • ${String(item.day).padStart(2,"0")}/${String(item.month).padStart(2,"0")}/${item.year}</div>`).join("") || `<p>${t("worldDiplomacy.noTreaties")}</p>`}${world.history.length ? `<hr><h4>${t("worldDiplomacy.historyTitle")}</h4>${world.history.slice(-6).reverse().map(item => `<div class="historyRow"><b>${String(item.m).padStart(2,"0")}/${item.y}</b><span>${t("worldDiplomacy.health")}: ${Number(item.health).toFixed(0)}</span><span>${t("worldDiplomacy.risk")}: ${Number(item.risk).toFixed(1)}%</span><span>${t("worldDiplomacy.tradeWindow")}: ${Number(item.trade).toFixed(1)}%</span></div>`).join("")}`:""}</div>`);
}


function renderMilitary(state, actions) {
  setHTML("militaryReport", `
    ${metric("Poder militar", state.military)}
    ${metric("Segurança interna", state.security || 52)}
    ${metric("Lealdade", state.loyalty)}
    ${metric("Risco de golpe", calculateCoupRisk(state), calculateCoupRisk(state) > 55)}
    <p>${state.loyalty < 35 ? "Risco de insubordinação militar." : "Comando sob controle."}</p>
  `);

  setHTML("securityRiskPanel", `
    ${metric("Ameaça interna", calculateInternalThreat(state), calculateInternalThreat(state) > 60)}
    ${metric("Crise nacional", (state.crisis || 0) * 10, state.crisis > 5)}
    ${metric("Estabilidade", state.stability)}
    ${metric("Inteligência", state.intelligence)}
  `);

  setHTML("militaryActions", MILITARY_ACTIONS.map(a => `<article class="decision"><h4>${a.title}</h4><p>${a.text}</p><button data-military-action="${a.id}">${a.cost ? "₿ "+a.cost+" bi" : "EXECUTAR"}</button></article>`).join(""));
  bind("[data-military-action]", btn => actions.runMilitaryAction(btn.dataset.militaryAction));
}


function renderIntelligence(state, actions) {
  setHTML("intelReport", `
    ${metric("Capacidade", state.intelligence)}
    ${metric("Risco escândalo", state.corruption + (100-state.media)/6, true)}
    ${metric("Pressão da elite", state.elite)}
    ${metric("Ameaça interna", calculateInternalThreat(state), calculateInternalThreat(state) > 60)}
  `);

  setHTML("intelOperations", INTEL_OPERATIONS.map(o => `<article class="decision"><h4>${o.title}</h4><p>${o.text}</p><small>Risco operacional ${o.risk}%</small><button data-intel-operation="${o.id}">${o.cost ? "₿ "+o.cost+" bi" : "EXECUTAR"}</button></article>`).join(""));
  bind("[data-intel-operation]", btn => actions.runIntelOperation(btn.dataset.intelOperation));

  setHTML("operationsHistory", (state.activeOperations || []).map(o => `<div class="feedItem ${o.result === "sucesso" ? "positive" : "negative"}"><b>${o.title}</b><br>${o.result} • ${String(o.day).padStart(2,"0")}/${String(o.month).padStart(2,"0")}/${o.year}</div>`).join("") || "<p>Nenhuma operação executada ainda.</p>");
}

function renderProjects(state, actions) {
  setHTML("projectsList", PROJECTS.map(p => `<article class="decision"><h4>${p.title}</h4><p>${p.days} dias • custo ₿ ${p.cost} bi</p><button data-project="${p.id}">INICIAR PROJETO</button></article>`).join(""));
  bind("[data-project]", btn => actions.startProject(btn.dataset.project));
  setHTML("projectQueue", state.projects.map(p=>`<div class="feedItem"><b>${p.title}</b><br>${p.left} dias restantes</div>`).join("") || "<p>Fila vazia.</p>");
}


function renderPress(state, actions) {
  const media = ensureMediaPublicState(state);
  const snapshot = calculateMediaSnapshot(state);
  const activeDoctrine = MEDIA_DOCTRINES.find(item => item.id === media.activeDoctrine) || MEDIA_DOCTRINES[0];
  const press = PRESS_BRIEFINGS[(state.day + state.month) % PRESS_BRIEFINGS.length];
  setLocalizedText("pressQuestion", `${t(press.topicKey || press.topic)}: ${t(press.questionKey || press.question)}`);
  setHTML("pressAnswers", press.answers.map((a,i)=>`<article class="decision"><h4>${t(a.toneKey || a.tone).toUpperCase()}</h4><p>${t(a.labelKey || a.label)}</p><small>${formatEffects(a.effects)}</small><button data-press="${i}">${t("action.answer")}</button></article>`).join(""));
  bind("[data-press]", btn => actions.answerPress(Number(btn.dataset.press)));

  setHTML("publicOpinion", `
    <div data-i18n-final="true">
      <div class="mediaHero">
        <div><span>${t("media.health")}</span><b>${mediaHealthScore(state)}/100</b><small>${t(activeDoctrine.nameKey)}</small></div>
        <div><span>${t("media.publicMood")}</span><b>${Math.round(snapshot.publicMood)}%</b><small>${t("media.credibility")}: ${Math.round(snapshot.credibility)}%</small></div>
        <div><span>${t("media.hostility")}</span><b class="${snapshot.hostility>65?"neg":"pos"}">${Math.round(snapshot.hostility)}%</b><small>${t("media.agendaRisk")}: ${Math.round(snapshot.agendaRisk)}%</small></div>
        <div><span>${t("media.trust")}</span><b>${Math.round(media.trust)}%</b><small>${t("media.pressFreedom")}: ${Math.round(media.pressFreedom)}%</small></div>
      </div>
      <div class="institutionAlert ${media.lastDiagnosis?.severity || "info"}"><b>${t("media.currentDiagnosis")}</b><span>${t(media.lastDiagnosis?.messageKey || "media.diagnosis.normal")}</span></div>
    </div>
  `);

  setHTML("mediaNarrativeOverview", `
    <div data-i18n-final="true" class="mediaMetricGrid">
      ${metric(t("media.govNarrative"), state.govNarrative || 50)}
      ${metric(t("media.messageDiscipline"), media.messageDiscipline, media.messageDiscipline < 38)}
      ${metric(t("media.policyClarity"), media.policyClarity, media.policyClarity < 38)}
      ${metric(t("media.socialReach"), media.socialReach, media.socialReach < 34)}
      ${metric(t("media.regionalReach"), media.regionalReach, media.regionalReach < 34)}
      ${metric(t("media.polarization"), media.polarization, media.polarization > 68)}
      ${metric(t("media.disinformationRisk"), media.disinformationRisk, media.disinformationRisk > 65)}
      ${metric(t("media.scandalAttention"), media.scandalAttention, media.scandalAttention > 65)}
    </div>
  `);

  setHTML("mediaDoctrinePanel", `<div data-i18n-final="true" class="policyGridInner">${MEDIA_DOCTRINES.map(doctrine => `<article class="policyTile ${doctrine.id===media.activeDoctrine?"active":""}"><h4>${t(doctrine.nameKey)}</h4><p>${t(doctrine.textKey)}</p><button class="dark" data-media-doctrine="${doctrine.id}" ${doctrine.id===media.activeDoctrine?"disabled":""}>${doctrine.id===media.activeDoctrine?t("media.active"):t("media.adopt")}</button></article>`).join("")}</div>`);
  bind("[data-media-doctrine]", btn => actions.setMediaDoctrine(btn.dataset.mediaDoctrine));

  setHTML("mediaAgendaPanel", `<div data-i18n-final="true" class="mediaAgendaGrid">${MEDIA_AGENDAS.map(profile => { const current = media.agendas.find(item => item.id === profile.id) || {}; const trend = Number(current.trend || 0); return `<article class="mediaAgendaCard"><header><span>${profile.icon}</span><div><b>${t(profile.nameKey)}</b><small>${t(profile.textKey)}</small></div></header>${metric(t("media.pressure"), current.pressure || 0, Number(current.pressure || 0)>66)}${metric(t("media.salience"), current.salience || 0, Number(current.salience || 0)>66)}<small>${t("media.trend")}: ${trend>=0?"+":""}${trend.toFixed(1)}</small></article>`; }).join("")}</div>`);

  setHTML("mediaOutlets", `<div data-i18n-final="true" class="mediaOutletGrid">${MEDIA_OUTLETS.map(o => { const current = media.outlets.find(item => item.id === o.id) || {}; return `
    <article class="mediaOutletCard">
      <header><span>${o.icon || "◆"}</span><div><b>${t(o.nameKey || o.name)}</b><small>${t(o.typeKey || o.type)} • ${t(o.textKey || "")}</small></div></header>
      ${miniBar(current.relationship ?? (o.stance + state.media) / 2)}
      <small>${t("media.reach")}: ${Math.round(current.reach ?? o.reach)}% • ${t("media.trust")}: ${Math.round(current.trust ?? o.trust)}% • ${t("media.pressure")}: ${Math.round(current.pressure ?? 0)}%</small>
    </article>
  `; }).join("")}</div>`);

  setHTML("headlines", `<div data-i18n-final="true">${(state.headlines || []).map(h => `<div class="feedItem ${h.type}"><b>${t(h.textKey || h.text)}</b><br><small>${t("media.publicMood")} ${h.mood}% • ${t("media.hostility")} ${h.hostility}%${h.credibility !== undefined ? ` • ${t("media.credibility")} ${h.credibility}%` : ""}</small></div>`).join("") || `<p>${t("media.noHeadlines")}</p>`}</div>`);

  setHTML("mediaActions", `<div data-i18n-final="true" class="decisionDeckInner">${MEDIA_ACTIONS.map(a => { const key=`media:action:${a.id}`; const cooldown=Number(state.cooldowns?.[key]||0); const disabled=cooldown>0 || Number(state.treasury||0)<Number(a.cost||0) || state.careerStatus!=="active"; return `<article class="decision"><h4>${t(a.titleKey || a.title)}</h4><p>${t(a.textKey || a.text)}</p><small>${t("media.costLine", { cost:a.cost||0, ap:a.actionPoints||1, days:a.lagDays||15 })}${cooldown?` • ${t("media.cooldown", { days:cooldown })}`:""}</small><button data-media-action="${a.id}" ${disabled?"disabled":""}>${cooldown?t("media.wait"):t("action.execute")}</button></article>`; }).join("")}</div>`);
  bind("[data-media-action]", btn => actions.runMediaAction(btn.dataset.mediaAction));

  setHTML("mediaHistory", `<div data-i18n-final="true">${media.history.length ? media.history.slice(-8).reverse().map(item => `<div class="historyRow"><b>${String(item.m).padStart(2,"0")}/${item.y}</b><span>${t("media.publicMood")}: ${Number(item.mood).toFixed(1)}%</span><span>${t("media.hostility")}: ${Number(item.hostility).toFixed(1)}%</span><span>${t("media.credibility")}: ${Number(item.credibility).toFixed(1)}%</span></div>`).join("") : `<p>${t("media.noHistory")}</p>`}</div>`);
}


function renderElections(state, actions) {
  const poll = nationalPoll(state);
  const opponent = mainOpponent(state);
  const regions = regionalPolls(state);

  setHTML("electionReport", `
    <div class="econHero">
      <div><span>Governo</span><b>${Math.round(poll.incumbent)}%</b></div>
      <div><span>Oposição</span><b>${Math.round(poll.opposition)}%</b></div>
      <div><span>Adversário</span><b>${opponent.name}</b></div>
    </div>
    ${metric("Campanha", state.campaign)}
    ${metric("Rejeição", state.rejection || 30, (state.rejection || 30) > 45)}
    ${metric("Chance nacional", voteChance(state))}
    <p><b>Dias para eleição:</b> ${state.electionDays}</p>
    ${state.lastElection ? `<div class="feedItem info"><b>Última eleição</b><br>${state.lastElection.incumbentVote}% governo x ${state.lastElection.opponentVote}% ${state.lastElection.opponent}</div>` : ""}
  `);

  setHTML("regionalPolls", regions.map(r => `
    <div class="sector">
      <b>${r.name}</b>
      ${miniBar(r.incumbent)}
      <small>peso eleitoral ${r.voters}% • governo ${Math.round(r.incumbent)}%</small>
    </div>
  `).join(""));

  setHTML("campaignActions", CAMPAIGN_ACTIONS.map(a => `<article class="decision"><h4>${a.title}</h4><p>${a.text}</p><button data-campaign="${a.id}">${a.cost ? "₿ "+a.cost+" bi" : "EXECUTAR"}</button></article>`).join(""));
  bind("[data-campaign]", btn => actions.runCampaignAction(btn.dataset.campaign));
}


function renderCrisis(state, actions) {
  const active = activeCrises(state);
  setHTML("crisisReport", `
    ${metric("Nível nacional", (state.crisis || 0) * 10, state.crisis > 5)}
    ${metric("Severidade máxima", crisisSeverity(state), crisisSeverity(state) > 60)}
    ${metric("Estabilidade", state.stability, state.stability < 40)}
    ${metric("Aprovação", state.approval, state.approval < 40)}
    <p><b>Status:</b> ${state.crisis > 6 ? "crise nacional grave" : state.crisis > 3 ? "alerta elevado" : "controlado"}</p>
  `);

  setHTML("activeCrises", active.map(c => `
    <div class="sector">
      <b>${c.title}</b>
      ${miniBar(c.level * 25, c.level >= 3)}
      <small>nível ${c.level}/4 • cooldown ${c.cooldown || 0} dias</small>
    </div>
  `).join("") || "<p>Nenhuma crise encadeada ativa.</p>");

  setHTML("crisisActions", CRISIS_ACTIONS.map(a => `<article class="decision"><h4>${a.title}</h4><p>${a.text}</p><button data-crisis-action="${a.id}">${a.cost ? "₿ "+a.cost+" bi" : "EXECUTAR"}</button></article>`).join(""));
  bind("[data-crisis-action]", btn => actions.runCrisisAction(btn.dataset.crisisAction));

  setHTML("crisisHistory", (state.crisisHistory || []).map(h => `<div class="feedItem warning"><b>${h.chainTitle} — ${h.stageTitle}</b><br>${h.text}<br><small>${String(h.day).padStart(2,"0")}/${String(h.month).padStart(2,"0")}/${h.year}</small></div>`).join("") || "<p>Nenhum histórico de crise ainda.</p>");
}

function renderProgression(state, actions) {
  const level = state.leaderLevel || state.level || 1;
  const xp = state.leaderXP ?? state.xp ?? 0;
  const next = xpToNext(level);

  setHTML("leaderProgress", `
    <div class="econHero">
      <div><span>Nível</span><b>${level}</b></div>
      <div><span>XP</span><b>${Math.round(xp)}/${next}</b></div>
      <div><span>Prestígio</span><b>${Math.round(state.prestige)}</b></div>
    </div>
    ${miniBar((xp / next) * 100)}
    ${metric("Capital político", state.politicalCapital)}
    ${metric("Score nacional", (state.approval + state.economy + state.stability + state.influence) / 4)}
  `);

  setHTML("globalRanking", `
    <div class="sector">
      <b>Ranking #${state.globalRank || 100}</b>
      ${miniBar(100 - (state.globalRank || 100), false)}
      <small>Quanto menor o número, maior a influência global.</small>
    </div>
  `);

  setHTML("mandateGoals", (state.mandateGoals || []).map(g => {
    const value = state[g.target] ?? 0;
    const progress = g.reverse ? Math.max(0, 100 - (value / Math.max(1,g.threshold))*100) : Math.min(100, (value / g.threshold) * 100);
    return `<div class="sector ${g.done ? "goalDone" : ""}"><b>${g.done ? "✓ " : ""}${g.title}</b>${miniBar(g.done ? 100 : progress)}<small>${g.reverse ? "meta máxima" : "meta"} ${g.threshold}</small></div>`;
  }).join("") || "<p>Metas ainda não geradas.</p>");

  setHTML("achievementsPanel", ACHIEVEMENTS.map(a => `<div class="sector ${state.achievements && state.achievements[a.id] ? "goalDone" : ""}"><b>${state.achievements && state.achievements[a.id] ? "🏆 " : "▫ "}${a.title}</b><small>${a.text}</small></div>`).join(""));

  setHTML("unlocksPanel", UNLOCKS.map(u => `<div class="sector ${state.unlocked && state.unlocked[u.id] ? "goalDone" : ""}"><b>${state.unlocked && state.unlocked[u.id] ? "🔓 " : "🔒 "}${u.title}</b><small>nível ${u.level}</small></div>`).join(""));
}

function renderStore(state, actions) {
  setHTML("storeWallet", `
    <div class="econHero">
      <div><span>Moedas Diplomáticas</span><b>${Math.round(state.softCurrency || 0)}</b></div>
      <div><span>Moedas Premium</span><b>${Math.round(state.premiumCurrency || 0)}</b></div>
      <div><span>Score Comercial</span><b>${monetizationScore(state)}</b></div>
    </div>
    <p class="legalNote">Build comercial simulada: nenhuma compra real, cobrança ou anúncio real está ativo.</p>
  `);

  setHTML("storeItems", STORE_ITEMS.map(item => {
    const owned = state.ownedItems && state.ownedItems[item.id];
    const price = item.pricePremium ? `💎 ${item.pricePremium}` : `🪙 ${item.priceSoft}`;
    return `<article class="decision ${owned ? "goalDone" : ""}">
      <h4>${owned ? "✓ " : ""}${item.title}</h4>
      <p>${item.text}</p>
      <small>${item.type} • ${owned ? "adquirido" : price}</small>
      <button data-store-item="${item.id}">${owned && item.type === "cosmetic" ? "APLICAR" : "COMPRAR"}</button>
    </article>`;
  }).join(""));
  bind("[data-store-item]", btn => actions.buyStoreItem(btn.dataset.storeItem));

  setHTML("rewardedAds", REWARDED_ADS.map(ad => {
    const cd = state.adCooldowns && state.adCooldowns[ad.id];
    return `<article class="decision">
      <h4>${ad.title}</h4>
      <p>${ad.text}</p>
      <small>${cd ? "cooldown " + cd + " dia(s)" : "disponível"}</small>
      <button data-rewarded-ad="${ad.id}">${cd ? "AGUARDE" : "SIMULAR AD"}</button>
    </article>`;
  }).join(""));
  bind("[data-rewarded-ad]", btn => actions.claimRewardedAd(btn.dataset.rewardedAd));

  setHTML("premiumPacks", PREMIUM_PACKS.map(pack => `<article class="decision">
    <h4>${pack.title}</h4>
    <p>${pack.label}: entrega 💎 ${pack.premium} e 🪙 ${pack.soft}.</p>
    <button data-premium-pack="${pack.id}">SIMULAR COMPRA</button>
  </article>`).join(""));
  bind("[data-premium-pack]", btn => actions.simulatePremiumPack(btn.dataset.premiumPack));

  setHTML("purchaseHistory", (state.purchaseHistory || []).map(p => `<div class="feedItem info"><b>${p.title}</b><br>${p.type} • ${String(p.day).padStart(2,"0")}/${String(p.month).padStart(2,"0")}/${p.year}</div>`).join("") || "<p>Nenhum histórico comercial ainda.</p>");
  setHTML("monetizationRules", MONETIZATION_RULES.map(rule => `<div class="sector"><b>•</b> ${rule}</div>`).join(""));
}

function renderRelease(state, actions) {
  setHTML("releaseSummary", `
    <div class="econHero">
      <div><span>Versão</span><b>v${BUILD.version}</b></div>
      <div><span>Status</span><b class="pos">${BUILD.status}</b></div>
      <div><span>Build</span><b>${BUILD.date} ${BUILD.time}</b></div>
    </div>
    <p class="legalNote">${BUILD.summary}</p>
    <div class="sector"><b>Pacote oficial</b><small>${BUILD.artifact}</small></div>
    <div class="sector"><b>Fonte canônica</b><small>${BUILD.source} • SHA-256 ${BUILD.sourceSHA256}</small></div>
  `);

  const pwa = getPWAStatus();
  const pwaMode = pwa.standalone ? "Aplicativo instalado" : pwa.supported ? "Navegador compatível" : "PWA indisponível";
  const pwaClass = !pwa.online ? "degraded" : pwa.ready ? "" : "safe";
  setHTML("pwaHealth", `
    <div class="healthBadge ${pwaClass}">${!pwa.online ? "Modo offline" : pwaMode}</div>
    <div class="resilienceGrid">
      <div class="sector"><b>Service Worker</b><small>${pwa.registered ? pwa.ready ? "ativo e pronto" : "registrando" : pwa.supported ? "aguardando" : "não suportado"}</small></div>
      <div class="sector"><b>Controle offline</b><small>${pwa.controlled ? "página protegida pelo cache" : "será ativado após o primeiro carregamento"}</small></div>
      <div class="sector"><b>Rede</b><small>${pwa.online ? "online" : "offline • saves continuam locais"}</small></div>
      <div class="sector"><b>Instalação</b><small>${pwa.installed ? "executando como app" : pwa.installAvailable ? "disponível neste dispositivo" : "use o menu do navegador quando necessário"}</small></div>
      <div class="sector"><b>Atualização</b><small>${pwa.updateAvailable ? "nova build aguardando confirmação" : "nenhuma atualização pendente"}</small></div>
      <div class="sector"><b>Cache</b><small>${pwa.cacheVersion || pwa.serviceWorkerVersion || "aguardando service worker"}</small></div>
    </div>
    ${pwa.error ? `<p class="legalNote">${pwa.error}</p>` : ""}
  `);

  const storage = getStorageDiagnostics();
  setHTML("saveArchitectureHealth", `
    <div class="healthBadge">${t("save.architectureReady")}</div>
    <div class="resilienceGrid">
      <div class="sector"><b>${t("save.activeProfile")}</b><small>${storage.activeProfileName}</small></div>
      <div class="sector"><b>${t("save.activeCareer")}</b><small>${storage.activeSlotName}</small></div>
      <div class="sector"><b>${t("save.profiles")}</b><small>${storage.profileCount} / 4</small></div>
      <div class="sector"><b>${t("save.occupiedSlots")}</b><small>${storage.occupiedSlots}</small></div>
      <div class="sector"><b>${t("save.manualBackups")}</b><small>${storage.manualBackups.length}</small></div>
      <div class="sector"><b>${t("save.schema")}</b><small>${storage.saveSchema} • profiles-slots-v1</small></div>
    </div>
  `);

  const health = getResilienceStatus();
  const healthClass = health.safeMode ? "safe" : health.status === "healthy" || health.status === "recovered" ? "" : "degraded";
  const latestSnapshot = health.snapshots[0];
  setHTML("resilienceHealth", `
    <div class="healthBadge ${healthClass}">${health.safeMode ? "Modo seguro" : health.status === "healthy" ? "Sistema saudável" : health.status}</div>
    <div class="resilienceGrid">
      <div class="sector"><b>Watchdog</b><small>${health.installed ? "ativo" : "indisponível"} • atraso ${Math.round(health.eventLoopLagMs || 0)} ms</small></div>
      <div class="sector"><b>Autosave</b><small>${health.lastAutosaveAt ? new Date(health.lastAutosaveAt).toLocaleString(getLocale()) : "aguardando primeira gravação"}</small></div>
      <div class="sector"><b>Snapshots válidos</b><small>${health.snapshots.length} • ${latestSnapshot ? latestSnapshot.reason : "nenhum"}</small></div>
      <div class="sector"><b>Incidentes registrados</b><small>${health.incidentCount || 0} • diagnóstico persistente</small></div>
      <div class="sector"><b>Última recuperação</b><small>${health.lastRecovery ? `${health.lastRecovery.type} • ${health.lastRecovery.source || "save"}` : "não necessária"}</small></div>
      <div class="sector"><b>Save schema</b><small>${BUILD.saveSchema} • escrita transacional + checksum</small></div>
    </div>
  `);

  setHTML("releaseChecklist", RELEASE_CHECKLIST.map(item => `<div class="sector goalDone">
    <b>✓ ${item.title}</b>
    <small>${item.detail}</small>
  </div>`).join(""));

  setHTML("testChecklist", TEST_CHECKLIST.map((item, i) => `<div class="sector">
    <b>${String(i+1).padStart(2,"0")}</b> ${item}
  </div>`).join(""));

  setHTML("nextReleaseSteps", NEXT_RELEASE_STEPS.map((item, i) => `<div class="feedItem info">
    <b>Passo ${i+1}</b><br>${item}
  </div>`).join(""));
}

function renderFeed(state) {
  setHTML("feed", state.feed.map(f=>`<div class="feedItem ${f.type}"><b>${f.date}</b><br>${f.message}</div>`).join("") || "<p>Nenhum evento ainda.</p>");
}

function metric(label, value, danger=false) {
  return `<div class="metricRow"><label>${label}</label>${miniBar(value, danger)}<b>${Math.round(clamp(value))}%</b></div>`;
}

function miniBar(value, danger=false) {
  return `<div class="bar"><i style="width:${pct(value)};${danger ? "background:linear-gradient(90deg,#7a2222,#ef4d4d)" : ""}"></i></div>`;
}

function bind(selector, fn) {
  $$(selector).forEach(el => { el.oninput = el.tagName === "INPUT" ? () => fn(el) : el.oninput; el.onclick = () => fn(el); });
}

function drawCharts(state) {
  drawLine("voteCanvas", [state.approval, state.economy, state.media, state.campaign, voteChance(state)]);
  drawLine("riskCanvas", [state.crisis*10, 100-state.stability, 100-state.loyalty, state.corruption, state.opposition, calculateCoupRisk(state)]);
  drawLine("economyCanvas", [state.industry, state.agribusiness, state.services, state.technology, state.energy, state.marketConfidence]);
  drawLine("crisisCanvas", [(state.crisis||0)*10, 100-state.stability, 100-state.approval, state.corruption, state.congressPressure||0, state.coupRisk||0]);
}

function drawLine(id, data) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "rgba(217,170,67,.35)";
  ctx.lineWidth = 1;
  for (let y=40; y<canvas.height; y+=40) { ctx.beginPath(); ctx.moveTo(20,y); ctx.lineTo(canvas.width-20,y); ctx.stroke(); }
  ctx.strokeStyle = "#f0cf71"; ctx.lineWidth = 4; ctx.beginPath();
  data.forEach((v,i) => {
    const x = 30 + i * ((canvas.width - 60)/(data.length-1));
    const y = canvas.height - 24 - clamp(v) * ((canvas.height - 48)/100);
    if (i) ctx.lineTo(x,y); else ctx.moveTo(x,y);
  });
  ctx.stroke();
}
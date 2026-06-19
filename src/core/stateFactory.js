import { BUILD } from "./build.js";
import { AVATARS } from "../data/avatars.js";
import { MINISTERS } from "../data/governmentData.js";
import { AI_COUNTRIES } from "../data/diplomacyData.js";
import { SECURITY_FORCES } from "../data/securityData.js";
import { createPopulationState } from "../systems/population.js";
import { createDeepEconomyState } from "../systems/economyDeep.js";
import { createBudgetTaxState } from "../systems/budgetTax.js";
import { createInstitutionalState } from "../systems/governmentInstitutions.js";
import { createCabinetState } from "../systems/cabinetAdministration.js";
import { createMediaPublicState } from "../systems/media.js";
import { createWorldDiplomacyState } from "../systems/worldDiplomacy.js";
import { createDefenseIntelligenceState } from "../systems/defenseIntelligence.js";
import { createNationalCrisisState } from "../systems/nationalCrisis.js";
import { createElectoralCareerState } from "../systems/electoralCareer.js";
import { createScenarioTutorialState } from "../systems/scenarioTutorial.js";
import { createAlphaBetaState } from "../systems/alphaBeta.js";
import { createGoldMasterState } from "../systems/goldMaster.js";
import { createInternationalLaunchState } from "../systems/internationalLaunch.js";

export function createNewState(overrides = {}) {
  const base = {
    version: BUILD.version,
    day: 1, month: 1, year: 2026, nextEventIn: 6, electionDays: 1460,
    leader: "Jonatan Vale", party: "MDB", partyName: "Movimento Democrático Brasileiro", avatar: AVATARS[0].src,
    country: "Brasil", countryCode: "BR",
    governmentSetup: { schema:1, countryId:"brazil", systemId:"coalition_presidentialism", ideologyId:"pragmatic_center", difficultyId:"standard", scenarioId:"balanced_2026", objectiveId:"prosperity", difficultyPressureMultiplier:1, eventIntervalModifier:1 },
    level: 1, xp: 0, leaderLevel: 1, leaderXP: 0, globalRank: 100, retentionStreak: 1, treasury: 900, politicalCapital: 55, prestige: 42,
    approval: 58, economy: 55, stability: 62, influence: 41, diplomacy: 50,
    gdp: 2100, debt: 48, inflation: 6.2, unemployment: 9.4, interestRate: 10.5,
    taxBurden: 33, publicSpending: 31, marketConfidence: 52, tradeBalance: 50, inequality: 52,
    industry: 51, agribusiness: 58, services: 54, technology: 35, energy: 50,
    coalition: 52, opposition: 38, media: 50, corruption: 22, elite: 50,
    military: 52, loyalty: 61, security: 52, coupRisk: 18, intelligence: 38, environment: 45,
    campaign: 35, rejection: 32, crisis: 0, lastMonthlyBalance: 0, congressPressure: 35, approvedLaws: [], approvedLawIds: [], ministers: MINISTERS.map(m => ({...m})), headlines: [], govNarrative: 50, lastElection: null,
    aiCountries: AI_COUNTRIES.map(c => ({...c})), treaties: [], diplomaticLog: [], globalTension: 35,
    activeOperations: [], securityLog: [], securityForces: SECURITY_FORCES.map(f => ({...f})),
    crisisChains: {}, crisisHistory: [], achievements: {}, unlocked: {}, mandateGoals: null, dailyClaims: {},
    softCurrency: 180, premiumCurrency: 0, ownedItems: {}, adCooldowns: {}, purchaseHistory: [], cosmeticTheme: "default",
    budget: { health:30, education:28, security:26, infrastructure:30, social:28, industry:28, technology:24 },
    cooldowns: {}, projects: [], completedProjects: [],
    relations: [
      { id:"usa", name:"Estados Unidos", rel:54, type:"Potência", stance:"neutro" },
      { id:"china", name:"China", rel:48, type:"Comércio", stance:"neutro" },
      { id:"ue", name:"União Europeia", rel:56, type:"Diplomacia", stance:"aliado" },
      { id:"arg", name:"Argentina", rel:62, type:"Regional", stance:"aliado" },
      { id:"rus", name:"Rússia", rel:39, type:"Defesa", stance:"tenso" },
      { id:"ind", name:"Índia", rel:51, type:"Tecnologia", stance:"neutro" }
    ],
    careerStatus: "active",
    governance: {
      schema: 2, totalDays: 0, weekNumber: 1, quarter: 1, termNumber: 1, termDay: 1,
      phase: "Primeiros 100 dias", actionPoints: 10, maxActionPoints: 10,
      administrativeCapacity: 64, fiscalCredibility: 55, institutionalResilience: 61, socialCohesion: 55,
      policyFatigue: 0, recoveryMomentum: 0, pendingConsequences: [],
      reports: { weekly:null, monthly:null, quarterly:null, annual:null },
      pressureDays: { impeachment:0, coup:0, fiscal:0 },
      lastBudgetCycle: null, lastTaxCycle: null, scoreHistory: [], outcome: null, outcomePresented: false
    },
    population: createPopulationState(),
    deepEconomy: createDeepEconomyState(),
    budgetTax: createBudgetTaxState(),
    institutions: createInstitutionalState(),
    cabinetAdministration: createCabinetState(),
    mediaPublic: createMediaPublicState(),
    worldDiplomacy: createWorldDiplomacyState(),
    defenseIntelligence: createDefenseIntelligenceState(),
    nationalCrisis: createNationalCrisisState(),
    electoralCareer: createElectoralCareerState(),
    scenarioTutorial: createScenarioTutorialState(),
    alphaBeta: createAlphaBetaState(),
    goldMaster: createGoldMasterState(),
    internationalLaunch: createInternationalLaunchState(),
    feed: []
  };

  return deepMerge(base, overrides);
}

function deepMerge(base, overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return structuredClone(base);
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = { ...result[key], ...structuredClone(value) };
    } else {
      result[key] = structuredClone(value);
    }
  }
  return result;
}

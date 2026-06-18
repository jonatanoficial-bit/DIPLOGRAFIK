from pathlib import Path
from PIL import Image
import json, re, textwrap
ROOT=Path('/mnt/data/work_phase15')

# 1. Crop the 12 party cards from the user-provided sheet.
source=Image.open('/mnt/data/ChatGPT Image 17 de jun. de 2026, 16_21_30.png').convert('RGB')
party_dir=ROOT/'assets/ui/parties'
party_dir.mkdir(parents=True, exist_ok=True)
boxes=[
('party_mdb_card_v1',(80,78,374,352)),
('party_pt_card_v1',(410,78,704,352)),
('party_pl_card_v1',(742,78,1036,352)),
('party_psd_card_v1',(1076,78,1370,352)),
('party_uniao_card_v1',(80,388,374,662)),
('party_pp_card_v1',(410,388,704,662)),
('party_psdb_card_v1',(742,388,1036,662)),
('party_psb_card_v1',(1076,388,1370,662)),
('party_republicanos_card_v1',(80,700,374,974)),
('party_novo_card_v1',(410,700,704,974)),
('party_pv_card_v1',(742,700,1036,974)),
('party_psol_card_v1',(1076,700,1370,974)),
]
for stem, box in boxes:
    source.crop(box).save(party_dir/f'{stem}.png', optimize=True)

# 2. Extend parties with asset keys.
parties_path=ROOT/'src/data/parties.js'
parties=parties_path.read_text(encoding='utf-8')
asset_keys={
'MDB':'party_mdb_card_v1','PT':'party_pt_card_v1','PL':'party_pl_card_v1','PSD':'party_psd_card_v1',
'UNIÃO':'party_uniao_card_v1','PP':'party_pp_card_v1','PSDB':'party_psdb_card_v1','PSB':'party_psb_card_v1',
'REPUBLICANOS':'party_republicanos_card_v1','NOVO':'party_novo_card_v1','PV':'party_pv_card_v1','PSOL':'party_psol_card_v1'}
for sigla,key in asset_keys.items():
    needle=f'"sigla": "{sigla}",'
    parties=parties.replace(needle, needle+f'\n    "assetKey": "{key}",', 1)
parties_path.write_text(parties,encoding='utf-8')

# 3. Government creation data.
(ROOT/'src/data/governmentCreationData.js').write_text(r'''export const COUNTRIES = Object.freeze([
  {
    id: "brazil",
    code: "BR",
    flag: "🇧🇷",
    nameKey: "governmentCreation.country.brazil.name",
    descriptionKey: "governmentCreation.country.brazil.description",
    officialNameKey: "governmentCreation.country.brazil.official",
    playable: true,
    effects: { prestige: 1 }
  }
]);

export const POLITICAL_SYSTEMS = Object.freeze([
  {
    id: "coalition_presidentialism",
    icon: "🏛",
    nameKey: "governmentCreation.system.presidential.name",
    descriptionKey: "governmentCreation.system.presidential.description",
    effects: { coalition: 4, politicalCapital: 3, stability: 1 },
    governance: { administrativeCapacity: 1, institutionalResilience: 1, maxActionPoints: 0 }
  },
  {
    id: "semi_presidentialism",
    icon: "⚖",
    nameKey: "governmentCreation.system.semi.name",
    descriptionKey: "governmentCreation.system.semi.description",
    effects: { coalition: 6, stability: 3, politicalCapital: -1 },
    governance: { administrativeCapacity: 5, institutionalResilience: 4, maxActionPoints: 1 }
  },
  {
    id: "parliamentarism",
    icon: "🗳",
    nameKey: "governmentCreation.system.parliamentary.name",
    descriptionKey: "governmentCreation.system.parliamentary.description",
    effects: { coalition: 9, stability: 4, approval: -2, politicalCapital: -3 },
    governance: { administrativeCapacity: 7, institutionalResilience: 5, maxActionPoints: 1 }
  }
]);

export const LEADER_IDEOLOGIES = Object.freeze([
  { id:"pragmatic_center", icon:"◆", nameKey:"governmentCreation.ideology.center.name", descriptionKey:"governmentCreation.ideology.center.description", effects:{ stability:2, coalition:3, approval:1 } },
  { id:"social_democracy", icon:"🤝", nameKey:"governmentCreation.ideology.social.name", descriptionKey:"governmentCreation.ideology.social.description", effects:{ approval:4, inequality:-3, treasury:-40, marketConfidence:-1 } },
  { id:"economic_liberalism", icon:"📈", nameKey:"governmentCreation.ideology.liberal.name", descriptionKey:"governmentCreation.ideology.liberal.description", effects:{ economy:4, marketConfidence:5, treasury:45, approval:-1 } },
  { id:"democratic_conservatism", icon:"🛡", nameKey:"governmentCreation.ideology.conservative.name", descriptionKey:"governmentCreation.ideology.conservative.description", effects:{ security:4, stability:3, loyalty:2, opposition:2 } },
  { id:"green_development", icon:"🌿", nameKey:"governmentCreation.ideology.green.name", descriptionKey:"governmentCreation.ideology.green.description", effects:{ environment:8, technology:3, approval:2, treasury:-25 } }
]);

export const DIFFICULTIES = Object.freeze([
  { id:"civic", icon:"★", nameKey:"governmentCreation.difficulty.civic.name", descriptionKey:"governmentCreation.difficulty.civic.description", effects:{ treasury:220, approval:7, stability:6, politicalCapital:8 }, governance:{ maxActionPoints:2, administrativeCapacity:7, institutionalResilience:5 }, eventIntervalModifier:1.25, pressureMultiplier:0.78 },
  { id:"standard", icon:"★★", nameKey:"governmentCreation.difficulty.standard.name", descriptionKey:"governmentCreation.difficulty.standard.description", effects:{}, governance:{ maxActionPoints:0 }, eventIntervalModifier:1, pressureMultiplier:1 },
  { id:"strategist", icon:"★★★", nameKey:"governmentCreation.difficulty.strategist.name", descriptionKey:"governmentCreation.difficulty.strategist.description", effects:{ treasury:-120, approval:-3, politicalCapital:-4, crisis:1 }, governance:{ maxActionPoints:-1, administrativeCapacity:-4 }, eventIntervalModifier:0.88, pressureMultiplier:1.12 },
  { id:"statesman", icon:"★★★★", nameKey:"governmentCreation.difficulty.statesman.name", descriptionKey:"governmentCreation.difficulty.statesman.description", effects:{ treasury:-220, approval:-6, stability:-5, politicalCapital:-8, debt:6, crisis:2 }, governance:{ maxActionPoints:-2, administrativeCapacity:-7, institutionalResilience:-5 }, eventIntervalModifier:0.72, pressureMultiplier:1.28 }
]);

export const STARTING_SCENARIOS = Object.freeze([
  {
    id:"balanced_2026", icon:"⚙", nameKey:"governmentCreation.scenario.balanced.name", descriptionKey:"governmentCreation.scenario.balanced.description",
    effects:{}, governance:{},
    goals:[
      { id:"balanced_approval", titleKey:"governmentCreation.goal.approval", target:"approval", threshold:65, reward:{xp:30,prestige:2} },
      { id:"balanced_stability", titleKey:"governmentCreation.goal.stability", target:"stability", threshold:68, reward:{xp:30,politicalCapital:5} },
      { id:"balanced_economy", titleKey:"governmentCreation.goal.economy", target:"economy", threshold:65, reward:{xp:30,treasury:60} }
    ]
  },
  {
    id:"fiscal_emergency", icon:"💸", nameKey:"governmentCreation.scenario.fiscal.name", descriptionKey:"governmentCreation.scenario.fiscal.description",
    effects:{ treasury:-300, debt:34, inflation:4.2, economy:-10, marketConfidence:-14, unemployment:3.2 }, governance:{ fiscalCredibility:-18 },
    goals:[
      { id:"fiscal_debt", titleKey:"governmentCreation.goal.debt", target:"debt", threshold:70, reverse:true, reward:{xp:45,prestige:3} },
      { id:"fiscal_inflation", titleKey:"governmentCreation.goal.inflation", target:"inflation", threshold:8, reverse:true, reward:{xp:40,treasury:90} },
      { id:"fiscal_confidence", titleKey:"governmentCreation.goal.market", target:"marketConfidence", threshold:62, reward:{xp:40,politicalCapital:5} }
    ]
  },
  {
    id:"social_unrest", icon:"📣", nameKey:"governmentCreation.scenario.social.name", descriptionKey:"governmentCreation.scenario.social.description",
    effects:{ approval:-18, stability:-16, unemployment:4, inequality:9, crisis:3, coalition:-6 }, governance:{ socialCohesion:-18, institutionalResilience:-8 },
    goals:[
      { id:"social_approval", titleKey:"governmentCreation.goal.approval", target:"approval", threshold:58, reward:{xp:45,prestige:3} },
      { id:"social_cohesion", titleKey:"governmentCreation.goal.cohesion", target:"socialCohesion", threshold:60, governanceTarget:true, reward:{xp:45,politicalCapital:6} },
      { id:"social_crisis", titleKey:"governmentCreation.goal.crisis", target:"crisis", threshold:2, reverse:true, reward:{xp:40,stability:4} }
    ]
  },
  {
    id:"global_tension", icon:"🌐", nameKey:"governmentCreation.scenario.global.name", descriptionKey:"governmentCreation.scenario.global.description",
    effects:{ globalTension:31, diplomacy:-9, influence:8, tradeBalance:-7, military:4, crisis:1 }, governance:{ institutionalResilience:-3 },
    goals:[
      { id:"global_tension_goal", titleKey:"governmentCreation.goal.tension", target:"globalTension", threshold:55, reverse:true, reward:{xp:45,prestige:4} },
      { id:"global_influence", titleKey:"governmentCreation.goal.influence", target:"influence", threshold:68, reward:{xp:40,prestige:5} },
      { id:"global_diplomacy", titleKey:"governmentCreation.goal.diplomacy", target:"diplomacy", threshold:62, reward:{xp:40,politicalCapital:4} }
    ]
  }
]);

export const STRATEGIC_OBJECTIVES = Object.freeze([
  { id:"prosperity", icon:"💰", nameKey:"governmentCreation.objective.prosperity.name", descriptionKey:"governmentCreation.objective.prosperity.description", effects:{ economy:2, marketConfidence:2 }, goals:[{id:"objective_gdp",titleKey:"governmentCreation.goal.economy",target:"economy",threshold:72,reward:{xp:45,treasury:100}},{id:"objective_jobs",titleKey:"governmentCreation.goal.unemployment",target:"unemployment",threshold:7.5,reverse:true,reward:{xp:40,prestige:3}}] },
  { id:"social_pact", icon:"🤲", nameKey:"governmentCreation.objective.social.name", descriptionKey:"governmentCreation.objective.social.description", effects:{ approval:2, inequality:-2 }, goals:[{id:"objective_approval",titleKey:"governmentCreation.goal.approval",target:"approval",threshold:70,reward:{xp:45,prestige:4}},{id:"objective_inequality",titleKey:"governmentCreation.goal.inequality",target:"inequality",threshold:45,reverse:true,reward:{xp:40,politicalCapital:5}}] },
  { id:"institutional_strength", icon:"🏛", nameKey:"governmentCreation.objective.institution.name", descriptionKey:"governmentCreation.objective.institution.description", effects:{ stability:2, corruption:-2 }, goals:[{id:"objective_stability",titleKey:"governmentCreation.goal.stability",target:"stability",threshold:75,reward:{xp:45,prestige:4}},{id:"objective_corruption",titleKey:"governmentCreation.goal.corruption",target:"corruption",threshold:15,reverse:true,reward:{xp:40,politicalCapital:6}}] },
  { id:"global_leadership", icon:"🌍", nameKey:"governmentCreation.objective.global.name", descriptionKey:"governmentCreation.objective.global.description", effects:{ influence:3, diplomacy:3 }, goals:[{id:"objective_influence",titleKey:"governmentCreation.goal.influence",target:"influence",threshold:72,reward:{xp:45,prestige:5}},{id:"objective_treaties",titleKey:"governmentCreation.goal.prestige",target:"prestige",threshold:65,reward:{xp:40,politicalCapital:4}}] },
  { id:"green_power", icon:"♻", nameKey:"governmentCreation.objective.green.name", descriptionKey:"governmentCreation.objective.green.description", effects:{ environment:5, technology:2 }, goals:[{id:"objective_environment",titleKey:"governmentCreation.goal.environment",target:"environment",threshold:75,reward:{xp:45,prestige:4}},{id:"objective_technology",titleKey:"governmentCreation.goal.technology",target:"technology",threshold:60,reward:{xp:40,treasury:70}}] }
]);

export function findSetupItem(collection, id) {
  return collection.find(item => item.id === id) || collection[0];
}
''',encoding='utf-8')

# 4. System for applying setup.
(ROOT/'src/systems/governmentCreation.js').write_text(r'''import { applyEffects, normalizeState } from "./calculations.js";
import { COUNTRIES, POLITICAL_SYSTEMS, LEADER_IDEOLOGIES, DIFFICULTIES, STARTING_SCENARIOS, STRATEGIC_OBJECTIVES, findSetupItem } from "../data/governmentCreationData.js";

export const GOVERNMENT_SETUP_SCHEMA = 1;

export function normalizeGovernmentSelection(selection = {}) {
  return {
    countryId: findSetupItem(COUNTRIES, selection.countryId).id,
    systemId: findSetupItem(POLITICAL_SYSTEMS, selection.systemId).id,
    ideologyId: findSetupItem(LEADER_IDEOLOGIES, selection.ideologyId).id,
    difficultyId: findSetupItem(DIFFICULTIES, selection.difficultyId).id,
    scenarioId: findSetupItem(STARTING_SCENARIOS, selection.scenarioId).id,
    objectiveId: findSetupItem(STRATEGIC_OBJECTIVES, selection.objectiveId).id,
  };
}

export function applyGovernmentCreation(state, selection = {}, translate = key => key) {
  const normalized = normalizeGovernmentSelection(selection);
  const country = findSetupItem(COUNTRIES, normalized.countryId);
  const system = findSetupItem(POLITICAL_SYSTEMS, normalized.systemId);
  const ideology = findSetupItem(LEADER_IDEOLOGIES, normalized.ideologyId);
  const difficulty = findSetupItem(DIFFICULTIES, normalized.difficultyId);
  const scenario = findSetupItem(STARTING_SCENARIOS, normalized.scenarioId);
  const objective = findSetupItem(STRATEGIC_OBJECTIVES, normalized.objectiveId);

  state.country = country.nameKey === "governmentCreation.country.brazil.name" ? "Brasil" : translate(country.nameKey);
  state.countryCode = country.code;
  state.governmentSetup = {
    schema: GOVERNMENT_SETUP_SCHEMA,
    ...normalized,
    difficultyPressureMultiplier: difficulty.pressureMultiplier,
    eventIntervalModifier: difficulty.eventIntervalModifier,
  };

  for (const item of [country, system, ideology, difficulty, scenario, objective]) applyEffects(state, item.effects || {});
  const governance = state.governance;
  for (const item of [system, difficulty, scenario]) {
    const modifiers = item.governance || {};
    for (const [key, value] of Object.entries(modifiers)) {
      governance[key] = Number(governance[key] || 0) + Number(value || 0);
    }
  }
  governance.maxActionPoints = Math.max(5, Math.min(12, Math.round(governance.maxActionPoints)));
  governance.actionPoints = governance.maxActionPoints;
  state.nextEventIn = Math.max(5, Math.round(8 * difficulty.eventIntervalModifier));

  const goals = [...(scenario.goals || []), ...(objective.goals || [])].slice(0, 5);
  state.mandateGoals = goals.map(goal => ({
    ...goal,
    title: translate(goal.titleKey),
    done: false,
  }));
  normalizeState(state);
  return { country, system, ideology, difficulty, scenario, objective };
}

export function getDifficultyProfile(state) {
  return findSetupItem(DIFFICULTIES, state?.governmentSetup?.difficultyId || "standard");
}

export function getGovernmentSetupDefinition(state) {
  const setup = normalizeGovernmentSelection(state?.governmentSetup || {});
  return {
    setup,
    country: findSetupItem(COUNTRIES, setup.countryId),
    system: findSetupItem(POLITICAL_SYSTEMS, setup.systemId),
    ideology: findSetupItem(LEADER_IDEOLOGIES, setup.ideologyId),
    difficulty: findSetupItem(DIFFICULTIES, setup.difficultyId),
    scenario: findSetupItem(STARTING_SCENARIOS, setup.scenarioId),
    objective: findSetupItem(STRATEGIC_OBJECTIVES, setup.objectiveId),
  };
}
''',encoding='utf-8')

# 5. Extend asset pipeline.
build_assets=ROOT/'tools/build_assets.py'
s=build_assets.read_text(encoding='utf-8')
s=s.replace("    'icon': sorted((ASSETS/'icons').glob('*.png')),\n}","    'icon': sorted((ASSETS/'icons').glob('*.png')),\n    'party': sorted((ASSETS/'ui/parties').glob('*.png')),\n}")
s=s.replace("    'icon': [\n        ('ui', (960, 409), 'contain', {'webp': 82, 'avif': 55}),\n    ],\n}","    'icon': [\n        ('ui', (960, 409), 'contain', {'webp': 82, 'avif': 55}),\n    ],\n    'party': [\n        ('party', (360, 336), 'cover', {'webp': 80, 'avif': 52}),\n    ],\n}")
s=s.replace("    'icon': 'icons',\n}","    'icon': 'icons',\n    'party': 'parties',\n}")
s=s.replace("        'icon':'icons'\n                }[category]", "        'icon':'icons',\n                    'party':'parties'\n                }[category]")
s=s.replace("catalog = {'backgrounds': {}, 'characters': {}, 'cards': {}, 'icons': {}}", "catalog = {'backgrounds': {}, 'characters': {}, 'cards': {}, 'icons': {}, 'parties': {}}")
s=s.replace("    js += 'export const ICON_ASSETS = Object.freeze(ASSET_CATALOG.icons);\\n'", "    js += 'export const ICON_ASSETS = Object.freeze(ASSET_CATALOG.icons);\\n'\n    js += 'export const PARTY_ASSETS = Object.freeze(ASSET_CATALOG.parties);\\n'")
build_assets.write_text(s,encoding='utf-8')

# Asset audit counts and profiles.
audit=ROOT/'tests/run_asset_pipeline_audit.py'
s=audit.read_text(encoding='utf-8')
s=s.replace(" ('icon','ui','avif'):1,('icon','ui','webp'):1,", " ('icon','ui','avif'):1,('icon','ui','webp'):1,\n ('party','party','avif'):12,('party','party','webp'):12,")
s=s.replace(" ('card','card'):(768,512),('icon','ui'):(960,409),", " ('card','card'):(768,512),('icon','ui'):(960,409),('party','party'):(360,336),")
s=s.replace(" ('icon','ui','webp'):80_000,('icon','ui','avif'):45_000,", " ('icon','ui','webp'):80_000,('icon','ui','avif'):45_000,\n ('party','party','webp'):65_000,('party','party','avif'):42_000,")
s=s.replace("'source_count_22':len(sources)==22 and MANIFEST.get('source_asset_count')==22,", "'source_count_34':len(sources)==34 and MANIFEST.get('source_asset_count')==34,")
s=s.replace("'runtime_variant_count_74':len(runtime)==74 and MANIFEST.get('runtime_variant_count')==74,", "'runtime_variant_count_98':len(runtime)==98 and MANIFEST.get('runtime_variant_count')==98,")
s=s.replace("'catalog_contains_avif_and_webp':'--desktop.avif' in catalog and '--mobile.webp' in catalog and '--thumb.avif' in catalog,", "'catalog_contains_avif_and_webp':'--desktop.avif' in catalog and '--mobile.webp' in catalog and '--thumb.avif' in catalog and '--party.avif' in catalog,")
s=s.replace("'runtime_code_uses_catalog':'BACKGROUND_ASSETS' in assets_core and 'CHARACTER_ASSETS' in avatars and 'TAB_BACKGROUND_KEYS' in router,", "'runtime_code_uses_catalog':'BACKGROUND_ASSETS' in assets_core and 'PARTY_ASSETS' in assets_core and 'CHARACTER_ASSETS' in avatars and 'TAB_BACKGROUND_KEYS' in router,")
audit.write_text(s,encoding='utf-8')

# 6. Asset runtime helper.
assets=ROOT/'src/core/assets.js'
s=assets.read_text(encoding='utf-8')
s=s.replace('import { BACKGROUND_ASSETS } from "../data/assetCatalog.js";', 'import { BACKGROUND_ASSETS, PARTY_ASSETS } from "../data/assetCatalog.js";')
insert=r'''
export function partyPictureMarkup(party, index = 0) {
  const asset = PARTY_ASSETS[party.assetKey];
  if (!asset) return `<span class="partyTextFallback"><b>${party.sigla} ${party.numero}</b><small>${party.nome}</small></span>`;
  const loading = index < 4 ? "eager" : "lazy";
  const priority = index === 0 ? "high" : "low";
  const avif = resolveAppUrl(asset.variants.party.avif);
  const webp = resolveAppUrl(asset.variants.party.webp);
  const fallback = resolveAppUrl(asset.source);
  return `<picture class="partyPicture"><source type="image/avif" srcset="${avif}"><img src="${webp}" data-fallback-src="${fallback}" alt="${party.nome}" loading="${loading}" decoding="async" fetchpriority="${priority}" width="360" height="336"></picture>`;
}
'''
s=s.replace('\nexport function avatarPictureMarkup', insert+'\nexport function avatarPictureMarkup')
assets.write_text(s,encoding='utf-8')

# 7. State defaults.
statef=ROOT/'src/core/stateFactory.js'
s=statef.read_text(encoding='utf-8')
s=s.replace('leader: "Jonatan Vale", party: "MDB", partyName: "Movimento Democrático Brasileiro", avatar: AVATARS[0].src,',
'''leader: "Jonatan Vale", party: "MDB", partyName: "Movimento Democrático Brasileiro", avatar: AVATARS[0].src,
    country: "Brasil", countryCode: "BR",
    governmentSetup: { schema:1, countryId:"brazil", systemId:"coalition_presidentialism", ideologyId:"pragmatic_center", difficultyId:"standard", scenarioId:"balanced_2026", objectiveId:"prosperity", difficultyPressureMultiplier:1, eventIntervalModifier:1 },''')
statef.write_text(s,encoding='utf-8')

# 8. HTML creation screen expansion.
index=ROOT/'index.html'
s=index.read_text(encoding='utf-8')
s=s.replace('<h2>CRIAR LÍDER</h2>\n<p class="lead">Escolha avatar, nome, país e partido real do Brasil. O partido altera bônus de governo, coalizão e risco.</p>',
'''<h2 data-i18n="governmentCreation.title">CRIAR GOVERNO</h2>
<p class="lead" data-i18n="governmentCreation.subtitle">Defina líder, sistema político, ideologia, dificuldade, cenário e objetivo estratégico da carreira.</p>''')
s=s.replace('<div class="panel"><h3>1. Avatar</h3><div class="avatars" id="avatars"></div></div>\n<div class="panel"><h3>2. Nome</h3><label class="field">♙<input autocomplete="name" enterkeyhint="next" id="leaderName" inputmode="text" maxlength="28" value="Jonatan Vale"/></label></div>\n<div class="panel"><h3>3. País</h3><button class="nation active">🇧🇷 BRASIL</button><small>Outras nações serão liberadas na fase Mundo.</small></div>\n<div class="panel">\n<h3>4. Partido real do Brasil</h3>',
'''<div class="panel"><h3 data-i18n="governmentCreation.stepAvatar">1. Avatar</h3><div class="avatars" id="avatars"></div></div>
<div class="panel"><h3 data-i18n="governmentCreation.stepName">2. Nome</h3><label class="field">♙<input autocomplete="name" enterkeyhint="next" id="leaderName" inputmode="text" maxlength="28" value="Jonatan Vale"/></label></div>
<div class="panel"><h3 data-i18n="governmentCreation.stepCountry">3. País</h3><div class="setupGrid compact" id="countryChoices"></div></div>
<div class="panel"><h3 data-i18n="governmentCreation.stepSystem">4. Sistema político</h3><div class="setupGrid" id="systemChoices"></div></div>
<div class="panel"><h3 data-i18n="governmentCreation.stepIdeology">5. Ideologia do líder</h3><div class="setupGrid" id="leaderIdeologyChoices"></div></div>
<div class="panel"><h3 data-i18n="governmentCreation.stepDifficulty">6. Dificuldade</h3><div class="setupGrid" id="difficultyChoices"></div></div>
<div class="panel"><h3 data-i18n="governmentCreation.stepScenario">7. Cenário inicial</h3><div class="setupGrid" id="scenarioChoices"></div></div>
<div class="panel"><h3 data-i18n="governmentCreation.stepObjective">8. Objetivo estratégico</h3><div class="setupGrid" id="objectiveChoices"></div></div>
<div class="panel">
<h3 data-i18n="governmentCreation.stepParty">9. Partido real do Brasil</h3>''')
s=s.replace('</div>\n<button class="gold wide" id="startGame">COMEÇAR JORNADA ›</button>',
'''</div>
<div class="panel setupSummaryPanel"><h3 data-i18n="governmentCreation.summaryTitle">Resumo da carreira</h3><div id="governmentSetupSummary"></div></div>
<button class="gold wide" id="startGame" data-i18n="governmentCreation.start">COMEÇAR JORNADA ›</button>''',1)
index.write_text(s,encoding='utf-8')

# 9. Game setup logic and party cards.
game=ROOT/'src/game.js'
s=game.read_text(encoding='utf-8')
s=s.replace('import { avatarPictureMarkup, bindImageFallbacks, initializeAssetPipeline } from "./core/assets.js";', 'import { avatarPictureMarkup, partyPictureMarkup, bindImageFallbacks, initializeAssetPipeline } from "./core/assets.js";')
s=s.replace('import { PARTIES } from "./data/parties.js";', 'import { PARTIES } from "./data/parties.js";\nimport { COUNTRIES, POLITICAL_SYSTEMS, LEADER_IDEOLOGIES, DIFFICULTIES, STARTING_SCENARIOS, STRATEGIC_OBJECTIVES } from "./data/governmentCreationData.js";')
s=s.replace('import { advanceDay, ensureCoreLoopState, consumeActionCapacity, scheduleActionConsequence, queueConsequence, holdElection, acknowledgeCareerOutcome } from "./systems/coreLoop.js";', 'import { advanceDay, ensureCoreLoopState, consumeActionCapacity, scheduleActionConsequence, queueConsequence, holdElection, acknowledgeCareerOutcome } from "./systems/coreLoop.js";\nimport { applyGovernmentCreation } from "./systems/governmentCreation.js";')
s=s.replace('let selectedParty = PARTIES[0];', '''let selectedParty = PARTIES[0];
let governmentSelection = {
  countryId: COUNTRIES[0].id,
  systemId: POLITICAL_SYSTEMS[0].id,
  ideologyId: LEADER_IDEOLOGIES[0].id,
  difficultyId: DIFFICULTIES[1].id,
  scenarioId: STARTING_SCENARIOS[0].id,
  objectiveId: STRATEGIC_OBJECTIVES[0].id,
};''')
old_setup='''  $("#partySearch").oninput = renderParties;
  $("#ideology").onchange = renderParties;
  renderParties();
}'''
new_setup='''  $("#partySearch").oninput = renderParties;
  $("#ideology").onchange = renderParties;
  renderSetupChoices();
  renderParties();
}'''
if old_setup not in s: raise SystemExit('setup hook not found')
s=s.replace(old_setup,new_setup,1)
old_render=re.search(r'function renderParties\(\) \{.*?\n\}',s,re.S).group(0)
new_render=r'''function setupChoiceCard(item, group, selectedId) {
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
}'''
s=s.replace(old_render,new_render,1)
s=s.replace('  state.avatarAssetKey = selectedAvatar.assetKey;\n  applyEffects(state, {', '  state.avatarAssetKey = selectedAvatar.assetKey;\n  applyGovernmentCreation(state, governmentSelection, key => t(key));\n  applyEffects(state, {')
s=s.replace('  log(`Posse concluída: ${state.leader} assume o Brasil pelo ${state.party}.`, "positive");', '  log(t("governmentCreation.inauguration", { leader: state.leader, country: state.country, party: state.party }), "positive");')
# rerender create options on locale switch
s=s.replace('document.addEventListener("diplocraft:localechange", () => {', 'document.addEventListener("diplocraft:localechange", () => {\n    if (document.getElementById("create")?.classList.contains("active")) { renderSetupChoices(); renderParties(); }')
game.write_text(s,encoding='utf-8')

# 10. Core loop difficulty hooks.
core=ROOT/'src/systems/coreLoop.js'
s=core.read_text(encoding='utf-8')
s=s.replace('import { tickMonetizationCooldowns } from "./monetization.js";', 'import { tickMonetizationCooldowns } from "./monetization.js";\nimport { getDifficultyProfile } from "./governmentCreation.js";')
s=s.replace('      state.nextEventIn = 10 + Math.floor(Math.random() * 11);', '      const difficulty = getDifficultyProfile(state);\n      state.nextEventIn = Math.max(5, Math.round((10 + Math.floor(Math.random() * 11)) * Number(difficulty.eventIntervalModifier || 1)));')
s=s.replace('function passiveDrift(state) {\n  const gov = ensureCoreLoopState(state);', 'function passiveDrift(state) {\n  const gov = ensureCoreLoopState(state);\n  const difficulty = getDifficultyProfile(state);\n  const pressure = Number(difficulty.pressureMultiplier || 1);')
s=s.replace('state.crisis * 0.006 - fatiguePenalty + approvalRecovery', 'state.crisis * 0.006 * pressure - fatiguePenalty * pressure + approvalRecovery')
s=s.replace('state.corruption * 0.00055 - state.crisis * 0.004 + stabilityRecovery', 'state.corruption * 0.00055 * pressure - state.crisis * 0.004 * pressure + stabilityRecovery')
s=s.replace('function weeklyGovernanceCycle(state, log) {\n  const gov = ensureCoreLoopState(state);', 'function weeklyGovernanceCycle(state, log) {\n  const gov = ensureCoreLoopState(state);\n  const difficulty = getDifficultyProfile(state);')
s=s.replace('gov.maxActionPoints = clampNumber(Math.round(4 + gov.administrativeCapacity / 12), 5, 12);', 'gov.maxActionPoints = clampNumber(Math.round(4 + gov.administrativeCapacity / 12 + Number(difficulty.governance?.maxActionPoints || 0)), 5, 12);')
s=s.replace('function monitorInstitutionalPressure(state, log, ignoreOutcomes) {\n  const gov = ensureCoreLoopState(state);', 'function monitorInstitutionalPressure(state, log, ignoreOutcomes) {\n  const gov = ensureCoreLoopState(state);\n  const difficulty = getDifficultyProfile(state);\n  const pressure = Number(difficulty.pressureMultiplier || 1);')
s=s.replace('if (risk > 78 && gov.totalDays % 7 === 0) {', 'if (risk > 78 / pressure && gov.totalDays % 7 === 0) {')
core.write_text(s,encoding='utf-8')

# 11. Progression support for governance targets.
prog=ROOT/'src/systems/progression.js'
s=prog.read_text(encoding='utf-8')
s=s.replace('    const value = state[goal.target] ?? 0;', '    const value = goal.governanceTarget ? (state.governance?.[goal.target] ?? 0) : (state[goal.target] ?? 0);')
prog.write_text(s,encoding='utf-8')

# 12. Dashboard summary.
render=ROOT/'src/ui/render.js'
s=render.read_text(encoding='utf-8')
s=s.replace('import { monetizationScore } from "../systems/monetization.js";', 'import { monetizationScore } from "../systems/monetization.js";\nimport { getGovernmentSetupDefinition } from "../systems/governmentCreation.js";')
s=s.replace('  setHTML("governanceCycle", `\n    <div class="econHero coreLoopHero">', '  const creation = getGovernmentSetupDefinition(state);\n  setHTML("governanceCycle", `\n    <div class="governmentIdentityLine"><span>${creation.country.flag} ${t(creation.country.nameKey)}</span><b>${t(creation.system.nameKey)}</b><small>${t(creation.difficulty.nameKey)} • ${t(creation.scenario.nameKey)}</small></div>\n    <div class="econHero coreLoopHero">')
render.write_text(s,encoding='utf-8')

# 13. Styles.
styles=ROOT/'src/styles.css'
s=styles.read_text(encoding='utf-8')
append=r'''
/* Phase 15 — Government Creation */
.setupGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.setupGrid.compact{grid-template-columns:minmax(220px,420px)}.setupChoice{min-height:138px;border:1px solid rgba(217,170,67,.24);border-radius:14px;padding:14px;background:linear-gradient(145deg,rgba(7,20,32,.9),rgba(2,8,14,.86));color:#f7efe4;text-align:left;cursor:pointer;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"icon name" "icon desc";column-gap:12px;align-content:center;transition:.18s}.setupChoice:hover{transform:translateY(-2px);border-color:rgba(240,199,105,.65)}.setupChoice.active{outline:2px solid var(--gold);background:linear-gradient(145deg,rgba(76,55,18,.72),rgba(4,15,24,.94));box-shadow:0 0 28px rgba(217,170,67,.2)}.setupChoice .setupIcon{grid-area:icon;font-size:29px;min-width:38px;text-align:center}.setupChoice b{grid-area:name;color:#ffe09b;font-size:17px}.setupChoice small{grid-area:desc;color:#c8d0d8;line-height:1.38;margin-top:5px}.setupSummaryPanel #governmentSetupSummary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.setupSummaryPanel #governmentSetupSummary div{border:1px solid rgba(217,170,67,.18);background:rgba(0,0,0,.22);border-radius:10px;padding:10px;min-width:0}.setupSummaryPanel span{display:block;color:#b7a078;font-size:11px;text-transform:uppercase}.setupSummaryPanel b{display:block;color:#fff3c9;margin-top:3px;overflow-wrap:anywhere}.partyLogoCard{padding:7px;min-height:auto;aspect-ratio:360/336;background:linear-gradient(145deg,rgba(4,17,27,.96),rgba(2,8,14,.92));overflow:hidden}.partyLogoCard picture,.partyLogoCard img{display:block;width:100%;height:100%}.partyLogoCard img{object-fit:cover;border-radius:11px}.partyLogoCard .partyTextFallback{display:grid;place-items:center;min-height:100%;text-align:center}.partyLogoCard .partyTextFallback small{margin-top:8px}.partyPicture{pointer-events:none}.srOnly{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.governmentIdentityLine{display:grid;grid-template-columns:1fr auto;gap:4px 12px;border:1px solid rgba(217,170,67,.18);background:rgba(0,0,0,.24);border-radius:12px;padding:11px;margin-bottom:10px}.governmentIdentityLine span{color:#ffe09b;font-weight:800}.governmentIdentityLine b{color:#f4d28b;text-align:right}.governmentIdentityLine small{grid-column:1/-1;color:#aab3bf}
@media(max-width:880px){.setupGrid{grid-template-columns:1fr 1fr}.setupGrid.compact{grid-template-columns:1fr}.setupChoice{min-height:128px;padding:11px}.setupChoice .setupIcon{font-size:25px}.parties{grid-template-columns:1fr 1fr;gap:9px}.partyLogoCard{padding:5px}.setupSummaryPanel #governmentSetupSummary{grid-template-columns:1fr}.governmentIdentityLine{grid-template-columns:1fr}.governmentIdentityLine b{text-align:left}}
@media(max-width:360px){.setupGrid{grid-template-columns:1fr}.parties{grid-template-columns:1fr 1fr}.setupChoice{min-height:118px}.partyLogoCard{border-radius:12px}}
'''
s += '\n'+append
styles.write_text(s,encoding='utf-8')

# 14. I18N entries.
seed_path=ROOT/'tools/i18n_seed.json'
seed=json.loads(seed_path.read_text(encoding='utf-8'))
E=seed['entries']
entries={
"governmentCreation.title":("CRIAR GOVERNO","CREATE GOVERNMENT","CREAR GOBIERNO"),
"governmentCreation.subtitle":("Defina líder, sistema político, ideologia, dificuldade, cenário e objetivo estratégico da carreira.","Define the leader, political system, ideology, difficulty, scenario and strategic objective of the career.","Define al líder, el sistema político, la ideología, la dificultad, el escenario y el objetivo estratégico de la carrera."),
"governmentCreation.stepAvatar":("1. Avatar","1. Avatar","1. Avatar"),
"governmentCreation.stepName":("2. Nome","2. Name","2. Nombre"),
"governmentCreation.stepCountry":("3. País","3. Country","3. País"),
"governmentCreation.stepSystem":("4. Sistema político","4. Political system","4. Sistema político"),
"governmentCreation.stepIdeology":("5. Ideologia do líder","5. Leader ideology","5. Ideología del líder"),
"governmentCreation.stepDifficulty":("6. Dificuldade","6. Difficulty","6. Dificultad"),
"governmentCreation.stepScenario":("7. Cenário inicial","7. Starting scenario","7. Escenario inicial"),
"governmentCreation.stepObjective":("8. Objetivo estratégico","8. Strategic objective","8. Objetivo estratégico"),
"governmentCreation.stepParty":("9. Partido real do Brasil","9. Real Brazilian party","9. Partido real de Brasil"),
"governmentCreation.summaryTitle":("Resumo da carreira","Career summary","Resumen de la carrera"),
"governmentCreation.start":("COMEÇAR JORNADA ›","START JOURNEY ›","COMENZAR TRAYECTORIA ›"),
"governmentCreation.summaryCountry":("País","Country","País"),
"governmentCreation.summarySystem":("Sistema","System","Sistema"),
"governmentCreation.summaryIdeology":("Ideologia","Ideology","Ideología"),
"governmentCreation.summaryDifficulty":("Dificuldade","Difficulty","Dificultad"),
"governmentCreation.summaryScenario":("Cenário","Scenario","Escenario"),
"governmentCreation.summaryObjective":("Objetivo","Objective","Objetivo"),
"governmentCreation.summaryParty":("Partido","Party","Partido"),
"governmentCreation.selectParty":("Selecionar {party}","Select {party}","Seleccionar {party}"),
"governmentCreation.inauguration":("Posse concluída: {leader} assume {country} pelo {party}.","Inauguration completed: {leader} takes office in {country} for {party}.","Investidura concluida: {leader} asume en {country} por {party}."),
"governmentCreation.country.brazil.name":("Brasil","Brazil","Brasil"),
"governmentCreation.country.brazil.official":("República Federativa do Brasil","Federative Republic of Brazil","República Federativa de Brasil"),
"governmentCreation.country.brazil.description":("Federação presidencial com Congresso multipartidário e forte diversidade regional.","Presidential federation with a multiparty Congress and strong regional diversity.","Federación presidencial con Congreso multipartidista y gran diversidad regional."),
"governmentCreation.system.presidential.name":("Presidencialismo de coalizão","Coalition presidentialism","Presidencialismo de coalición"),
"governmentCreation.system.presidential.description":("Executivo forte, negociação constante com o Congresso e mandato fixo.","Strong executive, constant negotiation with Congress and a fixed term.","Ejecutivo fuerte, negociación constante con el Congreso y mandato fijo."),
"governmentCreation.system.semi.name":("Semipresidencialismo","Semi-presidentialism","Semipresidencialismo"),
"governmentCreation.system.semi.description":("Presidente e primeiro-ministro dividem poder, aumentando coordenação e estabilidade.","The president and prime minister share power, increasing coordination and stability.","El presidente y el primer ministro comparten el poder, aumentando la coordinación y la estabilidad."),
"governmentCreation.system.parliamentary.name":("Parlamentarismo","Parliamentarism","Parlamentarismo"),
"governmentCreation.system.parliamentary.description":("O governo depende diretamente da maioria parlamentar e da disciplina da coalizão.","The government depends directly on the parliamentary majority and coalition discipline.","El gobierno depende directamente de la mayoría parlamentaria y de la disciplina de la coalición."),
"governmentCreation.ideology.center.name":("Centro pragmático","Pragmatic center","Centro pragmático"),
"governmentCreation.ideology.center.description":("Prioriza governabilidade, acordos e equilíbrio entre mercado e políticas sociais.","Prioritizes governability, agreements and balance between markets and social policy.","Prioriza la gobernabilidad, los acuerdos y el equilibrio entre mercado y políticas sociales."),
"governmentCreation.ideology.social.name":("Social-democracia","Social democracy","Socialdemocracia"),
"governmentCreation.ideology.social.description":("Amplia proteção social e serviços públicos, com maior pressão fiscal.","Expands social protection and public services, with greater fiscal pressure.","Amplía la protección social y los servicios públicos, con mayor presión fiscal."),
"governmentCreation.ideology.liberal.name":("Liberalismo econômico","Economic liberalism","Liberalismo económico"),
"governmentCreation.ideology.liberal.description":("Fortalece mercado, investimento privado e disciplina de gastos.","Strengthens markets, private investment and spending discipline.","Fortalece el mercado, la inversión privada y la disciplina del gasto."),
"governmentCreation.ideology.conservative.name":("Conservadorismo democrático","Democratic conservatism","Conservadurismo democrático"),
"governmentCreation.ideology.conservative.description":("Prioriza ordem pública, segurança, valores tradicionais e instituições democráticas.","Prioritizes public order, security, traditional values and democratic institutions.","Prioriza el orden público, la seguridad, los valores tradicionales y las instituciones democráticas."),
"governmentCreation.ideology.green.name":("Desenvolvimento verde","Green development","Desarrollo verde"),
"governmentCreation.ideology.green.description":("Combina transição climática, tecnologia e crescimento sustentável.","Combines climate transition, technology and sustainable growth.","Combina transición climática, tecnología y crecimiento sostenible."),
"governmentCreation.difficulty.civic.name":("Cidadão — acessível","Citizen — accessible","Ciudadano — accesible"),
"governmentCreation.difficulty.civic.description":("Mais recursos, crises menos frequentes e maior capacidade administrativa.","More resources, less frequent crises and greater administrative capacity.","Más recursos, crisis menos frecuentes y mayor capacidad administrativa."),
"governmentCreation.difficulty.standard.name":("Governante — padrão","Governor — standard","Gobernante — estándar"),
"governmentCreation.difficulty.standard.description":("Experiência equilibrada e recomendada para a primeira carreira completa.","Balanced experience recommended for the first complete career.","Experiencia equilibrada recomendada para la primera carrera completa."),
"governmentCreation.difficulty.strategist.name":("Estrategista — difícil","Strategist — hard","Estratega — difícil"),
"governmentCreation.difficulty.strategist.description":("Menos recursos, maior pressão e menor margem para decisões ruins.","Fewer resources, greater pressure and less room for poor decisions.","Menos recursos, mayor presión y menor margen para malas decisiones."),
"governmentCreation.difficulty.statesman.name":("Estadista — realista","Statesman — realistic","Estadista — realista"),
"governmentCreation.difficulty.statesman.description":("Crises severas, recursos limitados e alto risco institucional desde o início.","Severe crises, limited resources and high institutional risk from the start.","Crisis severas, recursos limitados y alto riesgo institucional desde el inicio."),
"governmentCreation.scenario.balanced.name":("Brasil 2026 — equilíbrio tenso","Brazil 2026 — tense balance","Brasil 2026 — equilibrio tenso"),
"governmentCreation.scenario.balanced.description":("Economia e instituições operam, mas coalizão, inflação e aprovação exigem atenção.","The economy and institutions function, but coalition, inflation and approval require attention.","La economía y las instituciones funcionan, pero la coalición, la inflación y la aprobación requieren atención."),
"governmentCreation.scenario.fiscal.name":("Emergência fiscal","Fiscal emergency","Emergencia fiscal"),
"governmentCreation.scenario.fiscal.description":("Dívida, inflação e desconfiança de mercado ameaçam a capacidade do Estado.","Debt, inflation and market distrust threaten state capacity.","La deuda, la inflación y la desconfianza del mercado amenazan la capacidad del Estado."),
"governmentCreation.scenario.social.name":("Convulsão social","Social unrest","Convulsión social"),
"governmentCreation.scenario.social.description":("Protestos, desemprego e baixa coesão colocam o governo sob pressão imediata.","Protests, unemployment and low cohesion place the government under immediate pressure.","Las protestas, el desempleo y la baja cohesión someten al gobierno a una presión inmediata."),
"governmentCreation.scenario.global.name":("Tensão global","Global tension","Tensión global"),
"governmentCreation.scenario.global.description":("Conflitos externos, comércio instável e alianças divididas exigem liderança diplomática.","External conflicts, unstable trade and divided alliances demand diplomatic leadership.","Los conflictos externos, el comercio inestable y las alianzas divididas exigen liderazgo diplomático."),
"governmentCreation.objective.prosperity.name":("Prosperidade e emprego","Prosperity and jobs","Prosperidad y empleo"),
"governmentCreation.objective.prosperity.description":("Acelerar a economia, reduzir desemprego e fortalecer investimento.","Accelerate the economy, reduce unemployment and strengthen investment.","Acelerar la economía, reducir el desempleo y fortalecer la inversión."),
"governmentCreation.objective.social.name":("Pacto social","Social pact","Pacto social"),
"governmentCreation.objective.social.description":("Reduzir desigualdade e ampliar aprovação por meio de políticas sociais.","Reduce inequality and expand approval through social policies.","Reducir la desigualdad y ampliar la aprobación mediante políticas sociales."),
"governmentCreation.objective.institution.name":("Fortalecimento institucional","Institutional strengthening","Fortalecimiento institucional"),
"governmentCreation.objective.institution.description":("Elevar estabilidade, combater corrupção e proteger a democracia.","Raise stability, fight corruption and protect democracy.","Elevar la estabilidad, combatir la corrupción y proteger la democracia."),
"governmentCreation.objective.global.name":("Liderança global","Global leadership","Liderazgo global"),
"governmentCreation.objective.global.description":("Ampliar influência, prestígio e capacidade diplomática internacional.","Expand influence, prestige and international diplomatic capacity.","Ampliar la influencia, el prestigio y la capacidad diplomática internacional."),
"governmentCreation.objective.green.name":("Potência verde","Green power","Potencia verde"),
"governmentCreation.objective.green.description":("Transformar clima, tecnologia e energia limpa em vantagem nacional.","Turn climate, technology and clean energy into a national advantage.","Convertir el clima, la tecnología y la energía limpia en una ventaja nacional."),
"governmentCreation.goal.approval":("Aprovação nacional","National approval","Aprobación nacional"),
"governmentCreation.goal.stability":("Estabilidade institucional","Institutional stability","Estabilidad institucional"),
"governmentCreation.goal.economy":("Economia aquecida","Strong economy","Economía dinámica"),
"governmentCreation.goal.debt":("Dívida sustentável","Sustainable debt","Deuda sostenible"),
"governmentCreation.goal.inflation":("Inflação controlada","Controlled inflation","Inflación controlada"),
"governmentCreation.goal.market":("Confiança do mercado","Market confidence","Confianza del mercado"),
"governmentCreation.goal.cohesion":("Coesão social","Social cohesion","Cohesión social"),
"governmentCreation.goal.crisis":("Crises sob controle","Crises under control","Crisis bajo control"),
"governmentCreation.goal.tension":("Reduzir tensão global","Reduce global tension","Reducir la tensión global"),
"governmentCreation.goal.influence":("Influência global","Global influence","Influencia global"),
"governmentCreation.goal.diplomacy":("Diplomacia fortalecida","Stronger diplomacy","Diplomacia fortalecida"),
"governmentCreation.goal.unemployment":("Desemprego reduzido","Lower unemployment","Desempleo reducido"),
"governmentCreation.goal.inequality":("Desigualdade reduzida","Lower inequality","Desigualdad reducida"),
"governmentCreation.goal.corruption":("Corrupção combatida","Corruption reduced","Corrupción combatida"),
"governmentCreation.goal.prestige":("Prestígio internacional","International prestige","Prestigio internacional"),
"governmentCreation.goal.environment":("Liderança ambiental","Environmental leadership","Liderazgo ambiental"),
"governmentCreation.goal.technology":("Potência tecnológica","Technology power","Potencia tecnológica"),
}
for key,(pt,en,es) in entries.items(): E[key]={'pt-BR':pt,'en':en,'es':es}
seed['localization_complete']['exact_content_entries_added']=len(E)
seed['localization_complete']['review_date']='2026-06-17'
seed_path.write_text(json.dumps(seed,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# 15. Build config and package.
config_path=ROOT/'build.config.json'
c=json.loads(config_path.read_text(encoding='utf-8'))
c.update({
  'version':'1.5.1','stage_number':15,'stage_name':'Criação de Governo','status':'GOVERNMENT_CREATION_VERIFIED',
  'date':'17/06/2026','date_iso':'2026-06-17','time':'17:05','stamp':'20260617_1705','base_version':'1.5.0','base_stage':'Fase 14 — Core Loop 2.0',
  'summary':'Criação de carreira ampliada com identidade de governo, sistema político, ideologia, dificuldade, cenário, objetivo estratégico e seleção visual por logos reais dos partidos.',
  'build_summary':'Build com criação de governo completa, 12 partidos por cards visuais, quatro dificuldades, quatro cenários e cinco objetivos estratégicos conectados ao Core Loop 2.0.',
  'asset_paths_changed':True,
  'features':[
    'Seleção visual dos 12 partidos por cards individuais e clicáveis',
    'País e identidade institucional armazenados em cada carreira',
    'Três sistemas políticos com modificadores próprios de coalizão e capacidade administrativa',
    'Cinco ideologias de liderança com bônus e custos distintos',
    'Quatro níveis de dificuldade que afetam recursos, pressão e frequência de eventos',
    'Quatro cenários iniciais com condições econômicas, sociais e geopolíticas próprias',
    'Cinco objetivos estratégicos que geram metas de mandato personalizadas',
    'Compatibilidade preservada com saves schema 3, PWA, mobile, desktop, localização e Core Loop 2.0'
  ],
  'changelog':{
    'Adicionado':['Criação de governo em nove etapas com resumo antes da posse.','Cards de logos dos 12 partidos integrados à pipeline AVIF/WebP.','Dificuldade e cenário agora influenciam o estado inicial e o ritmo de eventos.','Metas de mandato personalizadas pelo cenário e objetivo estratégico.'],
    'Corrigido':['A escolha partidária era composta apenas por blocos textuais.','Todas as novas carreiras começavam com o mesmo perfil político e econômico.'],
    'Preservado':['Core Loop 2.0, saves, localização completa, rolagem, mobile, desktop, PWA e Anti-Break Core.']
  },
  'next_release':{'version':'1.6.0','stage':'Fase 16 — País e População'},
  'government_creation':{
    'enabled':True,'schema':1,'playable_countries':1,'political_systems':3,'leader_ideologies':5,'difficulty_levels':4,'starting_scenarios':4,'strategic_objectives':5,'party_logo_cards':12,'audit':'tests/run_government_creation_audit.py'
  }
})
c['history'].insert(0,{'version':'1.5.0','title':'Fase 14 Core Loop 2.0','date_time':'17/06/2026 12:56','items':['Ciclo diário, semanal, mensal, trimestral e anual, consequências atrasadas e finais reais de carreira.']})
c['asset_pipeline']['source_assets']=34;c['asset_pipeline']['runtime_variants']=98
config_path.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
package_path=ROOT/'package.json';p=json.loads(package_path.read_text());p['version']='1.5.1';p['description']='DIPLOCRAFT political simulator with complete government creation, party logo selection, Core Loop 2.0, multi-slot saves and full localization';p['scripts']['test:government-creation']='python3 tests/run_government_creation_audit.py';package_path.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')

# 16. Build generator runtime should include government creation.
gen=ROOT/'tools/generate_build.py'
s=gen.read_text(encoding='utf-8')
s=s.replace('"coreLoop2":b.get("core_loop_2"),"summary":b["summary"]', '"coreLoop2":b.get("core_loop_2"),"governmentCreation":b.get("government_creation"),"summary":b["summary"]')
gen.write_text(s,encoding='utf-8')

# 17. Audit script.
(ROOT/'tests/run_government_creation_audit.py').write_text(r"""#!/usr/bin/env python3
from pathlib import Path
import json, os, re, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
HTML=(ROOT/'tests/harness.html').read_text(encoding='utf-8')
DATA=(ROOT/'src/data/governmentCreationData.js').read_text(encoding='utf-8')
GAME=(ROOT/'src/game.js').read_text(encoding='utf-8')
CATALOG=(ROOT/'src/data/assetCatalog.js').read_text(encoding='utf-8')
STATIC={
 'phase15_declared':CONFIG.get('stage_number')==15 and CONFIG.get('government_creation',{}).get('enabled') is True,
 'six_setup_dimensions_present':all(token in DATA for token in ['COUNTRIES','POLITICAL_SYSTEMS','LEADER_IDEOLOGIES','DIFFICULTIES','STARTING_SCENARIOS','STRATEGIC_OBJECTIVES']),
 'party_logo_assets_count_12':len(list((ROOT/'assets/ui/parties').glob('*.png')))==12,
 'party_runtime_catalog_count_12':CATALOG.count('party_')>=12 and 'parties' in CATALOG,
 'game_uses_party_picture_markup':'partyPictureMarkup' in GAME and 'partyLogoCard' in GAME,
 'government_setup_applied':'applyGovernmentCreation(state, governmentSelection' in GAME,
 'save_schema_preserved':CONFIG.get('save_schema')==3,
 'three_locales_preserved':CONFIG.get('supported_locales')==['pt-BR','en','es'],
}
CASES=[('mobile_320x568',320,568,True),('mobile_390x844',390,844,True),('tablet_768x1024',768,1024,True),('desktop_1366x768',1366,768,False)]
LOCAL_STORAGE=r'''(() => { const data=new Map(); const storage={getItem(k){k=String(k);return data.has(k)?data.get(k):null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))},clear(){data.clear()},key(i){return Array.from(data.keys())[i]??null},get length(){return data.size}};Object.defineProperty(window,'localStorage',{value:storage,configurable:true});})();'''
def launch_options():
  options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM')!='1':
    exe=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    if exe: options['executable_path']=exe
  return options

def run_case(browser,name,w,h,touch):
  context=browser.new_context(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch)
  page=context.new_page();page.set_default_timeout(10000);page.add_init_script(LOCAL_STORAGE)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='domcontentloaded');page.wait_for_timeout(700)
  page.locator('[data-go="create"]').click();page.wait_for_timeout(120)
  checks={}
  checks['nine_creation_panels']=page.locator('#create .panel').count()>=9
  checks['three_system_cards']=page.locator('#systemChoices .setupChoice').count()==3
  checks['five_ideologies']=page.locator('#leaderIdeologyChoices .setupChoice').count()==5
  checks['four_difficulties']=page.locator('#difficultyChoices .setupChoice').count()==4
  checks['four_scenarios']=page.locator('#scenarioChoices .setupChoice').count()==4
  checks['five_objectives']=page.locator('#objectiveChoices .setupChoice').count()==5
  checks['twelve_party_logo_cards']=page.locator('#parties .partyLogoCard').count()==12
  checks['party_images_loaded']=page.locator('#parties img').count()==12 and page.evaluate("[...document.querySelectorAll('#parties img')].every(img=>img.complete && img.naturalWidth>0)")
  page.locator('#systemChoices [data-setup-id="parliamentarism"]').click()
  page.locator('#leaderIdeologyChoices [data-setup-id="green_development"]').click()
  page.locator('#difficultyChoices [data-setup-id="statesman"]').click()
  page.locator('#scenarioChoices [data-setup-id="global_tension"]').click()
  page.locator('#objectiveChoices [data-setup-id="green_power"]').click()
  page.locator('#parties [data-party="PV"]').click()
  checks['selected_cards_have_active_state']=page.locator('.setupChoice.active').count()==6 and page.locator('#parties .party.active').count()==1
  checks['summary_updates']=all(term in page.locator('#governmentSetupSummary').inner_text() for term in ['Parlamentarismo','Estadista','Tensão global','Potência verde','PV 43'])
  page.locator('#startGame').click();page.wait_for_timeout(350)
  if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').click()
  state=page.evaluate('window.__DIPLOCRAFT_DEBUG__?.getState?.() || null')
  if state is None:
    state=page.evaluate('''() => { const text=document.getElementById('governanceCycle')?.innerText||''; return {text}; }''')
  game_text=page.locator('#governanceCycle').inner_text()
  checks['dashboard_shows_setup']='Parlamentarismo' in game_text and 'Estadista' in game_text and 'Tensão global' in game_text
  checks['party_persisted_in_hud']='PV' in page.locator('#hudParty').inner_text()
  checks['no_horizontal_overflow']=page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 4')
  checks['no_page_errors']=not errors
  context.close()
  return {'case':name,'checks':checks,'passed':all(checks.values()),'errors':errors}

with sync_playwright() as pw:
  browser=pw.chromium.launch(**launch_options())
  runtime=[run_case(browser,*case) for case in CASES]
  browser.close()
checks={**STATIC,'all_runtime_cases_passed':all(item['passed'] for item in runtime)}
count=len(STATIC)+sum(len(item['checks']) for item in runtime)+1
result={'project':'DIPLOCRAFT','version':CONFIG['version'],'phase':CONFIG['stage_name'],'static_checks':STATIC,'runtime':runtime,'checks':checks,'check_count':count,'passed':all(checks.values())}
(ROOT/'tests/government-creation-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in STATIC.items()]
for item in runtime: lines.append(f"{'PASS' if item['passed'] else 'FAIL'} {item['case']} ({sum(item['checks'].values())}/{len(item['checks'])})")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {count} checks")
(ROOT/'tests/government-creation-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)
""",encoding='utf-8')

# Integrate audit into gate and full test runner.
gate=ROOT/'tests/run_quality_gate.py';s=gate.read_text(encoding='utf-8')
s=s.replace("core_loop_2 = read_json('tests/core-loop-2-results.json')", "core_loop_2 = read_json('tests/core-loop-2-results.json')\ngovernment_creation = read_json('tests/government-creation-results.json')")
s=s.replace("{'name':'core-loop-2-audit','passed':bool(core_loop_2 and core_loop_2.get('passed')),'checks':int((core_loop_2 or {}).get('check_count') or 0)},", "{'name':'core-loop-2-audit','passed':bool(core_loop_2 and core_loop_2.get('passed')),'checks':int((core_loop_2 or {}).get('check_count') or 0)},\n    {'name':'government-creation-audit','passed':bool(government_creation and government_creation.get('passed')),'checks':int((government_creation or {}).get('check_count') or 0)},")
gate.write_text(s,encoding='utf-8')
runall=ROOT/'tests/run_all_tests.sh';s=runall.read_text(encoding='utf-8').replace('python3 tests/run_core_loop_2_audit.py\npython3 tests/run_quality_gate.py','python3 tests/run_core_loop_2_audit.py\npython3 tests/run_government_creation_audit.py\npython3 tests/run_quality_gate.py');runall.write_text(s,encoding='utf-8')

# 18. Docs.
(ROOT/'GOVERNMENT_CREATION_GUIDE.md').write_text('''# Fase 15 — Criação de Governo\n\nA nova carreira é definida em nove etapas: avatar, nome, país, sistema político, ideologia, dificuldade, cenário, objetivo estratégico e partido.\n\n## Partidos\nOs 12 partidos são selecionados por cards visuais individuais em `assets/ui/parties/`. A pipeline gera AVIF e WebP, preservando PNG como fallback.\n\n## Dificuldade\n- Cidadão: recursos ampliados e pressão reduzida.\n- Governante: equilíbrio padrão.\n- Estrategista: menos recursos e maior pressão.\n- Estadista: cenário realista e severo.\n\n## Compatibilidade\nSaves antigos continuam válidos. Ao carregar uma carreira anterior, o perfil padrão é Brasil, presidencialismo de coalizão, centro pragmático, dificuldade padrão e cenário equilibrado.\n''',encoding='utf-8')
(ROOT/'KNOWN_ISSUES_PHASE_15.md').write_text('''# Pendências conhecidas — Fase 15\n\n- O Brasil é o único país plenamente jogável nesta fase; a arquitetura de países já está pronta para expansão.\n- Os sistemas semipresidencial e parlamentar usam modificadores de simulação, mas ainda compartilham o mesmo Congresso e calendário eleitoral brasileiro.\n- Os logos partidários derivam da folha visual fornecida pelo usuário e devem ser revisados novamente antes de uma distribuição comercial oficial.\n''',encoding='utf-8')

print('Phase 15 source patch applied.')

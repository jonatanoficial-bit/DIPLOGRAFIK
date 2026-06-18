#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, re, shutil

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
SIM=json.loads((ROOT/'tests/simulation-results.json').read_text(encoding='utf-8'))
HTML=(ROOT/'tests/harness.html').read_text(encoding='utf-8')
DATA=(ROOT/'src/data/populationData.js').read_text(encoding='utf-8')
SYSTEM=(ROOT/'src/systems/population.js').read_text(encoding='utf-8')
CORE=(ROOT/'src/systems/coreLoop.js').read_text(encoding='utf-8')
STATE=(ROOT/'src/core/stateFactory.js').read_text(encoding='utf-8')
RENDER=(ROOT/'src/ui/render.js').read_text(encoding='utf-8')
INDEX=(ROOT/'index.html').read_text(encoding='utf-8')
CSS=(ROOT/'src/styles.css').read_text(encoding='utf-8')
SEED=json.loads((ROOT/'tools/i18n_seed.json').read_text(encoding='utf-8'))

STATIC={
  'phase16_preserved_in_current_phase':CONFIG.get('stage_number')>=16 and CONFIG.get('country_population',{}).get('enabled') is True,
  'population_schema_one':'POPULATION_SCHEMA = 1' in SYSTEM,
  'five_regions_declared':DATA.count('population.region.')>=5 and CONFIG.get('country_population',{}).get('regions')==5,
  'six_social_groups_declared':DATA.count('population.group.')>=6 and CONFIG.get('country_population',{}).get('social_groups')==6,
  'six_population_policies':DATA.count('titleKey:"population.policy.')==6 and CONFIG.get('country_population',{}).get('population_policies')==6,
  'state_factory_includes_population':'createPopulationState' in STATE and 'population: createPopulationState()' in STATE,
  'core_loop_runs_population_cycles':all(token in CORE for token in ['processPopulationDay','weeklyPopulationCycle','monthlyPopulationCycle']),
  'population_ui_tab_present':'id="tab-population"' in INDEX and 'data-tab="population"' in INDEX,
  'population_renderer_present':'function renderPopulation' in RENDER and 'renderPopulation(state, actions)' in RENDER,
  'population_mobile_css_present':all(token in CSS for token in ['.populationHero','.regionalPopulationGrid','.socialGroupsGrid','.populationPolicyGrid']),
  'population_i18n_complete':all(key in SEED.get('entries',{}) for key in ['nav.population','population.region.north','population.group.lowIncome','population.policy.health.title','phase16.summary']),
  'save_schema_preserved':CONFIG.get('save_schema')==3,
  'core_loop_2_preserved':CONFIG.get('core_loop_2',{}).get('enabled') is True and CONFIG.get('core_loop_2',{}).get('schema')==2,
  'simulation_matrix_passed':SIM.get('passed') is True and SIM.get('total_simulated_days')==129600,
  'simulation_contains_population_metrics':all(key in SIM.get('final_averages',{}) for key in ['populationSatisfaction','qualityOfLife','regionalInequality','poverty']),
  'simulation_population_within_targets':SIM.get('final_averages',{}).get('populationSatisfaction',0)>=15 and SIM.get('final_averages',{}).get('qualityOfLife',0)>=20 and SIM.get('final_averages',{}).get('regionalInequality',100)<=75 and SIM.get('final_averages',{}).get('poverty',100)<=80,
}

CASES=[
 ('mobile_320x568',320,568,True),
 ('mobile_390x844',390,844,True),
 ('tablet_768x1024',768,1024,True),
 ('desktop_1366x768',1366,768,False),
]
LOCAL_STORAGE=r'''(() => { const data=new Map(); const storage={getItem(k){k=String(k);return data.has(k)?data.get(k):null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))},clear(){data.clear()},key(i){return Array.from(data.keys())[i]??null},get length(){return data.size}};Object.defineProperty(window,'localStorage',{value:storage,configurable:true});})();'''

def launch_options():
  options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM')!='1':
    exe=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    if exe: options['executable_path']=exe
  return options

def open_population(page):
  return page.evaluate('''() => { const items=[...document.querySelectorAll('[data-tab="population"]')]; const el=items.find(x=>x.offsetParent!==null)||items[0]; if(!el)return false; el.click(); return true; }''')

def run_case(browser,name,w,h,touch):
  context=browser.new_context(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch)
  page=context.new_page(); page.set_default_timeout(10000); page.add_init_script(LOCAL_STORAGE)
  errors=[]; console=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
  page.set_content(HTML,wait_until='domcontentloaded'); page.wait_for_timeout(850); page.evaluate("localStorage.setItem('diplocraft_tutorial_done_v083','1')")
  page.locator('[data-go="create"]').click(); page.wait_for_timeout(120)
  page.locator('#create').evaluate('el=>el.scrollTop=el.scrollHeight'); page.wait_for_timeout(80)
  page.locator('#startGame').click(); page.wait_for_timeout(1000)
  if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').click()
  checks={}
  checks['career_started']=page.locator('#game.active').count()==1
  checks['population_navigation_available']=bool(open_population(page)); page.wait_for_timeout(280)
  checks['population_tab_visible']=page.locator('#tab-population.active').count()==1
  checks['five_region_cards']=page.locator('#regionalPopulation .regionCard').count()==5
  checks['six_social_group_cards']=page.locator('#socialGroups .socialGroupCard').count()==6
  checks['ten_demographic_rows']=page.locator('#demographicIndicators .demographicItem').count()==10
  checks['six_policy_cards']=page.locator('#populationPolicies .populationPolicy').count()==6
  checks['overview_has_four_metrics']=page.locator('#populationOverview .populationHero > div').count()==4
  checks['weakest_region_visible']=page.locator('#populationOverview .populationAlert').count()==1
  checks['regional_needs_visible']=page.locator('#regionalPopulation .populationNeed').count()>=10
  checks['no_horizontal_overflow']=page.locator('#tab-population').evaluate('el=>el.scrollWidth<=el.clientWidth+4')
  checks['population_save_schema']=page.evaluate('''() => { window.DIPLOCRAFT_SAVE_ARCHITECTURE.save(undefined,{reason:'population-audit'}); const x=JSON.parse(window.DIPLOCRAFT_SAVE_ARCHITECTURE.exportBundle()); const p=x.save.state.population; return p?.schema===1 && p.regions?.length===5 && p.groups?.length===6; }''')
  first=page.locator('#populationPolicies button:not([disabled])').first
  checks['policy_available']=first.count()==1
  before_programs=page.locator('#populationPrograms .populationProgram').count()
  if first.count(): first.evaluate('el=>el.click()'); page.wait_for_timeout(400)
  checks['policy_creates_active_program']=page.locator('#populationPrograms .populationProgram').count()==before_programs+1
  checks['policy_enters_cooldown']=page.locator('#populationPolicies button[disabled]').count()>=1
  if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').evaluate('el=>el.click()'); page.wait_for_timeout(80)
  days_before=page.locator('#populationPrograms .populationProgram header span').first.inner_text() if page.locator('#populationPrograms .populationProgram').count() else ''
  page.locator('#advanceWeek').evaluate('el=>el.click()'); page.wait_for_timeout(350)
  open_population(page); page.wait_for_timeout(160)
  days_after=page.locator('#populationPrograms .populationProgram header span').first.inner_text() if page.locator('#populationPrograms .populationProgram').count() else ''
  checks['program_duration_advances']=bool(days_before and days_after and days_before!=days_after)
  if touch:
    heights=page.locator('#populationPolicies button').evaluate_all('els=>els.map(el=>el.getBoundingClientRect().height)')
    checks['touch_targets_at_least_48']=bool(heights) and min(heights)>=47
    page.locator('#tab-population').evaluate('el=>el.scrollIntoView()')
  else: checks['touch_targets_at_least_48']=True
  page.evaluate("() => { const el=document.getElementById('gameLocaleSelect'); el.value='en'; el.dispatchEvent(new Event('change',{bubbles:true})); }"); page.wait_for_timeout(220)
  open_population(page); page.wait_for_timeout(120)
  checks['english_population_title']='National Overview' in page.locator('#tab-population').inner_text()
  checks['no_population_key_leak']=page.evaluate("!window.DIPLOCRAFT_I18N.getMissingTranslations().some(item => item.source.includes('population.'))")
  checks['no_page_errors']=not errors
  checks['no_console_errors']=not console
  record={'case':name,'checks':checks,'errors':errors,'console_errors':console,'missing_translations':page.evaluate('window.DIPLOCRAFT_I18N.getMissingTranslations()'),'passed':all(checks.values())}
  context.close(); return record

with sync_playwright() as pw:
  browser=pw.chromium.launch(**launch_options())
  runtime=[run_case(browser,*case) for case in CASES]
  browser.close()
checks={**STATIC,'all_runtime_cases_passed':all(item['passed'] for item in runtime)}
count=len(STATIC)+sum(len(item['checks']) for item in runtime)+1
result={'project':'DIPLOCRAFT','version':CONFIG.get('version'),'phase':CONFIG.get('stage_name'),'static_checks':STATIC,'runtime':runtime,'checks':checks,'check_count':count,'passed':all(checks.values())}
(ROOT/'tests/population-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if value else 'FAIL'} {key}" for key,value in STATIC.items()]
for item in runtime: lines.append(f"{'PASS' if item['passed'] else 'FAIL'} {item['case']} ({sum(item['checks'].values())}/{len(item['checks'])})")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {count} checks")
(ROOT/'tests/population-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

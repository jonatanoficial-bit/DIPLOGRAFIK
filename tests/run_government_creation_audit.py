#!/usr/bin/env python3
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
 'phase15_preserved':CONFIG.get('stage_number',0)>=15 and CONFIG.get('government_creation',{}).get('enabled') is True,
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
  checks['party_images_have_runtime_and_fallback_paths']=page.locator('#parties img').count()==12 and page.evaluate("[...document.querySelectorAll('#parties img')].every(img=>img.src.includes('/assets/runtime/parties/') && img.dataset.fallbackSrc.includes('/assets/ui/parties/'))")
  page.locator('#systemChoices [data-setup-id="parliamentarism"]').click()
  page.locator('#leaderIdeologyChoices [data-setup-id="green_development"]').click()
  page.locator('#difficultyChoices [data-setup-id="statesman"]').click()
  page.locator('#scenarioChoices [data-setup-id="global_tension"]').click()
  page.locator('#objectiveChoices [data-setup-id="green_power"]').click()
  page.locator('#parties [data-party="PV"]').click()
  page.wait_for_timeout(80)
  checks['selected_cards_have_active_state']=page.locator('.setupChoice.active').count()==6 and page.locator('#parties .party.active').count()==1
  checks['summary_updates']=all(term in page.locator('#governmentSetupSummary').text_content() for term in ['Parlamentarismo','Estadista','Tensão global','Potência verde','PV 43'])
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

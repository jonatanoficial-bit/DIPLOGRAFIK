#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, shutil, subprocess

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
SEED=json.loads((ROOT/'tools/i18n_seed.json').read_text(encoding='utf-8'))
META=json.loads((ROOT/'meta/i18n.json').read_text(encoding='utf-8'))
HTML=(ROOT/'tests/harness.html').read_text(encoding='utf-8')
I18N=(ROOT/'src/core/i18n.js').read_text(encoding='utf-8')
GAME=(ROOT/'src/game.js').read_text(encoding='utf-8')
PWA=json.loads((ROOT/'meta/pwa.json').read_text(encoding='utf-8'))

required_keys={
 'app.newGame','create.title','nav.government','hud.role','runtime.nextEvent','tutorial.welcome',
 'language.label','language.changed','error.title','pwa.newBuild','content.jobs.title'
}
entries=SEED.get('entries',{})
locales=SEED.get('locales',[])
key_sets={loc:{k for k,v in entries.items() if isinstance(v.get(loc),str) and v.get(loc).strip()} for loc in locales}
all_keys=set(entries)
generator=subprocess.run(['python3','tools/generate_i18n.py','--check'],cwd=ROOT,capture_output=True,text=True)

static_checks={
 'three_supported_locales': locales==['pt-BR','en','es'] and CONFIG.get('supported_locales')==locales,
 'default_locale_pt_br': SEED.get('default_locale')=='pt-BR' and CONFIG.get('default_locale')=='pt-BR',
 'catalog_key_parity': all(keys==all_keys for keys in key_sets.values()),
 'catalog_has_no_blanks': all(all(isinstance(record.get(loc),str) and record[loc].strip() for loc in locales) for record in entries.values()),
 'required_core_keys_present': required_keys.issubset(all_keys),
 'catalog_scale_is_localization_complete': len(all_keys)>=900,
 'generated_catalogs_match_source': generator.returncode==0,
 'metadata_matches_seed': META.get('key_count')==len(all_keys) and META.get('supported_locales')==locales,
 'runtime_supports_hot_switch': 'setLocale' in I18N and 'diplocraft:localechange' in I18N,
 'runtime_persists_locale_separately': 'diplocraft_locale_v1' in I18N and CONFIG.get('save_key') not in 'diplocraft_locale_v1',
 'runtime_updates_html_lang': 'document.documentElement.lang = currentLocale' in I18N,
 'runtime_uses_intl_formatting': 'Intl.NumberFormat' in I18N and 'Intl.DateTimeFormat' in I18N and 'Intl.ListFormat' in I18N,
 'runtime_restores_canonical_text': 'originalTextNodes' in I18N and 'originalAttributes' in I18N,
 'lexical_fallback_removed': CONFIG.get('i18n',{}).get('legacy_fallback') is False and 'replaceLexically' not in I18N,
 'menu_and_game_selectors_exist': HTML.count('data-locale-select')>=2 and 'menuLocaleSelect' in HTML and 'gameLocaleSelect' in HTML,
 'game_installs_i18n_before_render': GAME.index('installI18n') < GAME.index('renderGame("initial-render")'),
 'save_schema_preserved': CONFIG.get('save_schema')==3 and CONFIG.get('save_key')=='diplocraft_save_v101',
 'locale_catalogs_in_pwa_precache': all(f'src/i18n/locales/{loc}.js' in PWA.get('precache',[]) for loc in locales),
 'i18n_runtime_in_pwa_precache': 'src/core/i18n.js' in PWA.get('precache',[]),
 'no_fixed_pt_number_formatting': '.toLocaleString("pt-BR")' not in ''.join(p.read_text(encoding='utf-8') for p in (ROOT/'src').rglob('*.js')),
}

EXPECTED={
 'pt-BR':{'new':'NOVO JOGO','create':'CRIAR GOVERNO','government':'Governo','role':'Presidente da República Federativa do Brasil','job':'Plano Nacional de Empregos','aria':'Abrir navegação','search':'Buscar sigla, nome ou número...','next':'Próximo evento','number':'1.234.567,8'},
 'en':{'new':'NEW GAME','create':'CREATE GOVERNMENT','government':'Government','role':'President of the Federative Republic of Brazil','job':'National Jobs Plan','aria':'Open navigation','search':'Search acronym, name or number...','next':'Next event','number':'1,234,567.8'},
 'es':{'new':'NUEVA PARTIDA','create':'CREAR GOBIERNO','government':'Gobierno','role':'Presidente de la República Federativa de Brasil','job':'Plan Nacional de Empleo','aria':'Abrir navegación','search':'Buscar sigla, nombre o número...','next':'Próximo evento','number':'1.234.567,8'},
}

LOCAL_STORAGE_POLYFILL=r'''(() => { const data=new Map(); const storage={getItem(k){k=String(k);return data.has(k)?data.get(k):null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))},clear(){data.clear()},key(i){return Array.from(data.keys())[i]??null},get length(){return data.size}};Object.defineProperty(window,'localStorage',{value:storage,configurable:true});})();'''

def launch_options():
    options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM')!='1':
        executable=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
        if executable: options['executable_path']=executable
    return options

def run_locale(browser, locale):
    exp=EXPECTED[locale]
    result={'locale':locale,'checks':{},'console_errors':[],'page_errors':[],'samples':{}}
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    page=context.new_page(); page.set_default_timeout(7000); page.add_init_script(LOCAL_STORAGE_POLYFILL)
    page.on('console',lambda msg: result['console_errors'].append(msg.text) if msg.type=='error' else None)
    page.on('pageerror',lambda err: result['page_errors'].append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded'); page.wait_for_timeout(700)
    page.locator('#menuLocaleSelect').select_option(locale); page.wait_for_timeout(180)
    result['checks']['html_lang_updated']=page.locator('html').get_attribute('lang')==locale
    result['checks']['locale_persisted']=page.evaluate("localStorage.getItem('diplocraft_locale_v1')")==locale
    result['checks']['selectors_synchronized']=page.locator('#menuLocaleSelect').input_value()==locale and page.locator('#gameLocaleSelect').input_value()==locale
    result['checks']['menu_translated']=page.locator('[data-go="create"]').inner_text().strip()==exp['new']
    result['checks']['aria_translated']=page.locator('#mobileMenuBtn').get_attribute('aria-label')==exp['aria']
    result['checks']['number_format_uses_locale']=page.evaluate('window.DIPLOCRAFT_I18N.formatNumber(1234567.8)')==exp['number']
    page.locator('[data-go="create"]').click(); page.wait_for_timeout(100)
    result['checks']['create_screen_translated']=page.locator('#create h2').inner_text().strip()==exp['create']
    result['checks']['placeholder_translated']=page.locator('#partySearch').get_attribute('placeholder')==exp['search']
    page.locator('#startGame').click(); page.wait_for_selector('#tutorialOverlay.open', timeout=2400)
    result['checks']['game_started']=page.locator('#game.active').count()==1
    result['checks']['hud_role_translated']=page.locator('#hudRole').inner_text().strip()==exp['role']
    result['checks']['navigation_translated']=(page.locator('#mobileDrawer [data-tab="government"] .navLabel').text_content() or '').strip()==exp['government']
    result['checks']['dynamic_card_translated']=page.locator('#decisionDeck h4').first.inner_text().strip()==exp['job']
    result['checks']['dynamic_template_translated']=exp['next'] in page.locator('#nextEvent').inner_text()
    if page.locator('#tutorialOverlay.open').count():
        tutorial_title=page.locator('#tutorialTitle').inner_text().strip()
        result['checks']['tutorial_translated']=tutorial_title==SEED['entries']['tutorial.welcome'][locale]
        page.locator('#tutorialSkip').click()
    else:
        result['checks']['tutorial_translated']=False
    # Hot switch during an active game must preserve state and synchronize selectors.
    leader_before=page.locator('#hudName').inner_text(); date_before=page.locator('#dateHud').inner_text()
    target='es' if locale!='es' else 'en'
    page.evaluate("locale => { const el=document.getElementById('gameLocaleSelect'); el.value=locale; el.dispatchEvent(new Event('change',{bubbles:true})); }", target); page.wait_for_timeout(180)
    result['checks']['hot_switch_keeps_state']=page.locator('#hudName').inner_text()==leader_before and page.locator('#dateHud').inner_text()==date_before
    result['checks']['hot_switch_syncs_selectors']=page.locator('#menuLocaleSelect').input_value()==target and page.locator('#gameLocaleSelect').input_value()==target
    result['checks']['hot_switch_updates_navigation']=(page.locator('#mobileDrawer [data-tab="government"] .navLabel').text_content() or '').strip()==EXPECTED[target]['government']
    result['samples']={'menu':exp['new'],'role':exp['role'],'card':exp['job'],'after_switch':target}
    result['passed']=all(result['checks'].values()) and not result['console_errors'] and not result['page_errors']
    context.close(); return result

with sync_playwright() as p:
    browser=p.chromium.launch(**launch_options())
    runtime=[run_locale(browser,loc) for loc in locales]
    browser.close()

checks={**static_checks,
 'all_runtime_locales_passed':all(x['passed'] for x in runtime),
 'runtime_has_no_console_errors':all(not x['console_errors'] for x in runtime),
 'runtime_has_no_page_errors':all(not x['page_errors'] for x in runtime),
}
result={'project':'DIPLOCRAFT','version':CONFIG['version'],'phase':CONFIG['stage_name'],'locales':locales,'catalog_key_count':len(all_keys),'static_checks':static_checks,'runtime':runtime,'checks':checks,'check_count':len(static_checks)+sum(len(x['checks']) for x in runtime)+3,'passed':all(checks.values())}
(ROOT/'tests/i18n-audit-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in static_checks.items()]
for item in runtime: lines.append(f"{'PASS' if item['passed'] else 'FAIL'} locale {item['locale']} ({sum(item['checks'].values())}/{len(item['checks'])})")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {result['check_count']} checks")
(ROOT/'tests/i18n-audit-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

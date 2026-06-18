#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, shutil, time

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
HTML = (ROOT/'tests/harness.html').read_text(encoding='utf-8')
CSS = (ROOT/'src/styles.css').read_text(encoding='utf-8')
STORAGE = (ROOT/'src/core/storage.js').read_text(encoding='utf-8')
MANAGER = (ROOT/'src/core/saveManager.js').read_text(encoding='utf-8')
INDEX = (ROOT/'index.html').read_text(encoding='utf-8')

CASES = [
    ('mobile_320x568', 320, 568, True, True),
    ('mobile_390x844', 390, 844, True, True),
    ('tablet_768x1024', 768, 1024, True, True),
    ('desktop_1366x768', 1366, 768, False, False),
]

LOCAL_STORAGE_POLYFILL = r'''(() => {
  const data = new Map();
  const storage = {getItem(k){k=String(k);return data.has(k)?data.get(k):null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))},clear(){data.clear()},key(i){return Array.from(data.keys())[i]??null},get length(){return data.size}};
  Object.defineProperty(window,'localStorage',{value:storage,configurable:true});
})();'''

def launch_options():
    options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM') != '1':
        executable=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
        if executable: options['executable_path']=executable
    return options

def trusted_swipe(page, context, x, start_y, end_y, steps=9):
    session=context.new_cdp_session(page)
    session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':x,'y':start_y,'radiusX':4,'radiusY':4,'force':1}]})
    for i in range(1,steps+1):
        y=start_y+(end_y-start_y)*(i/steps)
        session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':x,'y':y,'radiusX':4,'radiusY':4,'force':1}]})
        time.sleep(.016)
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    page.wait_for_timeout(180)
    session.detach()

def in_view(page, selector):
    return page.locator(selector).evaluate('el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}')

def run_case(browser, name, width, height, is_mobile, has_touch):
    result={'name':name,'viewport':{'width':width,'height':height},'checks':{},'measurements':{},'console_errors':[],'page_errors':[]}
    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=is_mobile,has_touch=has_touch,accept_downloads=True)
    page=context.new_page(); page.set_default_timeout(8000); page.add_init_script(LOCAL_STORAGE_POLYFILL)
    page.on('console',lambda msg: result['console_errors'].append(msg.text) if msg.type=='error' else None)
    page.on('pageerror',lambda err: result['page_errors'].append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded'); page.wait_for_timeout(950)

    result['checks']['save_api_installed']=page.evaluate("typeof window.DIPLOCRAFT_SAVE_ARCHITECTURE?.registry === 'function'")
    page.locator('#menu').evaluate('el=>el.scrollTop=el.scrollHeight')
    page.wait_for_timeout(100)
    result['checks']['menu_manager_button_reachable']=in_view(page,'#saveManagerMenuBtn')
    page.locator('#saveManagerMenuBtn').click(); page.wait_for_timeout(180)
    result['checks']['manager_opens_from_menu']=page.locator('#saveManagerOverlay.open').count()==1 and page.locator('body.save-manager-open').count()==1
    result['checks']['dialog_accessibility_contract']=page.locator('#saveManagerOverlay').get_attribute('role')=='dialog' and page.locator('#saveManagerOverlay').get_attribute('aria-modal')=='true'
    result['checks']['default_profile_count_one']=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.registry().profiles.length===1')
    result['checks']['three_slots_per_profile']=page.locator('.saveSlotCard').count()==3 and page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.registry().profiles[0].slots.length===3')
    result['checks']['active_slot_visible']=page.locator('.saveSlotCard.active').count()==1
    result['checks']['manager_no_horizontal_overflow']=page.locator('.saveManagerCard').evaluate('el=>el.scrollWidth<=el.clientWidth+2')
    metrics=page.locator('.saveManagerCard').evaluate('el=>({top:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflow:getComputedStyle(el).overflowY,touchAction:getComputedStyle(el).touchAction})')
    result['measurements']['manager_initial']=metrics
    result['checks']['manager_is_independent_scroll_owner']=metrics['overflow']=='auto' and metrics['scrollHeight']>=metrics['clientHeight']
    result['checks']['manager_touch_action_pan_y']='pan-y' in metrics['touchAction']

    before=page.locator('.saveManagerCard').evaluate('el=>el.scrollTop')
    if has_touch:
        trusted_swipe(page,context,width*.55,height*.78,max(35,height*.22))
    else:
        page.mouse.move(width*.6,height*.6); page.mouse.wheel(0,620); page.wait_for_timeout(180)
    after=page.locator('.saveManagerCard').evaluate('el=>el.scrollTop')
    result['measurements']['manager_scroll']={'before':before,'after':after}
    result['checks']['manager_scrolls_with_primary_input']=after>before+10 if metrics['scrollHeight']>metrics['clientHeight']+10 else True
    if has_touch:
        heights=page.locator('.saveManagerCard button:visible').evaluate_all('els=>els.map(el=>el.getBoundingClientRect().height)')
        result['measurements']['touch_target_heights']=heights
        result['checks']['mobile_touch_targets_at_least_48']=bool(heights) and min(heights)>=47.5
    else:
        result['checks']['mobile_touch_targets_at_least_48']=True
    page.locator('#saveManagerClose').click(); page.wait_for_timeout(90)
    result['checks']['manager_closes_cleanly']=page.locator('#saveManagerOverlay.open').count()==0 and page.locator('body.save-manager-open').count()==0

    # Start a real career so that all slot operations use a valid game state.
    page.locator('[data-go="create"]').click(); page.wait_for_timeout(120)
    page.locator('#leaderName').fill('Carreira Auditoria')
    page.locator('#create').evaluate('el=>el.scrollTop=el.scrollHeight'); page.wait_for_timeout(80)
    page.locator('#startGame').click(); page.wait_for_timeout(1200)
    if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').click()
    result['checks']['career_started']=page.locator('#game.active').count()==1

    # API operations mirror the same storage functions used by the UI.
    result['checks']['slot_one_saved']=page.evaluate('''() => { const api=window.DIPLOCRAFT_SAVE_ARCHITECTURE; const a=api.active(); return api.save(undefined,{profileId:a.profileId,slotId:a.slotId,reason:"phase13-audit"}); }''')
    bundle=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.exportBundle()')
    result['checks']['export_bundle_has_checksum']=page.evaluate('text=>{const x=JSON.parse(text);return Boolean(x.format==="diplocraft-career-export"&&x.schema===1&&typeof x.checksum==="string"&&x.save?.state?.leader)}',bundle)
    result['checks']['manual_backup_created']=page.evaluate('''() => Boolean(window.DIPLOCRAFT_SAVE_ARCHITECTURE.createBackup("Auditoria manual"))''')
    result['checks']['manual_backup_listed']=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.backups().length===1')

    active=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.active()')
    profile_id=active['profileId']
    slot2=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.registry().profiles[0].slots[1].id')
    slot3=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.registry().profiles[0].slots[2].id')
    result['checks']['second_slot_can_be_selected_and_saved']=page.evaluate('''([p,s])=>{const api=window.DIPLOCRAFT_SAVE_ARCHITECTURE;api.select(p,s);return api.save(undefined,{profileId:p,slotId:s,reason:"audit-slot-2"});}''',[profile_id,slot2])
    result['checks']['slots_are_isolated']=page.evaluate('''() => {const r=window.DIPLOCRAFT_SAVE_ARCHITECTURE.registry();return r.profiles[0].slots[0].hasSave&&r.profiles[0].slots[1].hasSave&&!r.profiles[0].slots[2].hasSave;}''')
    result['checks']['export_import_to_third_slot']=page.evaluate('''([text,p,s])=>{const api=window.DIPLOCRAFT_SAVE_ARCHITECTURE;const state=api.importBundle(text,{profileId:p,slotId:s,overwrite:true});return Boolean(state?.leader&&api.registry().profiles[0].slots[2].hasSave);}''',[bundle,profile_id,slot3])
    result['checks']['tampered_export_is_rejected']=page.evaluate('''text=>{const api=window.DIPLOCRAFT_SAVE_ARCHITECTURE;const x=JSON.parse(text);x.save.state.leader="ADULTERADO";try{api.importBundle(JSON.stringify(x),{overwrite:true});return false}catch(e){return true}}''',bundle)
    result['checks']['second_profile_can_be_created']=page.evaluate('''() => {const api=window.DIPLOCRAFT_SAVE_ARCHITECTURE;api.createProfile("Perfil 2");return api.registry().profiles.length===2;}''')
    result['checks']['profile_has_exactly_three_slots']=page.evaluate('''() => window.DIPLOCRAFT_SAVE_ARCHITECTURE.registry().profiles.every(p=>p.slots.length===3)''')
    result['checks']['history_records_operations']=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.history(60).length>=6')
    result['checks']['diagnostics_report_schema_three']=page.evaluate('''() => {const d=window.DIPLOCRAFT_SAVE_ARCHITECTURE.diagnostics();return d.saveSchema===3&&d.profileCount===2&&d.occupiedSlots>=3;}''')

    # Return to first career, verify manager renders runtime data and hot-switches language.
    page.evaluate('''([p,s])=>window.DIPLOCRAFT_SAVE_ARCHITECTURE.select(p,s)''',[profile_id,active['slotId']])
    page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.open()'); page.wait_for_timeout(180)
    result['checks']['ui_reflects_two_profiles']=page.locator('#saveProfileSelect option').count()==2
    result['checks']['ui_reflects_three_occupied_slots']=page.locator('.saveSlotCard.occupied').count()==3
    result['checks']['ui_lists_manual_backup']=page.locator('.saveBackupItem').count()>=1
    result['checks']['ui_lists_history']=page.locator('.saveHistoryItem').count()>=1
    title_pt=page.locator('#saveManagerTitle').inner_text()
    page.evaluate("window.DIPLOCRAFT_I18N.setLocale('en',{source:'save-audit'})"); page.wait_for_timeout(160)
    title_en=page.locator('#saveManagerTitle').inner_text()
    result['checks']['manager_hot_switches_language']=title_en!=title_pt and 'Profiles' in title_en
    result['checks']['locale_switch_preserves_registry']=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.registry().profiles.length===2')
    result['checks']['manager_still_no_horizontal_overflow_after_translation']=page.locator('.saveManagerCard').evaluate('el=>el.scrollWidth<=el.clientWidth+2')

    # Clear only slot two and make sure the other slots survive.
    result['checks']['clearing_one_slot_preserves_others']=page.evaluate('''([p,s])=>{const api=window.DIPLOCRAFT_SAVE_ARCHITECTURE;api.clear({profileId:p,slotId:s});const slots=api.registry().profiles.find(x=>x.id===p).slots;return slots[0].hasSave&&!slots[1].hasSave&&slots[2].hasSave;}''',[profile_id,slot2])
    result['checks']['registry_checksum_envelope_present']=page.evaluate('''() => {const x=JSON.parse(localStorage.getItem("diplocraft_save_registry_v1"));return x.format==="diplocraft-save-registry"&&x.schema===1&&typeof x.checksum==="string";}''')
    result['checks']['scoped_keys_are_used']=page.evaluate('''() => Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).some(k=>k&&k.startsWith("diplocraft_save_v101__profile-")&&k.includes("__slot-"))''')
    result['checks']['no_console_errors']=not result['console_errors']
    result['checks']['no_page_errors']=not result['page_errors']
    result['passed']=all(result['checks'].values())
    context.close()
    return result

static_checks={
    'phase_declares_save_architecture':CONFIG.get('stage_number',0)>=13 and CONFIG.get('save_architecture',{}).get('enabled') is True,
    'save_schema_is_three':CONFIG.get('save_schema')==3 and 'BUILD.saveSchema' in STORAGE,
    'four_profile_limit_declared':'MAX_PROFILES = 4' in STORAGE,
    'three_slots_declared':'SLOTS_PER_PROFILE = 3' in STORAGE,
    'transactional_scoped_storage':'slotKeys' in STORAGE and '_pending' in STORAGE and 'checksum' in STORAGE,
    'legacy_migration_present':'migrateLegacyStorage' in STORAGE and 'schema2_rollback_backup' in STORAGE,
    'manual_backup_api_present':all(token in STORAGE for token in ['createManualBackup','restoreManualBackup','deleteManualBackup']),
    'export_import_api_present':'exportCareerBundle' in STORAGE and 'importCareerBundle' in STORAGE,
    'history_and_diagnostics_present':'getCareerHistory' in STORAGE and 'getStorageDiagnostics' in STORAGE,
    'save_manager_module_loaded':'installSaveManager' in (ROOT/'src/game.js').read_text(encoding='utf-8'),
    'manager_modal_exists':all(token in INDEX for token in ['saveManagerOverlay','saveProfileSelect','saveSlots','saveBackups','saveHistory','importCareerInput']),
    'manager_mobile_fullscreen_css':'height:100dvh' in CSS and '.saveSlots{grid-template-columns:1fr}' in CSS,
    'manager_touch_scroll_css':'touch-action:pan-y pinch-zoom' in CSS and '-webkit-overflow-scrolling:touch' in CSS,
    'manager_safe_area_css':'env(safe-area-inset-bottom)' in CSS and 'env(safe-area-inset-top)' in CSS,
    'manager_public_diagnostic_api':'DIPLOCRAFT_SAVE_ARCHITECTURE' in MANAGER,
    'save_i18n_keys_present':all(f'"{key}"' in (ROOT/'tools/i18n_seed.json').read_text(encoding='utf-8') for key in ['save.managerTitle','save.careerSlots','save.importCareer','save.localOnly']),
}

case_filter=os.getenv('DIPLOCRAFT_SAVE_CASE')
cases=[case for case in CASES if not case_filter or case[0]==case_filter]
with sync_playwright() as p:
    browser=p.chromium.launch(**launch_options())
    results=[]
    for case in cases:
        print(f'RUN {case[0]}',flush=True)
        results.append(run_case(browser,*case))
        print(f'DONE {case[0]} passed={results[-1]["passed"]}',flush=True)
    browser.close()

report={'project':CONFIG['project'],'version':CONFIG['version'],'phase':CONFIG['stage_name'],'static_checks':static_checks,'cases':results,'case_count':len(results),'check_count':len(static_checks)+sum(len(x['checks']) for x in results),'passed':all(static_checks.values()) and all(x['passed'] for x in results)}
name=f'save-architecture-results-{case_filter}.json' if case_filter else 'save-architecture-results.json'
(ROOT/'tests'/name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"STATIC {'PASS' if all(static_checks.values()) else 'FAIL'} {sum(static_checks.values())}/{len(static_checks)}"]
lines += [f"{'PASS' if x['passed'] else 'FAIL'} {x['name']} {sum(x['checks'].values())}/{len(x['checks'])}" for x in results]
lines.append(f"OVERALL {'PASS' if report['passed'] else 'FAIL'} {report['check_count']} checks")
out=f'save-architecture-output-{case_filter}.txt' if case_filter else 'save-architecture-output.txt'
(ROOT/'tests'/out).write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if report['passed'] else 1)

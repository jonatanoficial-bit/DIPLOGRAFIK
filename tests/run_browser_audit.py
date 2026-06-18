from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import os
import shutil

CONFIG = json.loads(Path('build.config.json').read_text(encoding='utf-8'))
EXPECTED_VERSION = CONFIG['version']
EXPECTED_STATUS = CONFIG['status']
EXPECTED_BUILD = json.loads(Path('tests/expected-build.json').read_text(encoding='utf-8'))

HTML = Path('tests/harness.html').read_text(encoding='utf-8')
LOCAL_STORAGE_POLYFILL = r'''
(() => {
  const data = new Map();
  const storage = {
    getItem(key) { key = String(key); return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(String(key)); },
    clear() { data.clear(); },
    key(index) { return Array.from(data.keys())[index] ?? null; },
    get length() { return data.size; }
  };
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
})();
'''

def visible_in_viewport(page, selector):
    return page.eval_on_selector(selector, '''el => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    }''')

def run_case(browser, name, width, height, mobile):
    record = {
        'name': name,
        'viewport': {'width': width, 'height': height, 'mobile': mobile},
        'checks': {},
        'measurements': {},
        'console_errors': [],
        'page_errors': []
    }
    context = browser.new_context(viewport={'width': width, 'height': height}, is_mobile=mobile, has_touch=mobile)
    page = context.new_page()
    page.set_default_timeout(5000)
    page.add_init_script(LOCAL_STORAGE_POLYFILL)
    page.on('console', lambda msg: record['console_errors'].append(msg.text) if msg.type == 'error' and 'Save corrompido isolado' not in msg.text and 'auditoria controlada' not in msg.text and 'falha repetida' not in msg.text else None)
    page.on('pageerror', lambda err: record['page_errors'].append(str(err)))
    page.set_content(HTML, wait_until='domcontentloaded')
    page.wait_for_timeout(700)

    record['checks']['boot_without_error'] = not record['page_errors']
    record['checks']['menu_visible'] = page.locator('#menu.active').count() == 1
    record['checks']['canonical_build_visible'] = f'v{EXPECTED_VERSION}' in page.locator('#menuBuild').inner_text()
    record['checks']['support_layers_exist'] = all(page.locator(sel).count() == 1 for sel in ['#toastLayer','#fxLayer','#audioPanel','#tutorialOverlay','#errorOverlay','#safeModeBanner','#resilienceHealth'])
    record['checks']['document_title_generated'] = page.title() == f'DIPLOCRAFT v{EXPECTED_VERSION}'
    record['checks']['menu_background_uses_runtime_catalog'] = 'assets/runtime/backgrounds/' in page.locator('.bg-menu').get_attribute('style') and page.locator('.bg-menu').get_attribute('data-asset-key') == 'bg_global_map_v1'

    menu_metrics = page.evaluate('''() => { const el=document.getElementById('menu'); return {clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,overflowY:getComputedStyle(el).overflowY}; }''')
    record['measurements']['menu'] = menu_metrics
    page.locator('#menu').evaluate('(el) => el.scrollTop = el.scrollHeight')
    page.wait_for_timeout(140)
    record['checks']['menu_can_reach_last_button'] = visible_in_viewport(page, '#rcInfoBtn')

    page.locator('[data-go="create"]').click()
    page.wait_for_timeout(120)
    record['checks']['create_screen_opens'] = page.locator('#create.active').count() == 1
    record['checks']['avatars_use_optimized_thumbnails'] = all('assets/runtime/characters/' in (page.locator('#avatars img').nth(i).get_attribute('src') or '') and (page.locator('#avatars img').nth(i).get_attribute('src') or '').endswith('--thumb.webp') for i in range(page.locator('#avatars img').count()))
    record['checks']['offscreen_avatars_are_lazy'] = sum(page.locator('#avatars img').nth(i).get_attribute('loading') == 'lazy' for i in range(page.locator('#avatars img').count())) >= 3
    create_metrics = page.evaluate('''() => { const el=document.getElementById('create'); return {clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,overflowY:getComputedStyle(el).overflowY}; }''')
    record['measurements']['create'] = create_metrics
    
    page.locator('#create').evaluate('(el) => { el.style.scrollBehavior="auto"; el.scrollTop=el.scrollHeight; }')
    page.wait_for_timeout(80)
    record['checks']['create_scroll_enabled'] = create_metrics['overflowY'] == 'auto' and create_metrics['scrollHeight'] > create_metrics['clientHeight']
    record['checks']['start_button_reachable'] = visible_in_viewport(page, '#startGame')

    page.locator('#startGame').click()
    page.wait_for_timeout(1300)
    record['checks']['game_starts'] = page.locator('#game.active').count() == 1
    record['checks']['tutorial_auto_opens'] = page.locator('#tutorialOverlay.open').count() == 1
    if page.locator('#tutorialOverlay.open').count():
        page.locator('#tutorialSkip').click()

    tab_ids = ['dashboard','government','economy','diplomacy','military','intelligence','projects','press','elections','crisis','progression','store','release']
    tab_results = []
    for tab_id in tab_ids:
        page.evaluate("tab => document.querySelector('[data-tab=\"' + tab + '\"]').click()", tab_id)
        tab_results.append(page.locator(f'#tab-{tab_id}.active').count() == 1)
    record['checks']['all_tabs_navigate'] = all(tab_results)
    record['checks']['tab_background_uses_runtime_catalog'] = page.locator('#gameBg').get_attribute('data-asset-key') == 'bg_global_map_v1' and 'assets/runtime/backgrounds/' in (page.locator('#gameBg').get_attribute('style') or '')
    release_text = page.locator('#tab-release').inner_text()
    record['checks']['release_identity_matches'] = f'v{EXPECTED_VERSION}' in release_text and EXPECTED_STATUS in release_text
    record['checks']['release_artifact_visible'] = EXPECTED_BUILD['artifact'] in release_text
    record['checks']['release_source_hash_visible'] = EXPECTED_BUILD['source_sha256'] in release_text
    page.evaluate("document.querySelector('[data-tab=\"dashboard\"]').click()")
    before_date = page.locator('#dateHud').inner_text()
    page.evaluate("document.getElementById('advanceDay').click()")
    page.wait_for_timeout(80)
    record['checks']['advance_day_changes_date'] = page.locator('#dateHud').inner_text() != before_date

    page.locator('#saveGame').click()
    page.wait_for_timeout(80)
    record['checks']['save_created'] = page.evaluate("""() => { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; const key='diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId; return localStorage.getItem(key)!==null; }""")
    record['checks']['save_envelope_schema3'] = page.evaluate("""() => { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; const key='diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId; const x=JSON.parse(localStorage.getItem(key)); return Boolean(x.format==='diplocraft-save-envelope' && x.schema===3 && typeof x.checksum==='string' && x.state?.leader && x.career?.slotId); }""")
    record['checks']['snapshot_rotation_active'] = page.evaluate("""() => { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; const prefix='diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId+'_snapshot_'; return Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).filter(k=>k&&k.startsWith(prefix)).length >= 1; }""")
    health_before = page.evaluate("window.DIPLOCRAFT_RESILIENCE.getStatus()")
    record['checks']['watchdog_installed'] = health_before['installed'] and health_before['heartbeatAgeMs'] < 5000
    record['checks']['health_panel_rendered'] = 'Watchdog' in page.locator('#resilienceHealth').inner_text()
    record['checks']['diagnostics_api_available'] = page.evaluate("typeof window.DIPLOCRAFT_RESILIENCE.exportDiagnostics === 'function'")

    # Simulate interruption after writing the pending transaction but before promoting it.
    page.evaluate("""() => { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; const key='diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId; const raw=localStorage.getItem(key); localStorage.setItem(key+'_pending', raw); localStorage.removeItem(key); document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById('menu').classList.add('active'); }""")
    page.locator('#continueBtn').click()
    page.wait_for_timeout(120)
    record['checks']['pending_transaction_recovered'] = page.evaluate("""() => { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; const key='diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId; return localStorage.getItem(key)!==null && localStorage.getItem(key+'_pending')===null; }""")
    record['checks']['transaction_recovery_keeps_game_playable'] = page.locator('#game.active').count() == 1

    # Corrupt current save and use Continue: it must quarantine and restore a valid snapshot.
    page.evaluate("""() => { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; const key='diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId; localStorage.setItem(key, '{bad json'); }""")
    page.evaluate("document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('menu').classList.add('active')")
    page.locator('#continueBtn').click()
    page.wait_for_timeout(160)
    record['checks']['corrupt_save_quarantined'] = page.evaluate("Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).some(k=>k && k.startsWith('diplocraft_corrupt_backup_'))")
    record['checks']['snapshot_auto_restored'] = page.evaluate("""() => { try { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; const key='diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId; const x=JSON.parse(localStorage.getItem(key)); return Boolean(x.format==='diplocraft-save-envelope' && x.state?.leader); } catch(e){ return false; } }""")
    record['checks']['storage_warning_visible'] = page.locator('#toastLayer .toast.warning').count() >= 1
    record['checks']['game_continues_after_recovery'] = page.locator('#game.active').count() == 1

    # Tutorial manual path.
    page.evaluate("document.getElementById('tutorialBtn').click()")
    page.wait_for_timeout(100)
    record['checks']['tutorial_manual_opens'] = page.locator('#tutorialOverlay.open').count() == 1
    if page.locator('#tutorialOverlay.open').count():
        page.locator('#tutorialClose').click()

    # Audio path: first click enables, second opens controls.
    page.evaluate("document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('menu').classList.add('active')")
    page.evaluate("document.getElementById('audioToggle').click()")
    page.wait_for_timeout(80)
    page.evaluate("document.getElementById('audioToggle').click()")
    page.wait_for_timeout(50)
    record['checks']['audio_controls_open'] = page.locator('#audioPanel.open').count() == 1

    # Deliberately trigger the boundary, confirm incident/snapshot, then restore.
    page.evaluate("window.dispatchEvent(new ErrorEvent('error',{message:'auditoria controlada'}))")
    page.wait_for_timeout(80)
    record['checks']['error_boundary_opens'] = page.locator('#errorOverlay.open').count() == 1 and 'auditoria controlada' in page.locator('#errorText').inner_text()
    record['checks']['incident_id_visible'] = page.locator('#errorIncident').inner_text().startswith('Incidente INC-')
    record['checks']['emergency_snapshot_created'] = page.evaluate("""() => { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; return localStorage.getItem('diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId+'_emergency')!==null; }""")
    page.locator('#restoreSnapshot').click()
    page.wait_for_timeout(100)
    record['checks']['error_boundary_recovers_to_menu'] = page.locator('#menu.active').count() == 1 and page.locator('#errorOverlay.open').count() == 0
    record['checks']['manual_snapshot_restore_recorded'] = page.evaluate("window.DIPLOCRAFT_RESILIENCE.getStatus().recoveryCount >= 1")

    # Three fatal incidents inside five minutes must enable safe mode.
    page.evaluate("""() => { for(let i=0;i<3;i++) window.dispatchEvent(new ErrorEvent('error',{message:'falha repetida '+i})); }""")
    page.wait_for_timeout(100)
    record['checks']['safe_mode_after_repeated_failures'] = page.locator('body.safe-mode').count() == 1 and page.evaluate("window.DIPLOCRAFT_RESILIENCE.getStatus().safeMode")
    page.locator('#returnToMenu').click()

    # Drawer only on mobile; on desktop this check is not applicable and counts as passed.
    if mobile:
        page.evaluate("document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('game').classList.add('active')")
        page.locator('#mobileMenuBtn').click()
        record['checks']['mobile_drawer_opens'] = page.locator('body.nav-open').count() == 1
        page.locator('#mobileOverlay').click(position={'x': width-5, 'y': height//2})
        record['checks']['mobile_drawer_closes'] = page.locator('body.nav-open').count() == 0
    else:
        record['checks']['mobile_drawer_opens'] = True
        record['checks']['mobile_drawer_closes'] = True

    record['passed'] = all(record['checks'].values()) and not record['page_errors'] and not record['console_errors']
    context.close()
    return record

with sync_playwright() as p:
    launch_options = {'headless': True, 'args': ['--no-sandbox','--disable-dev-shm-usage']}
    if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM') != '1':
        executable = os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
        if executable:
            launch_options['executable_path'] = executable
    browser = p.chromium.launch(**launch_options)
    cases = [
        ('mobile_360x640', 360, 640, True),
        ('mobile_390x844', 390, 844, True),
        ('tablet_768x1024', 768, 1024, True),
        ('desktop_1366x768', 1366, 768, False),
    ]
    case_filter = os.getenv('DIPLOCRAFT_BROWSER_CASE')
    if case_filter:
        cases = [case for case in cases if case[0] == case_filter]
    results = []
    for case in cases:
        print(f'RUN {case[0]}', flush=True)
        results.append(run_case(browser, *case))
        print(f'DONE {case[0]} passed={results[-1]["passed"]}', flush=True)
    browser.close()

output_name = f'tests/browser-results-{case_filter}.json' if case_filter else 'tests/browser-results.json'
Path(output_name).write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(results, ensure_ascii=False, indent=2))
if not all(item['passed'] for item in results):
    raise SystemExit(1)

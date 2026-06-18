from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import os
import shutil

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
HTML = (ROOT/'tests/harness.html').read_text(encoding='utf-8')
CSS = (ROOT/'src/styles.css').read_text(encoding='utf-8')
DESKTOP_JS = (ROOT/'src/core/desktop.js').read_text(encoding='utf-8')
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

CASES = [
    ('tablet_landscape_1024x768', 1024, 768),
    ('laptop_1366x768', 1366, 768),
    ('desktop_fullhd_1920x1080', 1920, 1080),
    ('desktop_ultrawide_2560x1080', 2560, 1080),
]

def launch_options():
    options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM') != '1':
        executable=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
        if executable: options['executable_path']=executable
    return options

def rect(page, selector):
    return page.locator(selector).evaluate('''el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}''')

def run_case(browser, name, width, height):
    result={'name':name,'viewport':{'width':width,'height':height},'checks':{},'measurements':{},'console_errors':[],'page_errors':[]}
    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=False,has_touch=False)
    page=context.new_page(); page.set_default_timeout(6000); page.add_init_script(LOCAL_STORAGE_POLYFILL)
    page.on('console',lambda msg: result['console_errors'].append(msg.text) if msg.type=='error' else None)
    page.on('pageerror',lambda err: result['page_errors'].append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded'); page.wait_for_timeout(900)

    status=page.evaluate('window.DIPLOCRAFT_DESKTOP?.getStatus()')
    result['checks']['desktop_runtime_installed']=bool(status and status.get('installed'))
    result['checks']['desktop_breakpoint_detected']=bool(status and status.get('desktop'))
    result['checks']['mobile_chrome_hidden']=page.locator('.mobileTopBar').evaluate('el=>getComputedStyle(el).display')=='none' and page.locator('.bottomNav').evaluate('el=>getComputedStyle(el).display')=='none'
    result['checks']['menu_no_horizontal_overflow']=page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')

    page.locator('[data-go="create"]').click(); page.wait_for_timeout(100)
    page.locator('#startGame').click(); page.wait_for_timeout(1250)
    if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').click()

    side=rect(page,'#mobileDrawer'); shell=rect(page,'#gameScroll'); bar=rect(page,'.desktopCommandBar')
    result['measurements']['side']=side; result['measurements']['shell']=shell; result['measurements']['command_bar']=bar
    result['checks']['desktop_sidebar_visible']=page.locator('#mobileDrawer').evaluate('el=>getComputedStyle(el).display')!='none' and page.locator('#mobileDrawer').get_attribute('aria-hidden')=='false'
    result['checks']['shell_tracks_sidebar']=abs(shell['left']-side['right'])<=2 and abs((shell['width']+side['width'])-width)<=3
    result['checks']['command_bar_visible_sticky']=bar['height']>=48 and page.locator('.desktopCommandBar').evaluate('el=>getComputedStyle(el).position')=='sticky'
    result['checks']['no_game_horizontal_overflow']=page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1 && document.getElementById("gameScroll").scrollWidth <= document.getElementById("gameScroll").clientWidth + 2')
    result['checks']['all_navigation_items_present']=page.locator('#mobileDrawer [data-tab]').count()==14

    # Sidebar responsiveness: automatic rail on tablet, toggle/persistence on larger screens.
    if width <= 1199:
        result['checks']['tablet_uses_compact_rail']=side['width']<=90 and page.locator('body.desktop-nav-compact').count()==1
        result['checks']['sidebar_toggle_persists']=True
    else:
        result['checks']['tablet_uses_compact_rail']=side['width']>=230
        before=side['width']; page.locator('#desktopNavToggle').click()
        try:
            page.wait_for_function('document.getElementById("mobileDrawer").getBoundingClientRect().width < 120', timeout=1800)
        except Exception:
            page.wait_for_timeout(500)
        after=rect(page,'#mobileDrawer')['width']
        stored=page.evaluate("localStorage.getItem('diplocraft_desktop_nav_compact')")
        result['measurements']['sidebar_toggle']={'before':before,'after':after,'stored':stored}
        result['checks']['sidebar_toggle_persists']=before-after>=130 and stored=='true' and page.locator('body.desktop-nav-compact').count()==1
        page.locator('#desktopNavToggle').click(); page.wait_for_timeout(500)

    # Density mode is explicit and persistent.
    page.locator('#desktopDensityBtn').click(); page.wait_for_timeout(80)
    density_status=page.evaluate('window.DIPLOCRAFT_DESKTOP.getStatus()')
    result['checks']['density_mode_persists']=density_status.get('density')=='compact' and page.evaluate("localStorage.getItem('diplocraft_desktop_density')")=='compact' and page.locator('body.desktop-density-compact').count()==1
    page.locator('#desktopDensityBtn').click(); page.wait_for_timeout(50)

    # Command palette with search and keyboard execution.
    page.keyboard.press('Control+K'); page.wait_for_timeout(80)
    result['checks']['command_palette_opens']=page.locator('#commandPalette.open').count()==1 and page.evaluate('document.activeElement?.id === "commandSearch"')
    page.locator('#commandSearch').fill('economia'); page.wait_for_timeout(60)
    result['checks']['command_search_filters']=page.locator('#commandResults .commandResult').count()>=1 and 'Economia' in page.locator('#commandResults .commandResult').first.inner_text()
    page.keyboard.press('Enter'); page.wait_for_timeout(100)
    result['checks']['command_executes_navigation']=page.locator('#tab-economy.active').count()==1 and page.locator('#commandPalette.open').count()==0 and page.locator('#desktopSection').inner_text().strip()=='Economia'

    # Keyboard shortcuts must navigate and execute without using the mouse.
    page.keyboard.press('Alt+2'); page.wait_for_timeout(70)
    result['checks']['alt_number_shortcut']=page.locator('#tab-government.active').count()==1
    page.keyboard.press('Alt+1'); page.wait_for_timeout(70)
    before_date=page.locator('#dateHud').inner_text(); page.keyboard.press('Alt+D'); page.wait_for_timeout(80)
    result['checks']['alt_day_shortcut']=page.locator('#dateHud').inner_text()!=before_date
    page.keyboard.press('Alt+S'); page.wait_for_timeout(80)
    result['checks']['alt_save_shortcut']=page.evaluate("() => { const r=JSON.parse(localStorage.getItem('diplocraft_save_registry_v1')); const d=r.data; return localStorage.getItem('diplocraft_save_v101__'+d.activeProfileId+'__'+d.activeSlotId)!==null; }")

    # Adaptive layout and content width.
    first_layout=page.locator('#tab-dashboard .layout').first
    children=first_layout.locator(':scope > section')
    r1=children.nth(0).evaluate('el=>el.getBoundingClientRect()'); r2=children.nth(1).evaluate('el=>el.getBoundingClientRect()')
    two_columns=abs(r1['top']-r2['top'])<=3 and r2['left']>r1['left']+50
    result['measurements']['dashboard_layout']={'first':r1,'second':r2,'two_columns':two_columns}
    result['checks']['adaptive_column_layout']= (not two_columns) if width<=1199 else two_columns
    tab=rect(page,'#tab-dashboard')
    result['measurements']['content']=tab
    result['checks']['content_width_is_bounded']=tab['width']<=1802
    if width>=2000:
        left_gap=tab['left']-shell['left']; right_gap=shell['right']-tab['right']
        result['measurements']['ultrawide_gaps']={'left':left_gap,'right':right_gap}
        result['checks']['ultrawide_content_centered']=left_gap>100 and right_gap>100 and abs(left_gap-right_gap)<=6
    else:
        result['checks']['ultrawide_content_centered']=True

    # Last navigation item remains reachable in short desktop viewports.
    page.locator('#mobileDrawer').evaluate('el=>el.scrollTop=el.scrollHeight'); page.wait_for_timeout(30)
    result['checks']['sidebar_last_item_reachable']=page.locator('#mobileDrawer [data-tab="release"]').evaluate('el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight+1&&r.top>=0}')

    # Visible focus treatment.
    page.locator('#desktopCommandBtn').focus()
    outline=page.locator('#desktopCommandBtn').evaluate('el=>getComputedStyle(el).outlineStyle')
    result['checks']['keyboard_focus_visible']=outline!='none'

    result['passed']=all(result['checks'].values()) and not result['console_errors'] and not result['page_errors']
    context.close(); return result

static_checks={
    'desktop_module_exists': (ROOT/'src/core/desktop.js').exists(),
    'desktop_module_loaded': 'installDesktopExperience' in (ROOT/'src/game.js').read_text(encoding='utf-8'),
    'desktop_breakpoint_contract': '@media (min-width: 881px)' in CSS,
    'tablet_rail_contract': '@media (min-width: 881px) and (max-width: 1199px)' in CSS,
    'ultrawide_contract': '@media (min-width: 2000px)' in CSS,
    'content_width_contract': '--desktop-content-max: 1800px' in CSS,
    'command_palette_runtime': 'openPalette' in DESKTOP_JS and 'commandItems' in DESKTOP_JS,
    'keyboard_shortcuts_runtime': 'TAB_SHORTCUTS' in DESKTOP_JS and 'Alt+S' in DESKTOP_JS and 'Alt+D' in DESKTOP_JS,
    'persistent_preferences_runtime': 'diplocraft_desktop_nav_compact' in DESKTOP_JS and 'diplocraft_desktop_density' in DESKTOP_JS,
}

case_filter=os.getenv('DIPLOCRAFT_DESKTOP_CASE')
cases=[case for case in CASES if not case_filter or case[0]==case_filter]
with sync_playwright() as p:
    browser=p.chromium.launch(**launch_options())
    results=[]
    for case in cases:
        print(f'RUN {case[0]}',flush=True)
        results.append(run_case(browser,*case))
        print(f'DONE {case[0]} passed={results[-1]["passed"]}',flush=True)
    browser.close()

report={
    'project':CONFIG['project'],'version':CONFIG['version'],'phase':CONFIG['stage_name'],
    'execution_model':'one isolated browser process per desktop viewport + deterministic aggregator',
    'static_checks':static_checks,'cases':results,'case_count':len(results),
    'check_count':len(static_checks)+sum(len(x['checks']) for x in results),
    'passed':all(static_checks.values()) and all(x['passed'] for x in results)
}
name=f'responsive-desktop-results-{case_filter}.json' if case_filter else 'responsive-desktop-results.json'
(ROOT/'tests'/name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"STATIC {'PASS' if all(static_checks.values()) else 'FAIL'} {sum(static_checks.values())}/{len(static_checks)}"]
lines += [f"{'PASS' if x['passed'] else 'FAIL'} {x['name']} {sum(x['checks'].values())}/{len(x['checks'])}" for x in results]
lines.append(f"OVERALL {'PASS' if report['passed'] else 'FAIL'} {report['check_count']} checks")
out=f'responsive-desktop-output-{case_filter}.txt' if case_filter else 'responsive-desktop-output.txt'
(ROOT/'tests'/out).write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if report['passed'] else 1)

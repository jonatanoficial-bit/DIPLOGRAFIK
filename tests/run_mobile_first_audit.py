#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, shutil

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
HTML = (ROOT/'tests/harness.html').read_text(encoding='utf-8')
CSS = (ROOT/'src/styles.css').read_text(encoding='utf-8')
MOBILE_JS = (ROOT/'src/core/mobile.js').read_text(encoding='utf-8')

LOCAL_STORAGE_POLYFILL = r'''(() => {
  const data = new Map();
  const storage = {
    getItem(key) { key=String(key); return data.has(key) ? data.get(key) : null; },
    setItem(key,value) { data.set(String(key),String(value)); },
    removeItem(key) { data.delete(String(key)); }, clear(){data.clear()},
    key(index){ return Array.from(data.keys())[index] ?? null; }, get length(){return data.size}
  };
  Object.defineProperty(window,'localStorage',{value:storage,configurable:true});
})();'''

def launch_options():
    options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM') != '1':
        executable=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
        if executable: options['executable_path']=executable
    return options

def rect(page, selector):
    return page.locator(selector).evaluate('''el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left}; }''')

def run_case(browser, name, width, height):
    result={'name':name,'viewport':{'width':width,'height':height},'checks':{},'measurements':{},'console_errors':[],'page_errors':[]}
    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
    page=context.new_page(); page.set_default_timeout(6000); page.add_init_script(LOCAL_STORAGE_POLYFILL)
    page.on('console',lambda msg: result['console_errors'].append(msg.text) if msg.type=='error' else None)
    page.on('pageerror',lambda err: result['page_errors'].append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded'); page.wait_for_timeout(800)

    expected_orientation='landscape' if width>height else 'portrait'
    status=page.evaluate('window.DIPLOCRAFT_MOBILE?.getStatus()')
    result['checks']['mobile_runtime_installed']=bool(status and status.get('installed'))
    result['checks']['orientation_detected']=status.get('orientation')==expected_orientation if status else False
    result['checks']['app_height_defined']=bool(status and status.get('appHeight','').endswith('px'))
    result['checks']['no_menu_horizontal_overflow']=page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    result['checks']['viewport_allows_user_scaling']='maximum-scale' not in page.locator('meta[name="viewport"]').get_attribute('content')

    menu_buttons=page.locator('#menu button:visible')
    menu_heights=[menu_buttons.nth(i).evaluate('el=>el.getBoundingClientRect().height') for i in range(menu_buttons.count())]
    result['measurements']['menu_button_min_height']=min(menu_heights)
    result['checks']['menu_touch_targets']=min(menu_heights)>=47
    page.locator('#menu').evaluate('el=>{el.style.scrollBehavior="auto";el.scrollTop=el.scrollHeight}')
    result['checks']['menu_last_action_reachable']=page.locator('#rcInfoBtn').evaluate('el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}')

    page.locator('[data-go="create"]').click(); page.wait_for_timeout(120)
    create=page.locator('#create')
    create_metrics=create.evaluate('el=>({clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,overflowY:getComputedStyle(el).overflowY})')
    result['measurements']['create']=create_metrics
    result['checks']['create_has_independent_scroll']=create_metrics['overflowY']=='auto' and create_metrics['scrollHeight']>create_metrics['clientHeight']
    result['checks']['avatar_cards_are_buttons']=page.locator('#avatars button.avatarCard').count()>=5
    result['checks']['party_cards_are_buttons']=page.locator('#parties button.party').count()>=1
    result['checks']['input_prevents_ios_zoom']=float(page.locator('#leaderName').evaluate('el=>parseFloat(getComputedStyle(el).fontSize)'))>=16

    # Keyboard simulation: focus, reduce viewport, validate keyboard-aware class, restore.
    original={'width':width,'height':height}
    page.locator('#leaderName').focus(); page.wait_for_timeout(50)
    reduced=max(180,height-220)
    page.set_viewport_size({'width':width,'height':reduced}); page.wait_for_timeout(180)
    result['checks']['virtual_keyboard_detected']=page.locator('body.keyboard-open').count()==1
    page.set_viewport_size(original); page.locator('#leaderName').blur(); page.wait_for_timeout(180)
    result['checks']['keyboard_state_recovers']=page.locator('body.keyboard-open').count()==0

    create.evaluate('el=>{el.style.scrollBehavior="auto";el.scrollTop=el.scrollHeight}'); page.wait_for_timeout(80)
    result['checks']['sticky_start_reachable']=page.locator('#startGame').evaluate('el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&r.height>=48}')
    page.locator('#startGame').click(); page.wait_for_timeout(1300)
    if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').click()

    result['checks']['game_shell_is_only_scroll_viewport']=page.locator('#gameScroll').evaluate('el=>getComputedStyle(el).overflowY')=='auto'
    result['checks']['bottom_nav_has_six_actions']=page.locator('.bottomNav button').count()==6
    nav=rect(page,'.bottomNav'); quick=rect(page,'#quickAdvance')
    result['measurements']['bottom_nav']=nav; result['measurements']['quick_advance']=quick
    nav_button_heights=[page.locator('.bottomNav button').nth(i).evaluate('el=>el.getBoundingClientRect().height') for i in range(6)]
    result['checks']['bottom_nav_touch_targets']=min(nav_button_heights)>=49
    result['checks']['bottom_nav_fits_width']=nav['left']>=-1 and nav['right']<=width+1
    result['checks']['quick_advance_does_not_cover_nav']=quick['bottom']<=nav['top']-5

    # More drawer and accessibility state.
    page.locator('#mobileMoreBtn').click()
    try:
        page.wait_for_function('document.body.classList.contains(\"nav-open\") && document.getElementById(\"mobileDrawer\").getBoundingClientRect().left >= -1', timeout=2500)
    except Exception:
        page.wait_for_timeout(320)
    drawer=rect(page,'#mobileDrawer')
    result['measurements']['drawer']=drawer
    result['checks']['more_opens_full_drawer']=page.locator('body.nav-open').count()==1 and page.locator('#mobileMoreBtn').get_attribute('aria-expanded')=='true'
    result['checks']['drawer_stays_inside_viewport']=drawer['left']>=-1 and drawer['right']<=width+1 and drawer['width']<=width*.9+2
    result['checks']['drawer_contains_all_tabs']=page.locator('#mobileDrawer [data-tab]').count()==14
    page.locator('#mobileCloseNav').click(); page.wait_for_timeout(80)
    result['checks']['drawer_close_restores_state']=page.locator('body.nav-open').count()==0 and page.locator('#mobileMenuBtn').get_attribute('aria-expanded')=='false'

    # Edge swipe gesture opens and overlay closes.
    page.evaluate('''() => {
      document.body.dispatchEvent(new PointerEvent('pointerdown',{pointerId:7,pointerType:'touch',clientX:4,clientY:220,bubbles:true}));
      document.body.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,pointerType:'touch',clientX:100,clientY:224,bubbles:true}));
    }'''); page.wait_for_timeout(80)
    result['checks']['edge_swipe_opens_drawer']=page.locator('body.nav-open').count()==1
    page.locator('#mobileOverlay').click(position={'x':width-4,'y':max(10,height//2)}); page.wait_for_timeout(50)
    result['checks']['overlay_closes_drawer']=page.locator('body.nav-open').count()==0

    # Tab label and per-tab scroll memory.
    page.locator('.bottomNav [data-tab="economy"]').click(); page.wait_for_timeout(80)
    result['checks']['mobile_section_tracks_tab']='Economia' in page.locator('#mobileSection').inner_text()
    page.locator('#gameScroll').evaluate('el=>el.scrollTop=Math.min(420,el.scrollHeight-el.clientHeight)')
    saved=page.locator('#gameScroll').evaluate('el=>el.scrollTop')
    page.locator('.bottomNav [data-tab="government"]').click(); page.wait_for_timeout(80)
    page.locator('.bottomNav [data-tab="economy"]').click(); page.wait_for_timeout(100)
    restored=page.locator('#gameScroll').evaluate('el=>el.scrollTop')
    result['measurements']['tab_scroll']={'saved':saved,'restored':restored}
    result['checks']['tab_scroll_position_restored']=saved<5 or abs(restored-saved)<=6
    result['checks']['no_game_horizontal_overflow']=page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1 && document.getElementById("gameScroll").scrollWidth <= innerWidth + 2')

    result['passed']=all(result['checks'].values()) and not result['console_errors'] and not result['page_errors']
    context.close(); return result

static_checks={
  'safe_area_css': all(token in CSS for token in ['safe-area-inset-top','safe-area-inset-right','safe-area-inset-bottom','safe-area-inset-left']),
  'keyboard_css_contract': 'body.keyboard-open .bottomNav' in CSS and '--keyboard-height' in CSS,
  'landscape_media_query': '@media (orientation: landscape) and (max-width: 880px)' in CSS,
  'minimum_320_layout': '@media (max-width: 380px)' in CSS,
  'touch_target_policy': '--touch-target: 48px' in CSS,
  'visual_viewport_runtime': 'window.visualViewport' in MOBILE_JS,
  'edge_gesture_runtime': 'pointerDown' in MOBILE_JS and 'pointerUp' in MOBILE_JS,
  'scroll_memory_runtime': 'scrollPositions' in MOBILE_JS and 'restoreTabScroll' in MOBILE_JS,
  'focus_trap_runtime': 'focusableInDrawer' in MOBILE_JS and 'event.key !== "Tab"' in MOBILE_JS,
}

with sync_playwright() as p:
    browser=p.chromium.launch(**launch_options())
    cases=[('phone_320x568',320,568),('phone_360x640',360,640),('phone_390x844',390,844),('phone_landscape_844x390',844,390),('tablet_768x1024',768,1024)]
    case_filter=os.getenv('DIPLOCRAFT_MOBILE_CASE')
    if case_filter:
        cases=[case for case in cases if case[0]==case_filter]
    results=[]
    for case in cases:
        print(f'RUN {case[0]}',flush=True)
        results.append(run_case(browser,*case))
        print(f'DONE {case[0]} passed={results[-1]["passed"]}',flush=True)
    browser.close()

report={
  'project':CONFIG['project'],'version':CONFIG['version'],'phase':CONFIG['stage_name'],
  'static_checks':static_checks,'cases':results,
  'case_count':len(results),
  'check_count':len(static_checks)+sum(len(x['checks']) for x in results),
  'passed':all(static_checks.values()) and all(x['passed'] for x in results)
}
output_name=f"mobile-first-results-{case_filter}.json" if case_filter else 'mobile-first-results.json'
(ROOT/'tests'/output_name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
summary=[f"STATIC {'PASS' if all(static_checks.values()) else 'FAIL'} {sum(static_checks.values())}/{len(static_checks)}"]
summary += [f"{'PASS' if x['passed'] else 'FAIL'} {x['name']} {sum(x['checks'].values())}/{len(x['checks'])}" for x in results]
summary.append(f"OVERALL {'PASS' if report['passed'] else 'FAIL'} {report['check_count']} checks")
output_text=f"mobile-first-output-{case_filter}.txt" if case_filter else 'mobile-first-output.txt'
(ROOT/'tests'/output_text).write_text('\n'.join(summary)+'\n',encoding='utf-8')
print('\n'.join(summary))
raise SystemExit(0 if report['passed'] else 1)

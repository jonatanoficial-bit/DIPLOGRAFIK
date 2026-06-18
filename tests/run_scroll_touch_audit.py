#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, shutil, time

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
HTML = (ROOT/'tests/harness.html').read_text(encoding='utf-8')
CSS = (ROOT/'src/styles.css').read_text(encoding='utf-8')
SCROLL_JS = (ROOT/'src/core/scrollExperience.js').read_text(encoding='utf-8')

CASES = [
    ('desktop_short_1024x600',1024,600,False,False),
    ('desktop_1366x768',1366,768,False,False),
    ('desktop_fullhd_1920x1080',1920,1080,False,False),
    ('tablet_mouse_1024x768',1024,768,False,False),
    ('mobile_320x568',320,568,True,True),
    ('mobile_360x640',360,640,True,True),
    ('mobile_390x844',390,844,True,True),
    ('mobile_landscape_844x390',844,390,True,True),
    ('tablet_touch_768x1024',768,1024,True,True),
]

LOCAL_STORAGE_POLYFILL = r'''(() => {
  const data = new Map();
  const storage = {getItem(k){k=String(k);return data.has(k)?data.get(k):null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))},clear(){data.clear()},key(i){return Array.from(data.keys())[i]??null},get length(){return data.size}};
  Object.defineProperty(window,'localStorage',{value:storage,configurable:true});
})();'''

def launch_options():
    options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-software-rasterizer']}
    if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM') != '1':
        executable=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
        if executable: options['executable_path']=executable
    return options

def rect(page, selector):
    return page.locator(selector).evaluate('''el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}''')

def visible(page, selector):
    return page.locator(selector).evaluate('''el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}''')

def trusted_swipe(page, context, x, start_y, end_y, steps=8):
    session=context.new_cdp_session(page)
    session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':x,'y':start_y,'radiusX':4,'radiusY':4,'force':1}]})
    for i in range(1,steps+1):
        y=start_y+(end_y-start_y)*(i/steps)
        session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':x,'y':y,'radiusX':4,'radiusY':4,'force':1}]})
        time.sleep(0.018)
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    page.wait_for_timeout(180)
    session.detach()

def run_case(browser, name, width, height, is_mobile, has_touch):
    result={'name':name,'viewport':{'width':width,'height':height},'mode':'touch' if has_touch else 'mouse','checks':{},'measurements':{},'console_errors':[],'page_errors':[]}
    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=is_mobile,has_touch=has_touch)
    page=context.new_page(); page.set_default_timeout(7000); page.add_init_script(LOCAL_STORAGE_POLYFILL)
    page.on('console',lambda msg: result['console_errors'].append(msg.text) if msg.type=='error' else None)
    page.on('pageerror',lambda err: result['page_errors'].append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded'); page.wait_for_timeout(950)

    status=page.evaluate('window.DIPLOCRAFT_SCROLL?.getStatus()')
    result['checks']['scroll_runtime_installed']=bool(status and status.get('installed'))
    result['checks']['menu_is_scroll_owner']=bool(status and status.get('owner')=='menu')
    result['checks']['document_remains_app_locked']=page.evaluate('window.scrollY===0 && document.documentElement.scrollTop===0')

    page.locator('[data-go="create"]').click(); page.wait_for_timeout(160)
    create_metrics=page.locator('#create').evaluate('''el=>({scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflowY:getComputedStyle(el).overflowY,touchAction:getComputedStyle(el).touchAction,scrollbarGutter:getComputedStyle(el).scrollbarGutter,position:getComputedStyle(el).position})''')
    result['measurements']['create_initial']=create_metrics
    result['checks']['create_owns_vertical_scroll']=create_metrics['overflowY']=='auto' and create_metrics['scrollHeight']>create_metrics['clientHeight'] and create_metrics['position']=='fixed'
    result['checks']['scrollbar_gutter_is_stable']='stable' in create_metrics['scrollbarGutter']
    result['checks']['touch_pan_y_enabled']='pan-y' in create_metrics['touchAction']
    result['checks']['scroll_assist_visible']=page.locator('#createScrollAssist').count()==1 and visible(page,'#createScrollAssist')
    result['checks']['no_create_horizontal_overflow']=page.evaluate('document.getElementById("create").scrollWidth <= innerWidth + 1')

    if has_touch:
        avatar=rect(page,'#avatars .avatarCard:first-child')
        x=max(12,min(width-12,avatar['left']+avatar['width']/2))
        start=max(80,min(height-32,avatar['bottom']-12))
        end=max(34,start-min(280,height*.46))
        before=page.locator('#create').evaluate('el=>el.scrollTop')
        trusted_swipe(page,context,x,start,end)
        after=page.locator('#create').evaluate('el=>el.scrollTop')
        result['measurements']['first_touch_swipe']={'before':before,'after':after,'start':start,'end':end,'x':x}
        result['checks']['real_touch_swipe_scrolls_from_avatar']=after>before+18
        # Repeat real swipes until the final data block (party controls) becomes visible.
        loops=0
        while loops<12 and not visible(page,'#partySearch'):
            trusted_swipe(page,context,width*.56,height*.78,max(28,height*.22),steps=7)
            loops+=1
        result['measurements']['touch_swipes_to_party_controls']=loops
        result['checks']['touch_reaches_party_controls']=visible(page,'#partySearch')
        result['checks']['touch_reaches_start_button']=visible(page,'#startGame')
    else:
        page.mouse.move(width*.62,height*.62)
        before=page.locator('#create').evaluate('el=>el.scrollTop')
        page.mouse.wheel(0,620); page.wait_for_timeout(160)
        after=page.locator('#create').evaluate('el=>el.scrollTop')
        result['measurements']['mouse_wheel']={'before':before,'after':after}
        result['checks']['mouse_wheel_scrolls_create']=after>before+80
        key_before=after
        page.keyboard.press('PageDown'); page.wait_for_timeout(420)
        key_after=page.locator('#create').evaluate('el=>el.scrollTop')
        result['measurements']['page_down']={'before':key_before,'after':key_after}
        result['checks']['keyboard_page_down_scrolls']=key_after>key_before+40
        page.keyboard.press('Home'); page.wait_for_timeout(420)
        wheel_steps=0
        while wheel_steps<10 and not visible(page,'#partySearch'):
            page.mouse.wheel(0,360); page.wait_for_timeout(85)
            wheel_steps+=1
        result['measurements']['wheel_steps_to_party_controls']=wheel_steps
        result['checks']['mouse_wheel_reaches_party_controls']=visible(page,'#partySearch')
        bottom_steps=0
        while bottom_steps<10 and not visible(page,'#startGame'):
            page.mouse.wheel(0,420); page.wait_for_timeout(85)
            bottom_steps+=1
        result['measurements']['wheel_steps_to_start']=bottom_steps
        result['checks']['mouse_wheel_reaches_start_button']=visible(page,'#startGame')

    result['checks']['name_field_reachable']=page.locator('#leaderName').count()==1
    page.locator('#leaderName').fill('Auditoria Scroll')
    result['checks']['name_field_editable']=page.locator('#leaderName').input_value()=='Auditoria Scroll'
    result['checks']['party_controls_reachable']=bool(result['checks'].get('touch_reaches_party_controls', result['checks'].get('mouse_wheel_reaches_party_controls', False))) and page.locator('#parties .party').count()>=1
    result['checks']['start_touch_target']=page.locator('#startGame').evaluate('el=>el.getBoundingClientRect().height>=52')
    result['checks']['back_touch_target']=page.locator('#create .back').evaluate('el=>{const r=el.getBoundingClientRect();return r.width>=48&&r.height>=48}')

    # The assist must respond to scroll progress and disappear after leaving the top.
    assist_hidden=page.locator('#createScrollAssist.is-hidden').count()==1
    result['checks']['scroll_assist_tracks_progress']=assist_hidden

    page.locator('#startGame').click(); page.wait_for_timeout(1250)
    if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').click()
    result['checks']['game_starts_after_scrolling']=page.locator('#game.active').count()==1

    if has_touch:
        icon_sizes=page.locator('.bottomNav button b').evaluate_all('els=>els.map(el=>parseFloat(getComputedStyle(el).fontSize))')
        button_heights=page.locator('.bottomNav button').evaluate_all('els=>els.map(el=>el.getBoundingClientRect().height)')
        result['measurements']['mobile_icons']=icon_sizes
        result['checks']['mobile_icons_are_legible']=bool(icon_sizes) and min(icon_sizes)>=20
        result['checks']['mobile_nav_touch_targets']=bool(button_heights) and min(button_heights)>=49
        result['checks']['game_touch_scroll_owner']=page.locator('#gameScroll').evaluate('el=>getComputedStyle(el).overflowY')=='auto'
    else:
        result['checks']['desktop_game_scroll_owner']=page.locator('#gameScroll').evaluate('el=>getComputedStyle(el).overflowY')=='auto'
        result['checks']['desktop_scrollbar_css_present']='12px' in page.locator('#gameScroll').evaluate('el=>getComputedStyle(document.documentElement).getPropertyValue("--dc-scrollbar-size")')

    result['checks']['no_page_errors']=not result['page_errors']
    result['checks']['no_console_errors']=not result['console_errors']
    result['passed']=all(result['checks'].values())
    context.close()
    return result

static_checks={
    'scroll_module_exists':(ROOT/'src/core/scrollExperience.js').exists(),
    'scroll_module_loaded':'installScrollExperience' in (ROOT/'src/game.js').read_text(encoding='utf-8'),
    'setup_scroll_owner_css':'#create.screen.active' in CSS and 'overflow-y: auto !important' in CSS,
    'fixed_setup_viewport':'position: fixed' in CSS and 'scrollbar-gutter: stable' in CSS,
    'desktop_scrollbar_styled':'::-webkit-scrollbar' in CSS and '--dc-scrollbar-size: 12px' in CSS,
    'touch_pan_contract':'touch-action: pan-y pinch-zoom' in CSS,
    'ios_momentum_contract':'-webkit-overflow-scrolling: touch' in CSS,
    'keyboard_navigation_runtime':all(token in SCROLL_JS for token in ['PageDown','PageUp','Home','End']),
    'scroll_assist_runtime':'updateAssist' in SCROLL_JS and 'createScrollAssist' in SCROLL_JS,
    'minimum_icon_policy':'minimum_icon_px' in (ROOT/'build.config.json').read_text(encoding='utf-8'),
}

case_filter=os.getenv('DIPLOCRAFT_SCROLL_CASE')
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
name=f'scroll-touch-results-{case_filter}.json' if case_filter else 'scroll-touch-results.json'
(ROOT/'tests'/name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"STATIC {'PASS' if all(static_checks.values()) else 'FAIL'} {sum(static_checks.values())}/{len(static_checks)}"]
lines += [f"{'PASS' if x['passed'] else 'FAIL'} {x['name']} {sum(x['checks'].values())}/{len(x['checks'])}" for x in results]
lines.append(f"OVERALL {'PASS' if report['passed'] else 'FAIL'} {report['check_count']} checks")
out=f'scroll-touch-output-{case_filter}.txt' if case_filter else 'scroll-touch-output.txt'
(ROOT/'tests'/out).write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if report['passed'] else 1)

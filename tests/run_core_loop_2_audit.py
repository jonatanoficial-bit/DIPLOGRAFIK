#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, shutil

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
SIM = json.loads((ROOT/'tests/simulation-results.json').read_text(encoding='utf-8'))
HTML = (ROOT/'tests/harness.html').read_text(encoding='utf-8')
CORE = (ROOT/'src/systems/coreLoop.js').read_text(encoding='utf-8')
STATE = (ROOT/'src/core/stateFactory.js').read_text(encoding='utf-8')
INDEX = (ROOT/'index.html').read_text(encoding='utf-8')
CSS = (ROOT/'src/styles.css').read_text(encoding='utf-8')
ECONOMY = (ROOT/'src/systems/economy.js').read_text(encoding='utf-8')

static_checks = {
    'version_at_least_1_5_0': tuple(map(int, CONFIG.get('version','0.0.0').split('.'))) >= (1,5,0),
    'core_loop_2_preserved': CONFIG.get('stage_number',0) >= 14 and CONFIG.get('core_loop_2',{}).get('enabled') is True,
    'core_loop_schema_two': 'CORE_LOOP_SCHEMA = 2' in CORE,
    'term_is_four_years': 'TERM_DAYS = 1460' in CORE and 'electionDays: 1460' in STATE,
    'weekly_cycle_present': 'weeklyGovernanceCycle' in CORE,
    'monthly_cycle_present': 'monthlyGovernanceCycle' in CORE,
    'quarterly_cycle_present': 'quarterlyGovernanceCycle' in CORE,
    'annual_cycle_present': 'annualGovernanceCycle' in CORE,
    'delayed_consequences_present': 'queueConsequence' in CORE and 'processPendingConsequences' in CORE,
    'action_capacity_present': 'consumeActionCapacity' in CORE and 'actionPoints' in STATE,
    'automatic_stabilizers_present': 'applyAutomaticStabilizers' in CORE,
    'real_outcomes_present': 'resolveCareerOutcome' in CORE and 'monitorInstitutionalPressure' in CORE,
    'election_lock_present': 'canHoldElection' in CORE and '30 dias finais' in CORE,
    'outcome_overlay_present': 'id="careerOutcomeOverlay"' in INDEX,
    'governance_dashboard_present': 'id="governanceCycle"' in INDEX and 'id="pendingConsequences"' in INDEX,
    'core_loop_mobile_css_present': '.coreLoopHero' in CSS and '.careerOutcomeCard' in CSS,
    'gdp_is_annualized': 'report.growthIndex / 1200' in ECONOMY,
    'simulation_matrix_passed': bool(SIM.get('passed')),
    'simulation_has_12_cases': SIM.get('matrix_cases') == 12,
    'simulation_has_zero_balance_warnings': not SIM.get('balance_warnings'),
    'simulation_129600_days': SIM.get('total_simulated_days') == 129600,
    'average_stability_above_floor': SIM.get('final_averages',{}).get('stability',0) >= 18,
    'average_approval_above_floor': SIM.get('final_averages',{}).get('approval',0) >= 18,
    'average_crisis_below_ceiling': SIM.get('final_averages',{}).get('crisis',10) <= 7.5,
    'all_cases_above_emergency_floor': all(c.get('final',{}).get('stability',0) >= 8 for c in SIM.get('cases',[])),
}

CASES = [
    ('mobile_360x640', 360, 640, True, True),
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

def number_from(text):
    digits=''.join(ch for ch in text if ch.isdigit())
    return int(digits or 0)

def run_case(browser, name, width, height, is_mobile, has_touch):
    record={'name':name,'viewport':{'width':width,'height':height},'checks':{},'measurements':{},'console_errors':[],'page_errors':[]}
    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=is_mobile,has_touch=has_touch)
    page=context.new_page(); page.set_default_timeout(9000); page.add_init_script(LOCAL_STORAGE_POLYFILL)
    page.on('console',lambda msg: record['console_errors'].append(msg.text) if msg.type=='error' else None)
    page.on('pageerror',lambda err: record['page_errors'].append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded'); page.wait_for_timeout(950)

    page.locator('[data-go="create"]').click(); page.wait_for_timeout(120)
    page.locator('#leaderName').fill(f'Auditoria {name}')
    page.locator('#create').evaluate('el=>el.scrollTop=el.scrollHeight'); page.wait_for_timeout(80)
    page.locator('#startGame').click(); page.wait_for_timeout(1150)
    if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').click()

    checks=record['checks']
    checks['career_started']=page.locator('#game.active').count()==1
    checks['governance_panel_visible']=page.locator('#governanceCycle').is_visible()
    checks['pending_panel_visible']=page.locator('#pendingConsequences').is_visible()
    gov_text=page.locator('#governanceCycle').inner_text()
    checks['term_displayed']='1/2' in gov_text
    checks['week_displayed']=bool(gov_text.strip()) and ('10/10' in gov_text or 'Pontos' in gov_text or 'Action' in gov_text or 'Acción' in gov_text)
    checks['phase_displayed']=any(x in gov_text for x in ['Primeiros 100 dias','First 100 days','Primeros 100 días'])
    checks['legacy_score_displayed']='/100' in gov_text
    checks['election_locked_at_start']=page.locator('#simulateElection').is_disabled()
    checks['time_controls_enabled']=not page.locator('#advanceWeek').is_disabled()
    checks['dashboard_no_horizontal_overflow']=page.locator('#tab-dashboard').evaluate('el=>el.scrollWidth<=el.clientWidth+3')

    before_week=number_from(page.locator('#governanceCycle').inner_text().splitlines()[3] if len(page.locator('#governanceCycle').inner_text().splitlines())>3 else '1')
    before_date=page.locator('#dateHud').inner_text()
    page.locator('#advanceWeek').click(); page.wait_for_timeout(260)
    after_text=page.locator('#governanceCycle').inner_text()
    after_date=page.locator('#dateHud').inner_text()
    checks['week_advance_changes_date']=after_date != before_date
    checks['weekly_report_renders']=page.locator('#governanceCycle').count()==1 and bool(after_text.strip())

    action_before=page.locator('#governanceCycle').evaluate("el=>{const m=el.innerText.match(/(\\d+)\\/(\\d+)/g);return m?m[m.length-1]:''}")
    decision=page.locator('#decisionDeck [data-decision]').first
    if decision.count() and decision.is_enabled():
        decision.click(); page.wait_for_timeout(260)
        action_after=page.locator('#governanceCycle').evaluate("el=>{const m=el.innerText.match(/(\\d+)\\/(\\d+)/g);return m?m[m.length-1]:''}")
        checks['strategic_action_consumes_capacity']=action_after != action_before
        checks['delayed_consequence_rendered']=page.locator('#pendingConsequences .consequenceItem').count()>=1
    else:
        checks['strategic_action_consumes_capacity']=False
        checks['delayed_consequence_rendered']=False

    checks['governance_metrics_are_bounded']=page.locator('#governanceCycle .metric').evaluate_all('els=>els.every(el=>{const w=el.querySelector("i")?.style.width||"0%";const n=parseFloat(w);return Number.isFinite(n)&&n>=0&&n<=100})')
    checks['save_still_works']=page.evaluate('window.DIPLOCRAFT_SAVE_ARCHITECTURE.save(undefined,{reason:"core-loop-audit"})')
    checks['save_contains_governance_schema']=page.evaluate('''() => {const text=window.DIPLOCRAFT_SAVE_ARCHITECTURE.exportBundle();const x=JSON.parse(text);return x.save.state.governance?.schema===2&&Array.isArray(x.save.state.governance.pendingConsequences);}''')
    checks['career_overlay_hidden_while_active']=page.locator('#careerOutcomeOverlay.open').count()==0 and page.locator('#careerOutcomeOverlay').get_attribute('aria-hidden')=='true'

    if has_touch:
        heights=page.locator('#advanceWeek, #quickAdvance, #mobileMenuBtn').evaluate_all('els=>els.filter(e=>e.offsetParent!==null).map(e=>e.getBoundingClientRect().height)')
        record['measurements']['touch_heights']=heights
        checks['mobile_time_targets_at_least_48']=bool(heights) and min(heights)>=47
    else:
        checks['mobile_time_targets_at_least_48']=True
    checks['no_page_errors']=not record['page_errors']
    checks['no_console_errors']=not record['console_errors']
    record['passed']=all(checks.values())
    context.close()
    return record

results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(**launch_options())
    for case in CASES:
        results.append(run_case(browser,*case))
    browser.close()

all_checks=dict(static_checks)
for result in results:
    for key,value in result['checks'].items(): all_checks[f"{result['name']}::{key}"]=value
report={
    'project':'DIPLOCRAFT','version':CONFIG.get('version'),'suite':'core-loop-2-audit',
    'static_checks':static_checks,'profiles':results,'checks':all_checks,
    'check_count':len(all_checks),'passed_checks':sum(bool(v) for v in all_checks.values()),
    'simulation_averages':SIM.get('final_averages',{}),'balance_warnings':SIM.get('balance_warnings',[]),
    'passed':all(all_checks.values()) and all(r['passed'] for r in results)
}
(ROOT/'tests/core-loop-2-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in all_checks.items()]
lines.append(f"OVERALL {'PASS' if report['passed'] else 'FAIL'} {report['passed_checks']}/{report['check_count']}")
(ROOT/'tests/core-loop-2-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(lines[-1])
raise SystemExit(0 if report['passed'] else 1)

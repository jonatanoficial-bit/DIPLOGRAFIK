#!/usr/bin/env python3
from pathlib import Path
import importlib.util, json, time

ROOT = Path(__file__).resolve().parents[1]

def read_json(relative):
    path = ROOT/relative
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return None

# Build Truth is checked in-process so the aggregator does not depend on nested subprocesses.
spec = importlib.util.spec_from_file_location('diplocraft_generate_build', ROOT/'tools/generate_build.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
config = read_json('build.config.json')
expected = module.generated_files(config)
generator_ok = all((ROOT/path).exists() and (ROOT/path).read_text(encoding='utf-8') == content for path,content in expected.items())

static = read_json('tests/static-audit-results.json')
clean = read_json('tests/clean-base-audit-results.json')
build_truth = read_json('tests/build-truth-audit-results.json')
drift = read_json('tests/drift-guard-results.json')
node = read_json('tests/node-test-results.json')
simulation = read_json('tests/simulation-results.json')
browser = read_json('tests/browser-results.json')
resilience = read_json('tests/resilience-audit-results.json')
asset_pipeline = read_json('tests/asset-pipeline-results.json')
mobile_first = read_json('tests/mobile-first-results.json')
pwa = read_json('tests/pwa-audit-results.json')
responsive_desktop = read_json('tests/responsive-desktop-results.json')
i18n = read_json('tests/i18n-audit-results.json')
web_assets = read_json('tests/web-asset-audit-results.json')
scroll_touch = read_json('tests/scroll-touch-results.json')
localization = read_json('tests/localization-complete-results.json')
save_architecture = read_json('tests/save-architecture-results.json')
core_loop_2 = read_json('tests/core-loop-2-results.json')
government_creation = read_json('tests/government-creation-results.json')
population = read_json('tests/population-results.json')
deep_economy = read_json('tests/deep-economy-results.json')

browser_passed = isinstance(browser,list) and len(browser)==4 and all(item.get('passed') for item in browser)
browser_checks = sum(len(item.get('checks',{})) for item in browser or [])
steps = [
    {'name':'build-generator-check','passed':generator_ok,'checks':1},
    {'name':'static-audit','passed':bool(static and static.get('passed')),'checks':len((static or {}).get('checks',{}))},
    {'name':'clean-base-audit','passed':bool(clean and clean.get('passed')),'checks':len((clean or {}).get('checks',{}))},
    {'name':'build-truth-audit','passed':bool(build_truth and build_truth.get('passed')),'checks':len((build_truth or {}).get('checks',{}))},
    {'name':'drift-guard','passed':bool(drift and drift.get('passed')),'checks':sum(isinstance(v,bool) for k,v in (drift or {}).items() if k!='passed')+1 if drift else 0},
    {'name':'node-tests','passed':bool(node and node.get('passed')),'checks':int((node or {}).get('tests') or 0)},
    {'name':'simulation-matrix','passed':bool(simulation and simulation.get('passed')),'checks':int((simulation or {}).get('matrix_cases') or 0)},
    {'name':'browser-regression','passed':browser_passed,'checks':browser_checks},
    {'name':'anti-break-audit','passed':bool(resilience and resilience.get('passed')),'checks':len((resilience or {}).get('checks',{}))},
    {'name':'asset-pipeline-audit','passed':bool(asset_pipeline and asset_pipeline.get('passed')),'checks':len((asset_pipeline or {}).get('checks',{}))},
    {'name':'mobile-first-audit','passed':bool(mobile_first and mobile_first.get('passed')),'checks':int((mobile_first or {}).get('check_count') or 0)},
    {'name':'pwa-audit','passed':bool(pwa and pwa.get('passed')),'checks':len((pwa or {}).get('checks',{}))},
    {'name':'responsive-desktop-audit','passed':bool(responsive_desktop and responsive_desktop.get('passed')),'checks':int((responsive_desktop or {}).get('check_count') or 0)},
    {'name':'i18n-audit','passed':bool(i18n and i18n.get('passed')),'checks':int((i18n or {}).get('check_count') or 0)},
    {'name':'web-asset-recovery-audit','passed':bool(web_assets and web_assets.get('passed')),'checks':len((web_assets or {}).get('checks',{}))},
    {'name':'scroll-touch-audit','passed':bool(scroll_touch and scroll_touch.get('passed')),'checks':int((scroll_touch or {}).get('check_count') or 0)},
    {'name':'localization-complete-audit','passed':bool(localization and localization.get('passed')),'checks':int((localization or {}).get('check_count') or 0)},
    {'name':'save-architecture-audit','passed':bool(save_architecture and save_architecture.get('passed')),'checks':int((save_architecture or {}).get('check_count') or 0)},
    {'name':'core-loop-2-audit','passed':bool(core_loop_2 and core_loop_2.get('passed')),'checks':int((core_loop_2 or {}).get('check_count') or 0)},
    {'name':'government-creation-audit','passed':bool(government_creation and government_creation.get('passed')),'checks':int((government_creation or {}).get('check_count') or 0)},
    {'name':'country-population-audit','passed':bool(population and population.get('passed')),'checks':int((population or {}).get('check_count') or 0)},
    {'name':'deep-economy-audit','passed':bool(deep_economy and deep_economy.get('passed')),'checks':int((deep_economy or {}).get('check_count') or 0)},
]
report = {
    'project':config.get('project') if config else None,
    'version':config.get('version') if config else None,
    'phase':config.get('stage_name') if config else None,
    'generated_at':time.strftime('%Y-%m-%dT%H:%M:%S%z'),
    'release_blocking':True,
    'execution_model':'independent suites + final report aggregator',
    'steps':steps,
    'passed_steps':sum(item['passed'] for item in steps),
    'total_steps':len(steps),
    'passed_checks':sum(item['checks'] for item in steps if item['passed']),
    'total_checks':sum(item['checks'] for item in steps),
    'balance_warnings':(simulation or {}).get('balance_warnings',[]),
    'passed':all(item['passed'] for item in steps),
}
(ROOT/'tests/test-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if item['passed'] else 'FAIL'} {item['name']} ({item['checks']} checks)" for item in steps]
lines += [f"OVERALL {'PASS' if report['passed'] else 'FAIL'} {report['passed_steps']}/{report['total_steps']} suites; {report['passed_checks']}/{report['total_checks']} checks"]
if report['balance_warnings']:
    lines.append('BALANCE WARNINGS:')
    lines += [f'- {item}' for item in report['balance_warnings']]
(ROOT/'tests/quality-gate-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if report['passed'] else 1)

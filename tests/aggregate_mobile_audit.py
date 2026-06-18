#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
config=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
expected=['phone_320x568','phone_360x640','phone_390x844','phone_landscape_844x390','tablet_768x1024']
reports=[]
errors=[]
for name in expected:
    path=ROOT/'tests'/f'mobile-first-results-{name}.json'
    if not path.exists():
        errors.append(f'missing report: {path.name}')
        continue
    try: report=json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'invalid report {path.name}: {exc}')
        continue
    if report.get('version')!=config['version']: errors.append(f'version mismatch: {path.name}')
    if report.get('case_count')!=1 or not report.get('cases') or report['cases'][0].get('name')!=name: errors.append(f'case mismatch: {path.name}')
    reports.append(report)

static=reports[0].get('static_checks',{}) if reports else {}
cases=[r['cases'][0] for r in reports if r.get('cases')]
result={
  'project':config['project'],'version':config['version'],'phase':config['stage_name'],
  'execution_model':'one isolated browser process per viewport + deterministic aggregator',
  'expected_cases':expected,'static_checks':static,'cases':cases,
  'case_count':len(cases),'passed_cases':sum(bool(x.get('passed')) for x in cases),
  'check_count':len(static)+sum(len(x.get('checks',{})) for x in cases),
  'errors':errors,
  'passed':not errors and len(cases)==len(expected) and all(static.values()) and all(x.get('passed') for x in cases)
}
(ROOT/'tests/mobile-first-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"STATIC {'PASS' if all(static.values()) else 'FAIL'} {sum(bool(v) for v in static.values())}/{len(static)}"]
lines += [f"{'PASS' if x.get('passed') else 'FAIL'} {x.get('name')} {sum(bool(v) for v in x.get('checks',{}).values())}/{len(x.get('checks',{}))}" for x in cases]
lines += [f"ERROR {e}" for e in errors]
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} {result['passed_cases']}/{len(expected)} cases; {result['check_count']} checks")
(ROOT/'tests/mobile-first-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

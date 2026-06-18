#!/usr/bin/env python3
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
CASES=['desktop_short_1024x600','desktop_1366x768','desktop_fullhd_1920x1080','tablet_mouse_1024x768','mobile_320x568','mobile_360x640','mobile_390x844','mobile_landscape_844x390','tablet_touch_768x1024']
items=[]; static=None
for case in CASES:
    path=ROOT/'tests'/f'scroll-touch-results-{case}.json'
    if not path.exists(): raise SystemExit(f'Missing {path.name}')
    data=json.loads(path.read_text(encoding='utf-8'))
    static=static or data.get('static_checks',{})
    items.extend(data.get('cases',[]))
report={'project':CONFIG['project'],'version':CONFIG['version'],'phase':CONFIG['stage_name'],'execution_model':'one isolated browser process per viewport + deterministic aggregator','static_checks':static or {},'cases':items,'case_count':len(items),'check_count':len(static or {})+sum(len(x.get('checks',{})) for x in items),'passed':all((static or {}).values()) and len(items)==len(CASES) and all(x.get('passed') for x in items)}
(ROOT/'tests/scroll-touch-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"STATIC {'PASS' if all((static or {}).values()) else 'FAIL'} {sum((static or {}).values())}/{len(static or {})}"]+[f"{'PASS' if x.get('passed') else 'FAIL'} {x.get('name')} {sum(x.get('checks',{}).values())}/{len(x.get('checks',{}))}" for x in items]+[f"OVERALL {'PASS' if report['passed'] else 'FAIL'} {report['check_count']} checks"]
(ROOT/'tests/scroll-touch-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if report['passed'] else 1)

#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
CASES = ['mobile_360x640','mobile_390x844','tablet_768x1024','desktop_1366x768']
all_results=[]
lines=[]
for name in CASES:
    path=ROOT/'tests'/f'browser-results-{name}.json'
    if not path.exists():
        lines.append(f'FAIL {name}: relatório ausente')
        continue
    data=json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data,list) or len(data)!=1:
        lines.append(f'FAIL {name}: formato inválido')
        continue
    item=data[0]
    all_results.append(item)
    count=len(item.get('checks',{}))
    passed=sum(bool(v) for v in item.get('checks',{}).values())
    lines.append(f"{'PASS' if item.get('passed') else 'FAIL'} {name} {passed}/{count}")
passed=len(all_results)==len(CASES) and all(x.get('passed') for x in all_results)
(ROOT/'tests/browser-results.json').write_text(json.dumps(all_results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines.append(f"OVERALL {'PASS' if passed else 'FAIL'} {sum(x.get('passed',False) for x in all_results)}/{len(CASES)} cases; {sum(len(x.get('checks',{})) for x in all_results)} checks")
(ROOT/'tests/browser-audit-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if passed else 1)

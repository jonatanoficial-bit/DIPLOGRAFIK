#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, time

ROOT = Path(__file__).resolve().parents[1]
patterns = ['tests/unit/*.test.js','tests/integration/*.test.js','tests/contracts/*.test.js']
files = sorted(str(p.relative_to(ROOT)) for pattern in patterns for p in ROOT.glob(pattern))
started = time.perf_counter()
proc = subprocess.run(['node','--test','--test-concurrency=1',*files], cwd=ROOT, capture_output=True, text=True)
duration_ms = round((time.perf_counter()-started)*1000)
text = proc.stdout + '\n' + proc.stderr

def extract(label):
    match = re.search(rf'^# {re.escape(label)}\s+(\d+)\s*$', text, re.M)
    return int(match.group(1)) if match else None

result = {
    'runner':'node:test',
    'files':files,
    'duration_ms':duration_ms,
    'tests':extract('tests'),
    'passed_tests':extract('pass'),
    'failed_tests':extract('fail'),
    'returncode':proc.returncode,
    'stdout':proc.stdout,
    'stderr':proc.stderr,
    'passed':proc.returncode==0 and extract('fail')==0,
}
(ROOT/'tests/node-test-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'tests/node-test-output.txt').write_text(text,encoding='utf-8')
print(f"Node tests: {result['passed_tests']}/{result['tests']} passed")
raise SystemExit(0 if result['passed'] else 1)

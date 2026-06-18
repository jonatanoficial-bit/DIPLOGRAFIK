from pathlib import Path
import importlib.util, json

ROOT = Path('.').resolve()
spec = importlib.util.spec_from_file_location('diplocraft_generate_build', ROOT/'tools/generate_build.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
config = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
expected = module.generated_files(config)
original = (ROOT/'VERSAO.txt').read_text(encoding='utf-8')
tampered = original + '\nALTERACAO_MANUAL_CONTROLADA\n'

result = {
  'method': 'in-memory deterministic drift simulation',
  'canonical_matches_generated': original == expected['VERSAO.txt'],
  'tamper_detected': tampered != expected['VERSAO.txt'],
  'filesystem_untouched': (ROOT/'VERSAO.txt').read_text(encoding='utf-8') == original,
}
result['passed'] = all(result.values()) if all(isinstance(v, bool) for k,v in result.items() if k != 'method') else False
Path('tests/drift-guard-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(0 if result['passed'] else 1)

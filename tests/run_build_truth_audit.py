from pathlib import Path
import hashlib, json, re, subprocess, sys, unicodedata

ROOT = Path('.').resolve()
CONFIG_PATH = ROOT / 'build.config.json'
config_bytes = CONFIG_PATH.read_bytes()
config = json.loads(config_bytes.decode('utf-8'))
source_hash = hashlib.sha256(config_bytes).hexdigest()
version = config['version']
stamp = config['stamp']
stage_number = config['stage_number']
stage_name = config['stage_name']
normalized_stage_name = unicodedata.normalize('NFKD', stage_name).encode('ascii', 'ignore').decode('ascii')
stage_slug = re.sub(r'[^A-Z0-9]+', '-', normalized_stage_name.upper()).strip('-')
artifact = f"{config['project']}_v{version}_FASE-{stage_number}_{stage_slug}_build_{stamp}.zip"

proc = subprocess.run([sys.executable, 'tools/generate_build.py', '--check'], capture_output=True, text=True)

json_paths = ['meta/build.json','meta/project_identity.json','meta/package.json','meta/pwa.json','content/manifest.json','tests/expected-build.json','manifest.webmanifest']
parsed = {p: json.loads((ROOT/p).read_text(encoding='utf-8')) for p in json_paths}
build_js = (ROOT/'src/core/build.js').read_text(encoding='utf-8')
index = (ROOT/'index.html').read_text(encoding='utf-8')
version_txt = (ROOT/'VERSAO.txt').read_text(encoding='utf-8')
summary = (ROOT/'BUILD_SUMMARY.txt').read_text(encoding='utf-8')
readme = (ROOT/'README.md').read_text(encoding='utf-8')
changelog = (ROOT/'CHANGELOG.md').read_text(encoding='utf-8')

sw = (ROOT/'sw.js').read_text(encoding='utf-8')
outputs = [build_js, version_txt, summary, readme, sw]
outputs += [json.dumps(x, ensure_ascii=False) for x in parsed.values()]

checks = {
  'generator_check_passes': proc.returncode == 0,
  'semver_valid': bool(re.fullmatch(r'\d+\.\d+\.\d+', version)),
  'stamp_matches_date_time': stamp == config['date_iso'].replace('-','') + '_' + config['time'].replace(':',''),
  'artifact_name_derived': parsed['meta/package.json'].get('artifact_filename') == artifact and parsed['meta/build.json'].get('artifact') == artifact,
  'source_hash_consistent': all(source_hash in text for text in outputs),
  'version_consistent': all(version in text for text in outputs) and parsed['content/manifest.json']['version'] == version,
  'stage_consistent': parsed['meta/build.json']['stage_number'] == stage_number and parsed['meta/project_identity.json']['current_phase'] == stage_number,
  'status_consistent': parsed['meta/build.json']['status'] == config['status'] and config['status'] in build_js,
  'runtime_generated_header': build_js.startswith('// AUTO-GENERATED'),
  'html_has_no_static_semver': not re.search(r'v\d+\.\d+\.\d+', index),
  'html_has_no_static_build_timestamp': not re.search(r'\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}', index),
  'html_has_runtime_placeholders': 'Carregando identificação da build' in index and 'Carregando informações da build' in index,
  'changelog_current_entry': f'## v{version} — Fase {stage_number} — {stage_name}' in changelog,
  'canonical_source_declared': parsed['meta/project_identity.json']['canonical_build_source'] == 'build.config.json',
  'save_compatibility_preserved': parsed['meta/build.json']['save_schema'] == 3 and parsed['meta/build.json']['save_key_preserved'] == 'diplocraft_save_v101',
  'pwa_identity_consistent': parsed['meta/pwa.json']['version'] == version and version in sw and parsed['manifest.webmanifest']['name'].startswith('DIPLOCRAFT'),
  'pwa_cache_is_versioned': parsed['meta/pwa.json']['cache_name'] in sw and stamp in parsed['meta/pwa.json']['cache_name'],
}
result = {
  'project': config['project'], 'version': version, 'artifact': artifact,
  'source_sha256': source_hash, 'generator_stdout': proc.stdout.strip(), 'generator_stderr': proc.stderr.strip(),
  'checks': checks, 'passed': all(checks.values())
}
Path('tests/build-truth-audit-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(0 if result['passed'] else 1)

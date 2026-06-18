from pathlib import Path
from bs4 import BeautifulSoup
import json
import posixpath
import re
import subprocess

ROOT = Path('.').resolve()
CONFIG = json.loads(Path('build.config.json').read_text(encoding='utf-8'))
VERSION = CONFIG['version']

html_text = Path('index.html').read_text(encoding='utf-8')
soup = BeautifulSoup(html_text, 'html.parser')
all_id_nodes = soup.find_all(attrs={'id': True})
html_ids = {node['id'] for node in all_id_nodes}
seen = set()
duplicate_ids = []
for node in all_id_nodes:
    value = node['id']
    if value in seen and value not in duplicate_ids:
        duplicate_ids.append(value)
    seen.add(value)

IMPORT_RE = re.compile(r'(?:import\s+(?:[^;]*?\s+from\s+)?|export\s+[^;]*?\s+from\s+)["\']([^"\']+)["\']')

def resolve_import(source: Path, specifier: str):
    if not specifier.startswith('.'):
        return None
    candidate = (source.parent / specifier).resolve()
    if candidate.suffix == '':
        candidate = candidate.with_suffix('.js')
    return candidate

closure = set()
missing_imports = []
stack = [(ROOT / 'src/game.js').resolve()]
while stack:
    path = stack.pop()
    if path in closure:
        continue
    closure.add(path)
    source = path.read_text(encoding='utf-8')
    for specifier in IMPORT_RE.findall(source):
        target = resolve_import(path, specifier)
        if target is None:
            continue
        if not target.exists():
            missing_imports.append({'source': str(path.relative_to(ROOT)), 'specifier': specifier})
        elif target not in closure:
            stack.append(target)

# DOM references in the real loaded dependency graph.
dom_refs = set()
patterns = [
    r'getElementById\(["\']([A-Za-z0-9_-]+)["\']\)',
    r'\$\(["\']#([A-Za-z0-9_-]+)["\']\)',
    r'(?:setText|setHTML|drawLine)\(["\']([A-Za-z0-9_-]+)["\']',
]
for path in closure:
    source = path.read_text(encoding='utf-8')
    for pattern in patterns:
        dom_refs.update(re.findall(pattern, source))
missing_dom_ids = sorted(dom_refs - html_ids)

screen_ids = {node['id'] for node in soup.select('.screen[id]')}
go_targets = {node.get('data-go') for node in soup.select('[data-go]') if node.get('data-go')}
missing_screens = sorted(go_targets - screen_ids)

tab_ids = {node['id'][4:] for node in soup.select('.tab[id^="tab-"]')}
tab_targets = {node.get('data-tab') for node in soup.select('[data-tab]') if node.get('data-tab')}
missing_tabs = sorted(tab_targets - tab_ids)

# Runtime asset references: loaded JS graph + CSS + HTML.
runtime_sources = [html_text, Path('src/styles.css').read_text(encoding='utf-8')]
runtime_sources += [path.read_text(encoding='utf-8') for path in closure]
asset_refs = set()
for source in runtime_sources:
    asset_refs.update(re.findall(r'(?:\.\./)?(assets/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|avif|svg|ico|mp3|ogg|wav))', source, flags=re.I))
missing_runtime_assets = sorted(path for path in asset_refs if not Path(path).exists())

support_ids = {'toastLayer','fxLayer','audioPanel','tutorialOverlay','tutorialTitle','tutorialText','tutorialProgress','tutorialPrev','tutorialSkip','tutorialNext','tutorialClose','errorOverlay','errorText','errorBuild','returnToMenu','reloadGame'}
missing_support_ids = sorted(support_ids - html_ids)

json_files = ['meta/build.json','manifest.webmanifest','content/manifest.json']
json_errors = []
for name in json_files:
    try:
        json.loads(Path(name).read_text(encoding='utf-8'))
    except Exception as exc:
        json_errors.append({'file': name, 'error': str(exc)})

syntax_errors = []
for path in sorted(closure):
    proc = subprocess.run(['node','--check',str(path)], capture_output=True, text=True)
    if proc.returncode != 0:
        syntax_errors.append({'file': str(path.relative_to(ROOT)), 'error': proc.stderr.strip()})

version_files = ['src/core/build.js','meta/build.json','VERSAO.txt','content/manifest.json','meta/project_identity.json','meta/package.json','README.md','BUILD_SUMMARY.txt']
version_consistency = {name: VERSION in Path(name).read_text(encoding='utf-8') for name in version_files}
index_has_static_version = bool(re.search(r'v\d+\.\d+\.\d+|\d{2}/\d{2}/\d{4} \d{2}:\d{2}|Fase \d+ [•—-]', html_text))
index_module_scripts = [node.get('src') for node in soup.select('script[type="module"][src]')]

checks = {
    'entrypoint_is_game_js': index_module_scripts == ['src/game.js'],
    'no_missing_imports': not missing_imports,
    'javascript_syntax_valid': not syntax_errors,
    'no_duplicate_html_ids': not duplicate_ids,
    'no_missing_dom_ids': not missing_dom_ids,
    'all_data_go_targets_exist': not missing_screens,
    'all_data_tab_targets_exist': not missing_tabs,
    'support_layers_complete': not missing_support_ids,
    'runtime_assets_exist': not missing_runtime_assets,
    'json_files_valid': not json_errors,
    'canonical_version_consistent': all(version_consistency.values()),
    'index_has_no_static_build_identity': not index_has_static_version,
    'all_source_modules_loaded': set(ROOT.joinpath('src').rglob('*.js')) == closure,
    'active_project_identity_clean': not any(re.search(r'medical\s+simulator|medsim|prontu[aá]rio|pediatr|clinical content', p.read_text(encoding='utf-8', errors='ignore'), re.I) for p in [ROOT/'index.html', ROOT/'404.html', ROOT/'manifest.webmanifest', ROOT/'content/manifest.json', *ROOT.joinpath('content').rglob('*.json'), *ROOT.joinpath('src').rglob('*.js')]),
    'content_manifest_is_diplocraft': json.loads(Path('content/manifest.json').read_text(encoding='utf-8')).get('id') == 'diplocraft-core',
    'asset_lock_has_no_missing_paths': all(Path(p).exists() for p in json.loads(Path('meta/ASSET_PATH_LOCK.json').read_text(encoding='utf-8')).get('locked_paths', [])),
}

result = {
    'project': 'DIPLOCRAFT',
    'version': VERSION,
    'entrypoint': 'src/game.js',
    'loaded_module_count': len(closure),
    'loaded_modules': sorted(str(path.relative_to(ROOT)) for path in closure),
    'html_id_count': len(html_ids),
    'dom_reference_count': len(dom_refs),
    'runtime_asset_reference_count': len(asset_refs),
    'checks': checks,
    'details': {
        'missing_imports': missing_imports,
        'syntax_errors': syntax_errors,
        'duplicate_ids': duplicate_ids,
        'missing_dom_ids': missing_dom_ids,
        'missing_screens': missing_screens,
        'missing_tabs': missing_tabs,
        'missing_support_ids': missing_support_ids,
        'missing_runtime_assets': missing_runtime_assets,
        'json_errors': json_errors,
        'version_consistency': version_consistency,
        'index_has_static_version': index_has_static_version,
        'module_scripts': index_module_scripts,
    },
    'passed': all(checks.values()),
}
Path('tests/static-audit-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(0 if result['passed'] else 1)

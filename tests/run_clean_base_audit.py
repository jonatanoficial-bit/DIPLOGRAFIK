from pathlib import Path
from PIL import Image
import hashlib, json, re

ROOT=Path('.').resolve()
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
VERSION=CONFIG['version']
EXPECTED_DOCS={
 'docs/ARCHITECTURE.md','docs/GAME_DESIGN_DOCUMENT.md','docs/PHASE_2_CLEAN_BASE.md',
 'docs/ROADMAP_28_PHASES.md','docs/TESTING_PROTOCOL.md','docs/PHASE_3_BUILD_TRUTH.md',
 'docs/PHASE_4_ANTI_BREAK_CORE.md','docs/PHASE_5_TEST_FOUNDATION.md','docs/PHASE_6_ASSET_PIPELINE.md',
 'docs/PHASE_9_RESPONSIVE_DESKTOP.md','docs/PHASE_10_I18N_CORE.md','docs/PHASE_11_SCROLL_TOUCH_RECOVERY.md','docs/PHASE_12_LOCALIZATION_COMPLETE.md','docs/PHASE_13_SAVE_ARCHITECTURE.md','docs/PHASE_14_CORE_LOOP_2.md',
 'docs/ROADMAP_29_PHASES.md',
 'docs/history/AUDIT_REPORT_v1.0.1.md','docs/history/AUDIT_REPORT_v1.0.2.md',
 'docs/history/AUDIT_REPORT_v1.0.3.md','docs/history/AUDIT_REPORT_v1.0.4.md','docs/history/AUDIT_REPORT_v1.1.0.md'
}
ACTIVE_FILES=[ROOT/'index.html',ROOT/'404.html',ROOT/'manifest.webmanifest']
ACTIVE_FILES += list((ROOT/'src').rglob('*')) + list((ROOT/'content').rglob('*')) + [ROOT/'meta/build.json',ROOT/'meta/project_identity.json']
ACTIVE_FILES=[p for p in ACTIVE_FILES if p.is_file()]
forbidden=re.compile(r'medical\s+simulator|medsim|prontu[aá]rio|pediatr|resid[eê]ncia\s+cl[ií]nica|clinical\s+content',re.I)
contamination=[]
for p in ACTIVE_FILES:
    text=p.read_text(encoding='utf-8',errors='ignore')
    if forbidden.search(text): contamination.append(p.relative_to(ROOT).as_posix())

json_errors=[]
for p in ROOT.rglob('*.json'):
    try: json.loads(p.read_text(encoding='utf-8'))
    except Exception as e: json_errors.append({'path':p.relative_to(ROOT).as_posix(),'error':str(e)})

manifest=json.loads((ROOT/'meta/asset_manifest.json').read_text(encoding='utf-8'))
registered={x['path']:x for x in manifest['assets']}
actual={p.relative_to(ROOT).as_posix():p for p in (ROOT/'assets').rglob('*') if p.is_file()}
asset_errors=[]
for rel,p in actual.items():
    item=registered.get(rel)
    if not item: asset_errors.append({'path':rel,'error':'not registered'}); continue
    sha=hashlib.sha256(p.read_bytes()).hexdigest()
    if sha!=item['sha256']: asset_errors.append({'path':rel,'error':'hash mismatch'})
    if p.stat().st_size!=item['bytes']: asset_errors.append({'path':rel,'error':'size mismatch'})
    try:
        with Image.open(p) as im:
            if list(im.size)!=[item['width'],item['height']]: asset_errors.append({'path':rel,'error':'dimension mismatch'})
    except Exception as e: asset_errors.append({'path':rel,'error':f'image read: {e}'})
for rel in registered.keys()-actual.keys(): asset_errors.append({'path':rel,'error':'registered but missing'})

graph=json.loads((ROOT/'meta/dependency_graph.json').read_text(encoding='utf-8'))
docs={p.relative_to(ROOT).as_posix() for p in (ROOT/'docs').rglob('*') if p.is_file()}
legacy_files=['src/app.js','src/assets.js','src/core-build.js','content/dlc','favicon.ico']
build=json.loads((ROOT/'meta/build.json').read_text(encoding='utf-8'))
identity=json.loads((ROOT/'meta/project_identity.json').read_text(encoding='utf-8'))
content=json.loads((ROOT/'content/manifest.json').read_text(encoding='utf-8'))

checks={
 'no_active_contamination':not contamination,
 'all_json_valid':not json_errors,
 'asset_registry_exact':set(registered)==set(actual) and not asset_errors and len(actual)==manifest.get('registered_file_count'),
 'closed_dependency_graph':not graph.get('orphan_modules') and graph.get('source_file_count')==graph.get('loaded_module_count') and graph.get('loaded_module_count') >= 41,
 'curated_docs_only':docs==EXPECTED_DOCS,
 'legacy_files_removed':all(not (ROOT/p).exists() for p in legacy_files),
 'build_identity_consistent':build.get('version')==identity.get('current_version')==content.get('version')==VERSION,
 'canonical_source_declared':build.get('generated_from')==identity.get('canonical_build_source')=='build.config.json',
 'entrypoint_consistent':identity.get('entrypoint')==content.get('runtime_entry')=='src/game.js',
 'save_compatibility_declared':build.get('save_key_preserved')=='diplocraft_save_v101' and build.get('save_schema')==3,
}
result={'project':'DIPLOCRAFT','version':VERSION,'checks':checks,'details':{'contamination':contamination,'json_errors':json_errors,'asset_errors':asset_errors,'actual_asset_count':len(actual),'registered_asset_count':len(registered),'docs':sorted(docs),'legacy_files_present':[p for p in legacy_files if (ROOT/p).exists()],'dependency_graph':{'source_file_count':graph.get('source_file_count'),'loaded_module_count':graph.get('loaded_module_count'),'orphan_modules':graph.get('orphan_modules')}},'passed':all(checks.values())}
Path('tests/clean-base-audit-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(0 if result['passed'] else 1)

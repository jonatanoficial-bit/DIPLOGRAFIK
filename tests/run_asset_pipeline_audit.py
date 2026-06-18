#!/usr/bin/env python3
from pathlib import Path
from PIL import Image
try:
    import pillow_avif  # noqa: F401
except ImportError:
    pass
import hashlib, json, re

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
MANIFEST=json.loads((ROOT/'meta/asset_manifest.json').read_text(encoding='utf-8'))
assets=MANIFEST.get('assets',[])
registered={x['path']:x for x in assets}
actual={p.relative_to(ROOT).as_posix():p for p in (ROOT/'assets').rglob('*') if p.is_file()}
errors=[]

def digest(path):
    h=hashlib.sha256(); h.update(path.read_bytes()); return h.hexdigest()

for rel,path in actual.items():
    item=registered.get(rel)
    if not item:
        errors.append({'path':rel,'error':'not registered'}); continue
    if path.stat().st_size!=item.get('bytes'): errors.append({'path':rel,'error':'size mismatch'})
    if digest(path)!=item.get('sha256'): errors.append({'path':rel,'error':'hash mismatch'})
    try:
        with Image.open(path) as im:
            if list(im.size)!=[item.get('width'),item.get('height')]: errors.append({'path':rel,'error':'dimension mismatch'})
            fmt=im.format.lower() if im.format else ''
            if fmt!=item.get('format'): errors.append({'path':rel,'error':f'format mismatch {fmt}'})
    except Exception as exc:
        errors.append({'path':rel,'error':f'decode failed: {exc}'})
for rel in registered.keys()-actual.keys(): errors.append({'path':rel,'error':'registered but missing'})

runtime=[x for x in assets if x.get('role')=='runtime']
sources=[x for x in assets if x.get('role')=='source']
pwa_assets=[x for x in assets if x.get('role')=='pwa']
by=lambda **kw:[x for x in runtime if all(x.get(k)==v for k,v in kw.items())]

expected_counts={
 ('background','desktop','avif'):10,('background','desktop','webp'):10,
 ('background','mobile','avif'):10,('background','mobile','webp'):10,
 ('character','thumb','avif'):5,('character','thumb','webp'):5,
 ('character','display','avif'):5,('character','display','webp'):5,
 ('card','card','avif'):6,('card','card','webp'):6,
 ('icon','ui','avif'):1,('icon','ui','webp'):1,
 ('party','party','avif'):12,('party','party','webp'):12,
}
profile_counts={"/".join(k):len(by(category=k[0],profile=k[1],format=k[2])) for k in expected_counts}
profile_count_ok=all(profile_counts['/'.join(k)]==n for k,n in expected_counts.items())

expected_dimensions={
 ('background','desktop'):(1280,853),('background','mobile'):(720,960),
 ('character','thumb'):(320,320),('character','display'):(640,640),
 ('card','card'):(768,512),('icon','ui'):(960,409),('party','party'):(360,336),
}
dimensions_ok=all((x['width'],x['height'])==expected_dimensions[(x['category'],x['profile'])] for x in runtime)

budgets={
 ('background','desktop','webp'):200_000,('background','desktop','avif'):120_000,
 ('background','mobile','webp'):130_000,('background','mobile','avif'):75_000,
 ('character','thumb','webp'):15_000,('character','thumb','avif'):10_000,
 ('character','display','webp'):40_000,('character','display','avif'):30_000,
 ('card','card','webp'):70_000,('card','card','avif'):45_000,
 ('icon','ui','webp'):80_000,('icon','ui','avif'):45_000,
 ('party','party','webp'):65_000,('party','party','avif'):42_000,
}
budget_failures=[]
for item in runtime:
    key=(item['category'],item['profile'],item['format'])
    if item['bytes']>budgets[key]: budget_failures.append({'path':item['path'],'bytes':item['bytes'],'budget':budgets[key]})

source_total=sum(x['bytes'] for x in sources)
runtime_total=sum(x['bytes'] for x in runtime)
webp_total=sum(x['bytes'] for x in runtime if x['format']=='webp')
avif_total=sum(x['bytes'] for x in runtime if x['format']=='avif')
all_reduction=1-runtime_total/source_total
webp_reduction=1-webp_total/source_total

catalog=(ROOT/'src/data/assetCatalog.js').read_text(encoding='utf-8')
assets_core=(ROOT/'src/core/assets.js').read_text(encoding='utf-8')
avatars=(ROOT/'src/data/avatars.js').read_text(encoding='utf-8')
router=(ROOT/'src/core/router.js').read_text(encoding='utf-8')
styles=(ROOT/'src/styles.css').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
active_runtime='\n'.join([assets_core,avatars,router,styles,index])

checks={
 'registry_matches_assets_exactly':set(registered)==set(actual) and not errors,
 'source_count_34':len(sources)==34 and MANIFEST.get('source_asset_count')==34,
 'runtime_variant_count_98':len(runtime)==98 and MANIFEST.get('runtime_variant_count')==98,
 'pwa_asset_count_16':len(pwa_assets)==16 and MANIFEST.get('pwa_asset_count')==16,
 'profiles_complete':profile_count_ok,
 'dimensions_match_profiles':dimensions_ok,
 'all_files_decode':not any('decode failed' in e['error'] for e in errors),
 'all_runtime_files_within_budget':not budget_failures,
 'all_formats_total_reduction_at_least_85_percent':all_reduction>=.85,
 'single_format_reduction_at_least_90_percent':webp_reduction>=.90 and (1-avif_total/source_total)>=.90,
 'catalog_contains_avif_and_webp':'--desktop.avif' in catalog and '--mobile.webp' in catalog and '--thumb.avif' in catalog and '--party.avif' in catalog,
 'runtime_code_uses_catalog':'BACKGROUND_ASSETS' in assets_core and 'PARTY_ASSETS' in assets_core and 'CHARACTER_ASSETS' in avatars and 'TAB_BACKGROUND_KEYS' in router,
 'responsive_background_css_enabled':'var(--bg-mobile,var(--bg-desktop))' in styles,
 'avatar_lazy_loading_enabled':'loading="${loading}"' in assets_core and 'decoding="async"' in assets_core,
 'critical_preloads_present':'bg_global_map_v1--mobile.webp' in index and 'bg_global_map_v1--desktop.webp' in index,
 'no_direct_source_png_in_active_runtime':not re.search(r'assets/(?:backgrounds|characters)/[^"\']+\.png',active_runtime),
 'asset_path_lock_is_runtime_only':set(json.loads((ROOT/'meta/ASSET_PATH_LOCK.json').read_text(encoding='utf-8'))['locked_paths'])=={x['path'] for x in runtime},
 'pipeline_reproducible_files_present':all((ROOT/p).exists() for p in ['tools/build_assets.py','src/data/assetCatalog.js','meta/asset_manifest.json','manifest_assets.csv']),
}

result={
 'project':CONFIG['project'],'version':CONFIG['version'],'phase':CONFIG['stage_name'],
 'checks':checks,
 'metrics':{
   'source_assets':len(sources),'runtime_variants':len(runtime),'pwa_assets':len(pwa_assets),'registered_files':len(assets),
   'source_total_bytes':source_total,'runtime_total_all_formats':runtime_total,
   'webp_total_bytes':webp_total,'avif_total_bytes':avif_total,
   'all_formats_reduction_percent':round(all_reduction*100,2),
   'webp_reduction_percent':round(webp_reduction*100,2),
   'avif_reduction_percent':round((1-avif_total/source_total)*100,2),
   'max_runtime_asset_bytes':max(x['bytes'] for x in runtime),
   'profile_counts':profile_counts,
 },
 'details':{'file_errors':errors,'budget_failures':budget_failures},
 'passed':all(checks.values())
}
(ROOT/'tests/asset-pipeline-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if ok else 'FAIL'} {name}" for name,ok in checks.items()]
lines += [f"SOURCE {source_total/1024/1024:.2f} MB",f"RUNTIME ALL FORMATS {runtime_total/1024/1024:.2f} MB",f"REDUCTION {all_reduction*100:.2f}%",f"OVERALL {'PASS' if result['passed'] else 'FAIL'}"]
(ROOT/'tests/asset-pipeline-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

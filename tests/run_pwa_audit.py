#!/usr/bin/env python3
from pathlib import Path
from PIL import Image
import json, subprocess

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
MANIFEST=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
PWA_META=json.loads((ROOT/'meta/pwa.json').read_text(encoding='utf-8'))
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SW=(ROOT/'sw.js').read_text(encoding='utf-8')
PWA_JS=(ROOT/'src/core/pwa.js').read_text(encoding='utf-8')

def dimensions(path):
    with Image.open(path) as im:return f'{im.width}x{im.height}'

checks={};details={}
checks['manifest_identity']=MANIFEST.get('id')=='./' and MANIFEST.get('scope')=='./' and MANIFEST.get('start_url','').startswith('./index.html')
checks['manifest_fullscreen_fallbacks']=MANIFEST.get('display')=='fullscreen' and MANIFEST.get('display_override')==['fullscreen','standalone','minimal-ui'] and MANIFEST.get('orientation')=='any'
checks['manifest_colors']=MANIFEST.get('background_color')=='#03070b' and MANIFEST.get('theme_color')=='#03070b'
icons=MANIFEST.get('icons',[]);icon_results=[]
for item in icons:
    path=ROOT/item['src'];actual=dimensions(path) if path.exists() else None
    icon_results.append({'path':item['src'],'declared':item['sizes'],'actual':actual,'exists':path.exists(),'purpose':item.get('purpose')})
checks['manifest_icons_exist_and_match']=len(icons)>=3 and all(x['exists'] and x['declared']==x['actual'] for x in icon_results)
checks['manifest_has_any_and_maskable']=any('any' in x.get('purpose','') and x.get('sizes')=='512x512' for x in icons) and any('maskable' in x.get('purpose','') for x in icons)
screenshots=MANIFEST.get('screenshots',[]);screenshot_results=[]
for item in screenshots:
    path=ROOT/item['src'];actual=dimensions(path) if path.exists() else None
    screenshot_results.append({'path':item['src'],'declared':item['sizes'],'actual':actual,'exists':path.exists(),'form_factor':item.get('form_factor')})
checks['manifest_screenshots_match']=len(screenshots)==2 and all(x['exists'] and x['declared']==x['actual'] for x in screenshot_results)
checks['apple_meta_complete']=all(token in HTML for token in ['apple-mobile-web-app-capable','apple-mobile-web-app-status-bar-style','apple-touch-icon','apple-touch-startup-image'])
checks['pwa_ui_contract']=all(token in HTML for token in ['installAppBtn','pwaHealth','checkPwaUpdate','applyPwaUpdate','pwaUpdateBanner','networkStatus'])
checks['service_worker_generated']=SW.startswith('/* AUTO-GENERATED') and CONFIG['version'] in SW and PWA_META['cache_name'] in SW
checks['service_worker_syntax']=subprocess.run(['node','--check',str(ROOT/'sw.js')],capture_output=True).returncode==0
install_section=SW.split('self.addEventListener("install"',1)[1].split('self.addEventListener("activate"',1)[0]
checks['controlled_update_contract']='SKIP_WAITING' in SW and 'self.skipWaiting()' in SW and 'skipWaiting' not in install_section
checks['offline_strategies_present']=all(name in SW for name in ['networkFirst','cacheFirst','staleWhileRevalidate'])
checks['pwa_runtime_contract']=all(token in PWA_JS for token in ['beforeinstallprompt','appinstalled','registration.update()','controllerchange','updateViaCache: "none"','diplocraft:pwa-status'])
precache=PWA_META.get('precache',[]);missing=[x for x in precache if not (ROOT/x).exists()];heavy=[x for x in precache if x.startswith(('assets/backgrounds/','assets/characters/','assets/ui/'))]
checks['precache_paths_exist']=not missing and PWA_META.get('precache_count')==len(precache)
checks['precache_excludes_png_sources']=not heavy
checks['precache_has_app_shell']=all(x in precache for x in ['index.html','manifest.webmanifest','src/game.js','src/styles.css','assets/pwa/icon-192.png'])
pwa_bytes=sum((ROOT/x).stat().st_size for x in precache if x.startswith('assets/pwa/') and (ROOT/x).exists())
checks['pwa_identity_assets_budget']=pwa_bytes<2_000_000
simulation_proc=subprocess.run(['node','tests/pwa_service_worker_simulation.mjs'],cwd=ROOT,capture_output=True,text=True)
simulation=json.loads((ROOT/'tests/pwa-service-worker-simulation.json').read_text(encoding='utf-8')) if (ROOT/'tests/pwa-service-worker-simulation.json').exists() else {}
checks['service_worker_simulation_passes']=simulation_proc.returncode==0 and simulation.get('passed') is True
checks['simulation_precache_populated']=simulation.get('installed_count',0)>=PWA_META.get('precache_count',0)
checks['simulation_offline_navigation']=simulation.get('navigation_offline') is True
checks['simulation_offline_assets']=simulation.get('asset_offline') is True and simulation.get('module_offline') is True
checks['simulation_update_messages']=simulation.get('skipped') is True and simulation.get('version_message',{}).get('version')==CONFIG['version']
checks['simulation_old_cache_cleanup']=simulation.get('old_cache_removed') is True and simulation.get('claimed') is True

details={'icons':icon_results,'screenshots':screenshot_results,'missing_precache':missing,'heavy_source_precache':heavy,'precache_count':len(precache),'pwa_asset_bytes':pwa_bytes,'service_worker_simulation':simulation,'simulation_stdout':simulation_proc.stdout,'browser_note':'Navegação local por Playwright é bloqueada pela política administrativa do ambiente; o ciclo do worker foi validado em VM determinística, enquanto a interface continua coberta pelas suítes Playwright via harness.'}
result={'project':CONFIG['project'],'version':CONFIG['version'],'phase':CONFIG['stage_name'],'checks':checks,'details':details,'passed':all(checks.values())}
(ROOT/'tests/pwa-audit-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if value else 'FAIL'} {name}" for name,value in checks.items()];lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} {sum(checks.values())}/{len(checks)}")
(ROOT/'tests/pwa-audit-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8');print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

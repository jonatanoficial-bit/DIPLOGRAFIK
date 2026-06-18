#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
from urllib.parse import urlparse
import json, mimetypes, os, shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
checks = {}

vercel = json.loads((ROOT/'vercel.json').read_text(encoding='utf-8'))
checks['vercel_framework_static'] = vercel.get('framework') is None
checks['vercel_assets_headers'] = any(item.get('source') == '/assets/runtime/(.*)' for item in vercel.get('headers', []))
assets_js = (ROOT/'src/core/assets.js').read_text(encoding='utf-8')
checks['background_png_layer_present'] = 'return `${optimized}, ${fallback}`' in assets_js
checks['avatar_fallback_binding_present'] = 'data-fallback-src' in assets_js and 'activateImageFallback' in assets_js
sw = (ROOT/'sw.js').read_text(encoding='utf-8')
checks['service_worker_optional_precache'] = 'Promise.allSettled' in sw and 'critical shell unavailable' in sw
source_paths = [
    'assets/characters/char_leader_male_white_v1.png',
    'assets/characters/char_leader_male_black_v1.png',
    'assets/characters/char_leader_male_elder_v1.png',
    'assets/characters/char_leader_male_elder_refined_v1.png',
    'assets/characters/char_leader_latest_v1.png',
    'assets/backgrounds/bg_main_menu_presidential_office_v1.png',
    'assets/backgrounds/bg_global_map_v1.png'
]
checks['source_pngs_exist'] = all((ROOT/path).is_file() for path in source_paths)

html=(ROOT/'tests/harness.html').read_text(encoding='utf-8')
page_errors=[]
console_errors=[]
requested_sources=[]
requested_runtime=[]
with sync_playwright() as p:
    opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    executable=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    if executable: opts['executable_path']=executable
    browser=p.chromium.launch(**opts)
    page=browser.new_page(viewport={'width':1366,'height':768})
    page.on('pageerror', lambda err: page_errors.append(str(err)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' and 'Failed to load resource' not in msg.text else None)

    def route_asset(route):
        parsed=urlparse(route.request.url)
        path=parsed.path.lstrip('/')
        if path.startswith('assets/runtime/'):
            requested_runtime.append(path)
            route.fulfill(status=404, content_type='text/plain', body='optimized runtime intentionally unavailable')
            return
        candidate=ROOT/path
        if candidate.is_file() and path.startswith('assets/'):
            requested_sources.append(path)
            route.fulfill(status=200, content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream', body=candidate.read_bytes())
            return
        route.abort()

    page.route('https://diplocraft.invalid/**', route_asset)
    page.set_content(html, wait_until='domcontentloaded')
    page.wait_for_timeout(700)
    checks['app_boots_with_runtime_404'] = page.locator('#menu.active').count() == 1
    checks['background_has_source_fallback'] = '/assets/backgrounds/' in (page.locator('.bg-menu').get_attribute('data-asset-fallback') or '')
    checks['background_source_requested'] = any(path.startswith('assets/backgrounds/') and path.endswith('.png') for path in requested_sources)

    page.locator('[data-go="create"]').click()
    page.wait_for_timeout(1000)
    avatar_count=page.locator('#avatars img').count()
    natural=page.locator('#avatars img').evaluate_all('(els)=>els.map(img=>({width:img.naturalWidth,src:img.currentSrc,fallback:img.classList.contains("asset-fallback-active")}))')
    checks['five_avatars_render'] = avatar_count == 5
    checks['avatars_fall_back_to_png'] = avatar_count == 5 and all(x['width'] > 0 and '/assets/characters/' in x['src'] and x['src'].endswith('.png') for x in natural)
    checks['fallback_class_applied'] = avatar_count == 5 and all(x['fallback'] for x in natural)
    checks['runtime_failure_was_exercised'] = len(requested_runtime) >= 5

    page.locator('#startGame').click()
    page.wait_for_timeout(900)
    if page.locator('#tutorialOverlay.open').count(): page.locator('#tutorialSkip').click()
    hud=page.locator('#hudAvatar').evaluate('(img)=>({width:img.naturalWidth,src:img.currentSrc})')
    checks['hud_avatar_falls_back'] = hud['width'] > 0 and hud['src'].endswith('.png')
    checks['no_page_errors'] = not page_errors
    checks['no_console_errors'] = not console_errors
    browser.close()

result={
    'version':CONFIG['version'],
    'scenario':'all assets/runtime requests return HTTP 404 while source PNGs remain available',
    'checks':checks,
    'runtime_requests_intercepted':len(requested_runtime),
    'source_requests_fulfilled':len(requested_sources),
    'page_errors':page_errors,
    'console_errors':console_errors,
    'passed':all(checks.values()) and not page_errors and not console_errors
}
(ROOT/'tests/web-asset-audit-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(0 if result['passed'] else 1)

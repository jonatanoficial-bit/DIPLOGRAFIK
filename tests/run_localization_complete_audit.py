#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, re, shutil

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'build.config.json').read_text(encoding='utf-8'))
SEED = json.loads((ROOT / 'tools/i18n_seed.json').read_text(encoding='utf-8'))
HTML = (ROOT / 'tests/harness.html').read_text(encoding='utf-8')
I18N = (ROOT / 'src/core/i18n.js').read_text(encoding='utf-8')
entries = SEED['entries']
locales = SEED['locales']

pt_values = {str(v['pt-BR']).strip() for v in entries.values()}
pt_folded = {v.casefold() for v in pt_values}

# User-facing object fields in content modules must have an exact canonical phrase.
fields = r'name|title|text|desc|demand|skill|profile|leaning|personality|bloc|type|stance|label|topic|question|answer|detail'
technical_values = {
    'positive','negative','warning','info','neutral','ok','cosmetic','booster','simulation',
    'jornal','rádio','televisão','internacional','regional','mercado','social','segurança','economia',
    'agro','centro','conservador','futuro','crise','militar','popularidade','articulação','noticia',
    'debate','deal','sanction','interest','trade','demand','investment','inflation','technical'
}
uncovered = []
scanned_literals = 0
for path in sorted((ROOT / 'src/data').glob('*.js')):
    if path.name == 'assetCatalog.js':
        continue
    text = path.read_text(encoding='utf-8')
    for match in re.finditer(rf'\b({fields})\s*:\s*(["\'])(.*?)\2', text, re.S):
        value = match.group(3).strip()
        if not value or '${' in value:
            continue
        scanned_literals += 1
        if value.casefold() not in pt_folded and value not in technical_values:
            uncovered.append({'file': path.name, 'field': match.group(1), 'value': value})

key_sets = {
    locale: {key for key, record in entries.items() if isinstance(record.get(locale), str) and record[locale].strip()}
    for locale in locales
}
all_keys = set(entries)
translation_change_ratio = {}
for locale in ('en', 'es'):
    changed = sum(1 for record in entries.values() if record[locale].casefold() != record['pt-BR'].casefold())
    translation_change_ratio[locale] = changed / max(1, len(entries))

max_expansion = {'en': 0.0, 'es': 0.0}
for record in entries.values():
    base = max(1, len(record['pt-BR']))
    for locale in max_expansion:
        max_expansion[locale] = max(max_expansion[locale], len(record[locale]) / base)

static_checks = {
    'stage_declares_localization_complete': CONFIG.get('stage_number', 0) >= 12 and CONFIG.get('localization_complete', {}).get('enabled') is True,
    'three_editorial_locales': locales == ['pt-BR', 'en', 'es'],
    'catalog_key_parity': all(keys == all_keys for keys in key_sets.values()),
    'catalog_has_no_blank_values': all(all(isinstance(record.get(locale), str) and record[locale].strip() for locale in locales) for record in entries.values()),
    'catalog_has_editorial_scale': len(all_keys) >= 900,
    'lexical_fallback_disabled_in_config': CONFIG.get('i18n', {}).get('legacy_fallback') is False,
    'lexical_fallback_removed_from_runtime': 'replaceLexically' not in I18N and 'TERM_KEYS' not in I18N,
    'exact_translation_runtime_present': 'exactTranslation' in I18N and 'translatePattern' in I18N,
    'missing_translation_registry_present': 'getMissingTranslations' in I18N and 'clearMissingTranslations' in I18N,
    'canonical_feed_messages_enabled': 'message: canonical' in (ROOT / 'src/game.js').read_text(encoding='utf-8'),
    'dynamic_text_final_marker_present': 'data-i18n-final' in I18N and 'setLocalizedText' in (ROOT / 'src/ui/render.js').read_text(encoding='utf-8'),
    'all_user_facing_data_literals_covered': len(uncovered) == 0,
    'english_editorial_change_ratio': translation_change_ratio['en'] >= 0.65,
    'spanish_editorial_change_ratio': translation_change_ratio['es'] >= 0.60,
    'text_expansion_is_bounded': max_expansion['en'] <= 4.0 and max_expansion['es'] <= 4.0,
    'save_schema_preserved': CONFIG.get('save_schema') == 3 and CONFIG.get('save_key') == 'diplocraft_save_v101',
}

EXPECTED = {
    'en': {
        'law': 'Expanded Anti-Corruption Law',
        'country': 'United States',
        'crisis': 'Technical stabilization plan',
        'store': 'Starter Pack',
        'release': 'National regions',
        'government': 'Government',
        'next': 'Next event',
        'forbidden': ['Criar Líder', 'Nenhuma lei', 'Próximo evento', 'Localização editorial completa', 'Tesouro insuficiente']
    },
    'es': {
        'law': 'Ley Anticorrupción Ampliada',
        'country': 'Estados Unidos',
        'crisis': 'Plan técnico de estabilización',
        'store': 'Paquete Inicial',
        'release': 'Regiones nacionales',
        'government': 'Gobierno',
        'next': 'Próximo evento',
        'forbidden': ['Criar Líder', 'Nenhuma lei', 'Next event', 'Complete editorial localization', 'Tesouro insuficiente']
    }
}

LOCAL_STORAGE_POLYFILL = r'''(() => { const data=new Map(); const storage={getItem(k){k=String(k);return data.has(k)?data.get(k):null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))},clear(){data.clear()},key(i){return Array.from(data.keys())[i]??null},get length(){return data.size}};Object.defineProperty(window,'localStorage',{value:storage,configurable:true});})();'''

def launch_options():
    options = {'headless': True, 'args': ['--no-sandbox', '--disable-dev-shm-usage']}
    if os.getenv('PLAYWRIGHT_USE_BUNDLED_CHROMIUM') != '1':
        executable = os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
        if executable:
            options['executable_path'] = executable
    return options

def run_locale(browser, locale):
    expected = EXPECTED[locale]
    result = {'locale': locale, 'checks': {}, 'missing': [], 'console_errors': [], 'page_errors': [], 'overflow_tabs': []}
    context = browser.new_context(viewport={'width': 320, 'height': 568}, is_mobile=True, has_touch=True)
    page = context.new_page()
    page.set_default_timeout(8000)
    page.add_init_script(LOCAL_STORAGE_POLYFILL)
    page.on('console', lambda msg: result['console_errors'].append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda err: result['page_errors'].append(str(err)))
    page.set_content(HTML, wait_until='domcontentloaded')
    page.wait_for_timeout(700)
    page.locator('#menuLocaleSelect').select_option(locale)
    page.wait_for_timeout(120)
    page.locator('[data-go="create"]').click()
    page.wait_for_timeout(100)
    result['checks']['create_has_no_horizontal_overflow'] = page.evaluate("document.getElementById('create').scrollWidth <= document.getElementById('create').clientWidth + 3")
    page.locator('#startGame').click()
    page.wait_for_timeout(350)
    if page.locator('#tutorialOverlay.open').count():
        page.locator('#tutorialSkip').click()
    page.evaluate('window.DIPLOCRAFT_I18N.clearMissingTranslations()')
    tabs = page.locator('[data-tab]').evaluate_all("els => [...new Set(els.map(el => el.dataset.tab))]")
    tab_texts = {}
    for tab in tabs:
        page.evaluate("tab => document.querySelector('[data-tab=\"'+tab+'\"]')?.click()", tab)
        page.wait_for_timeout(45)
        overflow = page.evaluate("tab => { const el=document.getElementById('tab-' + tab); return el ? el.scrollWidth > el.clientWidth + 4 : false; }", tab)
        if overflow:
            result['overflow_tabs'].append(tab)
        panel = page.locator('#tab-' + tab)
        tab_texts[tab] = panel.inner_text() if panel.count() else ''
    body = page.locator('body').inner_text()
    all_runtime_text = '\n'.join(tab_texts.values()) + '\n' + body
    result['missing'] = page.evaluate('window.DIPLOCRAFT_I18N.getMissingTranslations()')
    result['checks']['zero_runtime_missing_translations'] = len(result['missing']) == 0
    result['checks']['all_fourteen_tabs_visited'] = len(tabs) == 14
    result['checks']['game_has_no_horizontal_overflow'] = not result['overflow_tabs'] and page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 4')
    result['checks']['government_navigation_localized'] = expected['government'] in all_runtime_text
    result['checks']['law_content_localized'] = expected['law'] in tab_texts.get('government', '')
    result['checks']['country_content_localized'] = expected['country'] in tab_texts.get('diplomacy', '')
    result['checks']['crisis_content_localized'] = expected['crisis'] in tab_texts.get('crisis', '')
    result['checks']['store_content_localized'] = expected['store'] in tab_texts.get('store', '')
    result['checks']['release_content_localized'] = expected['release'] in tab_texts.get('release', '')
    result['checks']['next_event_localized'] = expected['next'] in all_runtime_text
    result['checks']['no_residual_forbidden_phrases'] = all(term not in all_runtime_text for term in expected['forbidden'])
    result['checks']['html_lang_matches_locale'] = page.locator('html').get_attribute('lang') == locale
    result['checks']['locale_is_persisted_separately'] = page.evaluate("localStorage.getItem('diplocraft_locale_v1')") == locale
    leader_before = page.locator('#hudName').inner_text()
    date_before = page.locator('#dateHud').inner_text()
    target = 'es' if locale == 'en' else 'en'
    page.evaluate("target => window.DIPLOCRAFT_I18N.setLocale(target,{source:'localization-audit'})", target)
    page.wait_for_timeout(180)
    result['checks']['hot_switch_preserves_game_state'] = page.locator('#hudName').inner_text() == leader_before and page.locator('#dateHud').inner_text() == date_before
    result['checks']['hot_switch_changes_html_lang'] = page.locator('html').get_attribute('lang') == target
    result['checks']['no_console_errors'] = not result['console_errors']
    result['checks']['no_page_errors'] = not result['page_errors']
    result['passed'] = all(result['checks'].values())
    context.close()
    return result

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(**launch_options())
    runtime = [run_locale(browser, locale) for locale in ('en', 'es')]
    browser.close()

checks = {
    **static_checks,
    'all_runtime_locales_passed': all(item['passed'] for item in runtime),
    'runtime_missing_total_is_zero': sum(len(item['missing']) for item in runtime) == 0,
    'runtime_has_no_overflow_tabs': all(not item['overflow_tabs'] for item in runtime),
    'runtime_has_no_console_or_page_errors': all(not item['console_errors'] and not item['page_errors'] for item in runtime),
}
check_count = len(static_checks) + sum(len(item['checks']) for item in runtime) + 4
result = {
    'project': 'DIPLOCRAFT',
    'version': CONFIG['version'],
    'phase': CONFIG['stage_name'],
    'catalog_key_count': len(all_keys),
    'scanned_user_facing_literals': scanned_literals,
    'uncovered_literals': uncovered,
    'translation_change_ratio': translation_change_ratio,
    'maximum_text_expansion_ratio': max_expansion,
    'static_checks': static_checks,
    'runtime': runtime,
    'checks': checks,
    'check_count': check_count,
    'passed': all(checks.values()),
}
(ROOT / 'tests/localization-complete-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines = [f"{'PASS' if value else 'FAIL'} {key}" for key, value in static_checks.items()]
for item in runtime:
    lines.append(f"{'PASS' if item['passed'] else 'FAIL'} locale {item['locale']} ({sum(item['checks'].values())}/{len(item['checks'])}) • missing {len(item['missing'])} • overflow {len(item['overflow_tabs'])}")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {check_count} checks • {len(all_keys)} keys • {scanned_literals} content literals")
(ROOT / 'tests/localization-complete-output.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

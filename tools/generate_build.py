#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import argparse, hashlib, json, re, sys, unicodedata

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "build.config.json"

def dump_json(data):
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"

def validate(c):
    errors=[]
    if not re.fullmatch(r"\d+\.\d+\.\d+",str(c.get("version",""))): errors.append("version must be semver X.Y.Z")
    if not re.fullmatch(r"\d{2}/\d{2}/\d{4}",str(c.get("date",""))): errors.append("date must be DD/MM/YYYY")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}",str(c.get("date_iso",""))): errors.append("date_iso must be YYYY-MM-DD")
    if not re.fullmatch(r"\d{2}:\d{2}",str(c.get("time",""))): errors.append("time must be HH:MM")
    expected_stamp=c["date_iso"].replace("-","")+"_"+c["time"].replace(":","")
    if c.get("stamp")!=expected_stamp: errors.append(f"stamp must be {expected_stamp}")
    if int(c.get("stage_number",0))<1: errors.append("stage_number must be positive")
    if not c.get("project") or not c.get("stage_name") or not c.get("status"): errors.append("project/stage_name/status required")
    if errors: raise ValueError("; ".join(errors))

def derive(c,source_hash):
    normalized=unicodedata.normalize("NFKD", c["stage_name"]).encode("ascii","ignore").decode("ascii")
    stage_slug=re.sub(r"[^A-Z0-9]+","-",normalized.upper()).strip("-")
    artifact=f'{c["project"]}_v{c["version"]}_FASE-{c["stage_number"]}_{stage_slug}_build_{c["stamp"]}.zip'
    stage=f'Fase {c["stage_number"]} — {c["stage_name"]}'
    stage_short=f'Fase {c["stage_number"]} • {c["stage_name"]}'
    label=f'{c["project"]} v{c["version"]} • {c["date"]} {c["time"]} • {stage_short}'
    return {**c,"stage_slug":stage_slug,"stage":stage,"stage_short":stage_short,"label":label,"artifact":artifact,"source_sha256":source_hash}

def dependency_graph(entrypoint,source_hash,version):
    import_pattern=re.compile(r'(?:import\s+(?:[^;]*?\s+from\s+)?|export\s+[^;]*?\s+from\s+)["\']([^"\']+)["\']')
    entry=(ROOT/entrypoint).resolve(); closure=set(); edges=[]; stack=[entry]
    while stack:
        path=stack.pop()
        if path in closure: continue
        closure.add(path)
        for specifier in import_pattern.findall(path.read_text(encoding="utf-8")):
            if not specifier.startswith("."): continue
            target=(path.parent/specifier).resolve()
            if not target.suffix: target=target.with_suffix(".js")
            edges.append({"from":path.relative_to(ROOT).as_posix(),"to":target.relative_to(ROOT).as_posix()})
            if target.exists() and target not in closure: stack.append(target)
    source_files=set(ROOT.joinpath("src").rglob("*.js"))
    return {
      "generated_from":"build.config.json","source_sha256":source_hash,"project":"DIPLOCRAFT","version":version,
      "entrypoint":entrypoint,"source_file_count":len(source_files),"loaded_module_count":len(closure),
      "loaded_modules":sorted(p.relative_to(ROOT).as_posix() for p in closure),
      "orphan_modules":sorted(p.relative_to(ROOT).as_posix() for p in source_files-closure),
      "edges":sorted(edges,key=lambda x:(x["from"],x["to"]))
    }

def pwa_outputs(b,source_hash):
    manifest={
      "id":"./","name":b["product_name"],"short_name":b["project"],"version":b["version"],"build_source_sha256":source_hash,
      "description":b.get("manifest_description","Simulador de governo, economia, eleições, diplomacia, segurança e crises."),
      "lang":b["default_locale"],"dir":"ltr","start_url":"./index.html?source=pwa","scope":"./",
      "display":"fullscreen","display_override":["fullscreen","standalone","minimal-ui"],"orientation":"any",
      "background_color":"#03070b","theme_color":"#03070b","categories":["games","simulation","strategy"],
      "icons":[
        {"src":"assets/pwa/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
        {"src":"assets/pwa/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
        {"src":"assets/pwa/icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
      ],
      "screenshots":[
        {"src":"assets/pwa/screenshot-mobile-720x1280.png","sizes":"720x1280","type":"image/png","form_factor":"narrow","label":"DIPLOCRAFT no celular"},
        {"src":"assets/pwa/screenshot-desktop-1280x720.png","sizes":"1280x720","type":"image/png","form_factor":"wide","label":"DIPLOCRAFT no desktop"}
      ],
      "launch_handler":{"client_mode":"navigate-existing"},"prefer_related_applications":False
    }
    runtime=sorted(p.relative_to(ROOT).as_posix() for p in ROOT.joinpath("assets/runtime").rglob("*") if p.is_file())
    audio=sorted(p.relative_to(ROOT).as_posix() for p in ROOT.joinpath("assets/audio").rglob("*") if p.is_file())
    pwa=sorted(p.relative_to(ROOT).as_posix() for p in ROOT.joinpath("assets/pwa").rglob("*") if p.is_file())
    source=sorted(p.relative_to(ROOT).as_posix() for p in ROOT.joinpath("src").rglob("*") if p.is_file() and p.suffix in {".js",".css"})
    content=sorted(p.relative_to(ROOT).as_posix() for p in ROOT.joinpath("content").rglob("*.json"))
    precache=sorted(dict.fromkeys(["index.html","404.html","manifest.webmanifest","favicon.svg",*source,*content,*runtime,*pwa,*audio]))
    cache_name=f'diplocraft-shell-v{b["version"]}-{b["stamp"]}'
    js_urls=json.dumps(["./"+item for item in precache],ensure_ascii=False,indent=2)
    sw=f'''/* AUTO-GENERATED by tools/generate_build.py. DO NOT EDIT. */
const VERSION = {json.dumps(b["version"])};
const SOURCE_SHA256 = {json.dumps(source_hash)};
const CACHE_NAME = {json.dumps(cache_name)};
const CACHE_PREFIX = "diplocraft-";
const PRECACHE_URLS = {js_urls};

self.addEventListener("install", event => {{
  event.waitUntil((async () => {{
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(PRECACHE_URLS.map(async url => {{
      const response = await fetch(url, {{ cache: "reload" }});
      if (!response || !response.ok) throw new Error(`precache ${{url}}: ${{response?.status || "network"}}`);
      await cache.put(url, response.clone());
    }}));
    const shell = await cache.match("./index.html", {{ ignoreSearch: true }});
    if (!shell) throw new Error("DIPLOCRAFT critical shell unavailable");
    const optionalFailures = results.filter(item => item.status === "rejected").length;
    if (optionalFailures) console.warn(`[DIPLOCRAFT] ${{optionalFailures}} optional precache files unavailable; source fallbacks remain active.`);
  }})());
}});

self.addEventListener("activate", event => {{
  event.waitUntil((async () => {{
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  }})());
}});

async function networkFirst(request) {{
  const cache = await caches.open(CACHE_NAME);
  try {{
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  }} catch (_) {{
    return (await cache.match(request, {{ignoreSearch:true}})) || (await cache.match("./index.html")) || Response.error();
  }}
}}

async function cacheFirst(request) {{
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {{ const cache = await caches.open(CACHE_NAME); await cache.put(request,response.clone()); }}
  return response;
}}

async function staleWhileRevalidate(request) {{
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request).then(response => {{ if (response && response.ok) cache.put(request,response.clone()); return response; }}).catch(() => null);
  return cached || (await network) || Response.error();
}}

self.addEventListener("fetch", event => {{
  const request=event.request;
  if (request.method !== "GET") return;
  const url=new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {{ event.respondWith(networkFirst(request)); return; }}
  if (url.pathname.includes("/assets/runtime/") || url.pathname.includes("/assets/pwa/") || url.pathname.includes("/assets/audio/")) {{ event.respondWith(staleWhileRevalidate(request)); return; }}
  event.respondWith(cacheFirst(request));
}});

self.addEventListener("message", event => {{
  const type=event.data && event.data.type;
  if (type === "SKIP_WAITING") self.skipWaiting();
  if (type === "GET_VERSION" && event.ports && event.ports[0]) event.ports[0].postMessage({{version:VERSION,cache:CACHE_NAME}});
}});
'''
    meta={"generated_from":"build.config.json","source_sha256":source_hash,"version":b["version"],"service_worker":"sw.js","cache_name":cache_name,"precache_count":len(precache),"precache":precache,"offline_navigation_fallback":"index.html","controlled_updates":True,"manifest":"manifest.webmanifest","audio":b.get("audio")}
    return dump_json(manifest),sw,dump_json(meta)

def generated_files(c):
    validate(c)
    source_hash=hashlib.sha256(CONFIG_PATH.read_bytes()).hexdigest(); b=derive(c,source_hash)
    runtime={"project":b["project"],"productName":b["product_name"],"version":b["version"],"stageNumber":b["stage_number"],"stageName":b["stage_name"],"stage":b["stage"],"stageShort":b["stage_short"],"date":b["date"],"dateISO":b["date_iso"],"time":b["time"],"timezone":b["timezone"],"stamp":b["stamp"],"status":b["status"],"artifact":b["artifact"],"source":"build.config.json","sourceSHA256":source_hash,"saveSchema":b["save_schema"],"saveKey":b["save_key"],"defaultLocale":b["default_locale"],"supportedLocales":b["supported_locales"],"i18n":b.get("i18n"),"scrollTouchRecovery":b.get("scroll_touch_recovery"),"saveArchitecture":b.get("save_architecture"),"coreLoop2":b.get("core_loop_2"),"governmentCreation":b.get("government_creation"),"audio":b.get("audio"),"summary":b["summary"]}
    build_js='// AUTO-GENERATED by tools/generate_build.py from build.config.json. DO NOT EDIT.\nexport const BUILD = Object.freeze('+json.dumps(runtime,ensure_ascii=False,indent=2)+');\n\nexport const BUILD_LABEL = '+json.dumps(b["label"],ensure_ascii=False)+';\n'
    meta_build={"generated_from":"build.config.json","source_sha256":source_hash,"project":b["project"],"version":b["version"],"date":b["date"],"date_iso":b["date_iso"],"time":b["time"],"timezone":b["timezone"],"stamp":b["stamp"],"base":f'{b["project"]} v{b["base_version"]} — {b["base_stage"]}',"stage_number":b["stage_number"],"stage":b["stage"],"status":b["status"],"artifact":b["artifact"],"assets_folder_included":True,"asset_paths_changed":bool(b.get("asset_paths_changed",False)),"save_schema":b["save_schema"],"save_key_preserved":b["save_key"],"mobile_fullscreen":True,"mobile_priority":True,"features":b["features"],"asset_pipeline":b.get("asset_pipeline"),"mobile_first":b.get("mobile_first"),"pwa":b.get("pwa"),"responsive_desktop":b.get("responsive_desktop"),"i18n":b.get("i18n"),"scroll_touch_recovery":b.get("scroll_touch_recovery"),"audio":b.get("audio")}
    identity={"generated_from":"build.config.json","source_sha256":source_hash,"canonical_name":b["project"],"product_type":"political-geopolitical-simulator","edition":"International Development Build","current_version":b["version"],"current_phase":b["stage_number"],"current_stage":b["stage"],"default_language":b["default_locale"],"supported_languages":b["supported_locales"],"planned_languages":b["planned_locales"],"i18n":b.get("i18n"),"platform_priority":["mobile","tablet","desktop"],"entrypoint":b["entrypoint"],"canonical_build_source":"build.config.json","generated_runtime_build":"src/core/build.js","pwa_manifest":"manifest.webmanifest","service_worker":"sw.js"}
    content_manifest={"generated_from":"build.config.json","source_sha256":source_hash,"id":"diplocraft-core","name":"DIPLOCRAFT Core","version":b["version"],"build":b["stamp"],"content_schema":b["content_schema"],"default_locale":b["default_locale"],"supported_locales":b["supported_locales"],"runtime_entry":b["entrypoint"],"mode":"political-geopolitical-simulator","domains":["government","economy","elections","media","diplomacy","security","crises","progression"],"status":re.sub(r"[^a-z0-9]+","-",b["stage_name"].lower()).strip("-"),"audio":b.get("audio")}
    package={"generated_from":"build.config.json","source_sha256":source_hash,"artifact_filename":b["artifact"],"root_folder":f'{b["project"]}-v{b["version"]}-FASE-{b["stage_number"]}-{b["stage_slug"]}',"version":b["version"],"stage":b["stage"],"stamp":b["stamp"],"timezone":b["timezone"],"integrity_manifest":"meta/integrity.json","checksum_sidecar":b["artifact"].replace(".zip",".sha256")}
    version_txt=f'''AUTO-GENERATED — NÃO EDITAR MANUALMENTE\nFonte: build.config.json\nFonte SHA-256: {source_hash}\n\n{b["project"]}\nVersão: v{b["version"]}\nFase: {b["stage_number"]} — {b["stage_name"]}\nBuild: {b["date"]} {b["time"]} ({b["timezone"]})\nStatus: {b["status"]}\nArtefato: {b["artifact"]}\nSave schema: {b["save_schema"]} ({b["save_key"]})\n'''
    if b.get("audio") and b["audio"].get("theme"):
        version_txt += f'Áudio oficial: {b["audio"]["theme"]}\n'
    summary=f'''AUTO-GENERATED from build.config.json\n{b["project"]} v{b["version"]}\n{b["stage"]}\nBuild {b["date"]} {b["time"]} {b["timezone"]}\nStatus {b["status"]}\nArtefato {b["artifact"]}\nConfig SHA-256 {source_hash}\n\n{b["build_summary"]}\nPróxima fase: v{b["next_release"]["version"]} — {b["next_release"]["stage"]}.\n'''
    readme=f'''# {b["project"]} — {b["stage"]}\n\n> Arquivos de identidade são gerados de `build.config.json`.\n\n**Versão:** v{b["version"]}  \n**Build:** {b["date"]} {b["time"]} — {b["timezone"]}  \n**Status:** {b["status"]}; ainda não é a versão comercial final.  \n**Artefato esperado:** `{b["artifact"]}`\n**Config SHA-256:** `{source_hash}`\n\n## Executar\n\nSirva esta pasta por HTTP/HTTPS. Para teste local: `python -m http.server 8000`. A instalação PWA e o modo offline exigem HTTPS ou localhost; `file://` não é suportado.\n\n## PWA\n\n- Manifesto: `manifest.webmanifest`\n- Service worker: `sw.js`\n- Cache e precache: `meta/pwa.json`\n- Ícones e splash: `assets/pwa/`\n- Atualizações são controladas e só assumem a sessão após confirmação.\n\n## Compatibilidade\n\nSave schema {b["save_schema"]}, chave `{b["save_key"]}`, preservado.\n'''
    changelog=["# Changelog — DIPLOCRAFT","",f'## v{b["version"]} — {b["stage"]} — {b["date"]} {b["time"]}',""]
    for group,items in b["changelog"].items(): changelog += [f"### {group}"]+[f"- {x}" for x in items]+[""]
    for h in b["history"]: changelog += [f'## v{h["version"]} — {h["title"]} — {h["date_time"]}']+[f'- {x}' for x in h["items"]]+[""]
    rollback=f'''# Rollback — v{b["version"]}\n\n1. Preserve o save local quando possível.\n2. Substitua integralmente a pasta pela build `{b["project"]} v{b["base_version"]} — {b["base_stage"]}`.\n3. Não misture arquivos entre versões.\n4. Após rollback, remova o service worker antigo nas configurações do navegador ou recarregue online para ativar o cache da versão anterior.\n5. A chave `{b["save_key"]}` e o schema {b["save_schema"]} permanecem compatíveis.\n'''
    dep=dependency_graph(b["entrypoint"],source_hash,b["version"])
    expected={"version":b["version"],"stage_number":b["stage_number"],"status":b["status"],"stamp":b["stamp"],"artifact":b["artifact"],"source_sha256":source_hash}
    manifest,sw,pwa_meta=pwa_outputs(b,source_hash)
    return {
      "src/core/build.js":build_js,"meta/build.json":dump_json(meta_build),"meta/project_identity.json":dump_json(identity),
      "content/manifest.json":dump_json(content_manifest),"meta/package.json":dump_json(package),"meta/dependency_graph.json":dump_json(dep),
      "tests/expected-build.json":dump_json(expected),"VERSAO.txt":version_txt,"BUILD_SUMMARY.txt":summary,"README.md":readme,
      "CHANGELOG.md":"\n".join(changelog).rstrip()+"\n","ROLLBACK_INSTRUCTIONS.md":rollback,
      "manifest.webmanifest":manifest,"sw.js":sw,"meta/pwa.json":pwa_meta
    }

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--check",action="store_true"); args=parser.parse_args()
    c=json.loads(CONFIG_PATH.read_text(encoding="utf-8")); files=generated_files(c); drift=[]
    for rel,content in files.items():
        path=ROOT/rel
        if args.check:
            current=path.read_text(encoding="utf-8") if path.exists() else None
            if current!=content: drift.append(rel)
        else:
            path.parent.mkdir(parents=True,exist_ok=True); path.write_text(content,encoding="utf-8")
    if drift:
        print("BUILD DRIFT: "+", ".join(drift),file=sys.stderr); return 1
    print(("Build truth verified" if args.check else "Build artifacts generated")+f": v{c['version']}"); return 0

if __name__=="__main__": raise SystemExit(main())

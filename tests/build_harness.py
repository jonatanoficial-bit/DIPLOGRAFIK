from pathlib import Path
import base64
import json
import posixpath
import re

root = Path('.')
modules = {}
for path in root.joinpath('src').rglob('*.js'):
    key = '@/' + path.as_posix()
    source = path.read_text(encoding='utf-8')

    def rewrite(match):
        prefix, specifier, suffix = match.group(1), match.group(2), match.group(3)
        if specifier.startswith('.'):
            specifier = '@/' + posixpath.normpath(posixpath.join(path.parent.as_posix(), specifier))
        return prefix + specifier + suffix

    source = re.sub(r'(\bfrom\s*["\'])([^"\']+)(["\'])', rewrite, source)
    source = re.sub(r'(\bimport\s*["\'])([^"\']+)(["\'])', rewrite, source)
    encoded = base64.b64encode(source.encode('utf-8')).decode('ascii')
    modules[key] = 'data:text/javascript;base64,' + encoded

html = Path('index.html').read_text(encoding='utf-8')
css = Path('src/styles.css').read_text(encoding='utf-8')
html = re.sub(r'<link(?=[^>]*rel=["\']stylesheet["\'])(?=[^>]*href=["\']src/styles\.css["\'])[^>]*?/?>', f'<style>{css}</style>', html, count=1)
polyfill = '''<script>(()=>{const d=new Map();const s={getItem(k){k=String(k);return d.has(k)?d.get(k):null},setItem(k,v){d.set(String(k),String(v))},removeItem(k){d.delete(String(k))},clear(){d.clear()},key(i){return Array.from(d.keys())[i]??null},get length(){return d.size}};Object.defineProperty(window,"localStorage",{value:s,configurable:true});})();</script>'''
html = html.replace('<head>', '<head>' + polyfill, 1)
loader = '<script type="importmap">' + json.dumps({'imports': modules}) + '</script><script type="module">import "@/src/game.js";</script>'
html = re.sub(r'<script(?=[^>]*type=["\']module["\'])(?=[^>]*src=["\']src/game\.js["\'])[^>]*></script>', loader, html, count=1)
Path('tests/harness.html').write_text(html, encoding='utf-8')
print(f'Harness gerado com {len(modules)} módulos.')

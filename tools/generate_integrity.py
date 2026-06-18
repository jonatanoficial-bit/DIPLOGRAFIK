#!/usr/bin/env python3
from pathlib import Path
import hashlib, json

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
excluded = {'meta/integrity.json'}
files = []
for path in sorted(ROOT.rglob('*')):
    if not path.is_file():
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel in excluded or '__pycache__' in path.parts or path.suffix == '.pyc':
        continue
    data = path.read_bytes()
    files.append({'path': rel, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
root_material = ''.join(f"{x['path']}\0{x['bytes']}\0{x['sha256']}\n" for x in files).encode('utf-8')
manifest = {
  'project': config['project'], 'version': config['version'], 'build': config['stamp'],
  'algorithm': 'SHA-256', 'integrity_file_excluded': True,
  'file_count': len(files), 'total_bytes': sum(x['bytes'] for x in files),
  'root_hash': hashlib.sha256(root_material).hexdigest(), 'files': files
}
(ROOT/'meta/integrity.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({k:manifest[k] for k in ['project','version','build','file_count','total_bytes','root_hash']}, ensure_ascii=False, indent=2))

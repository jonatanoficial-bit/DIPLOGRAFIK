#!/usr/bin/env python3
from pathlib import Path
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
m=json.loads((ROOT/'meta/integrity.json').read_text(encoding='utf-8'))
errors=[]
listed={x['path']:x for x in m['files']}
actual={p.relative_to(ROOT).as_posix():p for p in ROOT.rglob('*') if p.is_file() and p.relative_to(ROOT).as_posix()!='meta/integrity.json' and '__pycache__' not in p.parts and p.suffix!='.pyc'}
for rel,item in listed.items():
    p=actual.get(rel)
    if not p: errors.append(f'missing: {rel}'); continue
    data=p.read_bytes()
    if len(data)!=item['bytes']: errors.append(f'size: {rel}')
    if hashlib.sha256(data).hexdigest()!=item['sha256']: errors.append(f'hash: {rel}')
for rel in actual.keys()-listed.keys(): errors.append(f'unlisted: {rel}')
material=''.join(f"{x['path']}\0{x['bytes']}\0{x['sha256']}\n" for x in m['files']).encode()
if hashlib.sha256(material).hexdigest()!=m['root_hash']: errors.append('root hash')
print(json.dumps({'file_count':len(listed),'actual_count':len(actual),'errors':errors,'passed':not errors},ensure_ascii=False,indent=2))
raise SystemExit(0 if not errors else 1)

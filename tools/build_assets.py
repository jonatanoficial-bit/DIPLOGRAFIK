#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageOps
try:
    import pillow_avif  # noqa: F401
except ImportError:
    pass
import csv, hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
RUNTIME = ASSETS / 'runtime'
CONFIG = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))

SOURCE_GROUPS = {
    'background': sorted((ASSETS/'backgrounds').glob('*.png')),
    'character': sorted((ASSETS/'characters').glob('*.png')),
    'card': sorted((ASSETS/'ui/cards').glob('*.png')),
    'icon': sorted((ASSETS/'icons').glob('*.png')),
    'party': sorted((ASSETS/'ui/parties').glob('*.png')),
}

PROFILES = {
    'background': [
        ('desktop', (1280, 853), 'cover', {'webp': 76, 'avif': 48}),
        ('mobile', (720, 960), 'cover', {'webp': 74, 'avif': 46}),
    ],
    'character': [
        ('thumb', (320, 320), 'cover', {'webp': 82, 'avif': 55}),
        ('display', (640, 640), 'cover', {'webp': 82, 'avif': 55}),
    ],
    'card': [
        ('card', (768, 512), 'cover', {'webp': 78, 'avif': 50}),
    ],
    'icon': [
        ('ui', (960, 409), 'contain', {'webp': 82, 'avif': 55}),
    ],
    'party': [
        ('party', (360, 336), 'cover', {'webp': 80, 'avif': 52}),
    ],
}

CATEGORY_DIR = {
    'background': 'backgrounds',
    'character': 'characters',
    'card': 'cards',
    'icon': 'icons',
    'party': 'parties',
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()


def transform(im: Image.Image, size: tuple[int,int], mode: str, category: str) -> Image.Image:
    im = im.convert('RGB')
    if mode == 'cover':
        centering = (0.5, 0.42) if category == 'background' else (0.5, 0.38)
        return ImageOps.fit(im, size, method=Image.Resampling.LANCZOS, centering=centering)
    contained = ImageOps.contain(im, size, method=Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', size, '#03070b')
    canvas.paste(contained, ((size[0]-contained.width)//2, (size[1]-contained.height)//2))
    return canvas


def save_variant(im: Image.Image, path: Path, fmt: str, quality: int):
    path.parent.mkdir(parents=True, exist_ok=True)
    if fmt == 'webp':
        im.save(path, 'WEBP', quality=quality, method=6, optimize=True)
    elif fmt == 'avif':
        im.save(path, 'AVIF', quality=quality, speed=6)
    else:
        raise ValueError(fmt)


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def immutable(value):
    return json.dumps(value, ensure_ascii=False, indent=2)


def main():
    if RUNTIME.exists():
        shutil.rmtree(RUNTIME)
    RUNTIME.mkdir(parents=True)

    manifest_assets = []
    catalog = {'backgrounds': {}, 'characters': {}, 'cards': {}, 'icons': {}, 'parties': {}}
    source_total = 0
    runtime_total = 0

    for category, sources in SOURCE_GROUPS.items():
        for source in sources:
            with Image.open(source) as im:
                width, height = im.size
                source_total += source.stat().st_size
                source_item = {
                    'path': rel(source), 'role': 'source', 'category': category,
                    'bytes': source.stat().st_size, 'width': width, 'height': height,
                    'format': source.suffix.lstrip('.').lower(), 'sha256': sha256(source),
                    'runtime': False, 'status': 'source-preserved'
                }
                manifest_assets.append(source_item)
                entry = {'source': rel(source), 'source_sha256': source_item['sha256'], 'variants': {}}
                for profile, size, mode, qualities in PROFILES[category]:
                    transformed = transform(im, size, mode, category)
                    entry['variants'][profile] = {}
                    for fmt in ('avif', 'webp'):
                        out = RUNTIME / CATEGORY_DIR[category] / f'{source.stem}--{profile}.{fmt}'
                        save_variant(transformed, out, fmt, qualities[fmt])
                        runtime_total += out.stat().st_size
                        variant = {
                            'path': rel(out), 'role': 'runtime', 'category': category,
                            'profile': profile, 'bytes': out.stat().st_size,
                            'width': size[0], 'height': size[1], 'format': fmt,
                            'sha256': sha256(out), 'runtime': True, 'status': 'optimized'
                        }
                        manifest_assets.append(variant)
                        entry['variants'][profile][fmt] = rel(out)
                target_group = {
                    'background':'backgrounds','character':'characters','card':'cards','icon':'icons','party':'parties'
                }[category]
                catalog[target_group][source.stem] = entry

    # PWA installation assets are generated separately and registered here without
    # changing the 22 source / 74 gameplay runtime pipeline counts.
    pwa_assets = sorted((ASSETS/'pwa').glob('*.png'))
    for pwa_path in pwa_assets:
        with Image.open(pwa_path) as im:
            manifest_assets.append({
                'path': rel(pwa_path), 'role': 'pwa', 'category': 'pwa', 'profile': 'install',
                'bytes': pwa_path.stat().st_size, 'width': im.width, 'height': im.height,
                'format': pwa_path.suffix.lstrip('.').lower(), 'sha256': sha256(pwa_path),
                'runtime': False, 'status': 'pwa-generated'
            })

    manifest_assets.sort(key=lambda x: x['path'])
    reduction = 1 - (runtime_total / source_total) if source_total else 0
    manifest = {
        'generated_by': 'tools/build_assets.py',
        'project': CONFIG['project'], 'version': CONFIG['version'],
        'phase': CONFIG['stage_name'], 'build_stamp': CONFIG['stamp'],
        'source_asset_count': sum(len(v) for v in SOURCE_GROUPS.values()),
        'runtime_variant_count': sum(1 for x in manifest_assets if x.get('role') == 'runtime'),
        'pwa_asset_count': sum(1 for x in manifest_assets if x.get('role') == 'pwa'),
        'registered_file_count': len(manifest_assets),
        'source_total_bytes': source_total,
        'runtime_total_bytes_all_formats': runtime_total,
        'all_format_reduction_ratio': round(reduction, 6),
        'strategy': 'AVIF first, WebP fallback; responsive desktop/mobile backgrounds; lazy avatar thumbnails',
        'assets': manifest_assets,
        'catalog': catalog,
    }
    (ROOT/'meta/asset_manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

    audit = {
        'project': CONFIG['project'], 'version': CONFIG['version'],
        'source_assets': manifest['source_asset_count'],
        'runtime_variants': manifest['runtime_variant_count'],
        'pwa_assets': manifest['pwa_asset_count'],
        'source_total_bytes': source_total,
        'runtime_total_bytes_all_formats': runtime_total,
        'reduction_percent_all_formats': round(reduction*100, 2),
        'profiles': PROFILES,
        'status': 'generated'
    }
    (ROOT/'meta/asset_audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

    locked = [x['path'] for x in manifest_assets if x.get('role') == 'runtime']
    lock = {
        'generated_by':'tools/build_assets.py', 'version':CONFIG['version'],
        'policy':'Runtime paths are immutable inside this build. Source PNGs are provenance only.',
        'locked_paths': locked
    }
    (ROOT/'meta/ASSET_PATH_LOCK.json').write_text(json.dumps(lock, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

    with (ROOT/'manifest_assets.csv').open('w', newline='', encoding='utf-8') as f:
        fields=['path','role','category','profile','format','bytes','width','height','sha256','status']
        w=csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for item in manifest_assets:
            w.writerow({k:item.get(k,'') for k in fields})

    # Runtime catalog consumed by the game. It contains no generated timestamps.
    js = '// AUTO-GENERATED by tools/build_assets.py. DO NOT EDIT.\n'
    js += 'export const ASSET_CATALOG = Object.freeze(' + immutable(catalog) + ');\n'
    js += 'export const BACKGROUND_ASSETS = Object.freeze(ASSET_CATALOG.backgrounds);\n'
    js += 'export const CHARACTER_ASSETS = Object.freeze(ASSET_CATALOG.characters);\n'
    js += 'export const CARD_ASSETS = Object.freeze(ASSET_CATALOG.cards);\n'
    js += 'export const ICON_ASSETS = Object.freeze(ASSET_CATALOG.icons);\n'
    js += 'export const PARTY_ASSETS = Object.freeze(ASSET_CATALOG.parties);\n'
    (ROOT/'src/data/assetCatalog.js').write_text(js, encoding='utf-8')

    print(json.dumps({
        'source_assets': manifest['source_asset_count'],
        'runtime_variants': manifest['runtime_variant_count'],
        'pwa_assets': manifest['pwa_asset_count'],
        'registered_files': manifest['registered_file_count'],
        'source_mb': round(source_total/1024/1024,2),
        'runtime_all_formats_mb': round(runtime_total/1024/1024,2),
        'reduction_percent_all_formats': round(reduction*100,2),
    }, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()

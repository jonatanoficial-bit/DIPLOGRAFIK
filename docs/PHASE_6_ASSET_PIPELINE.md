# Fase 6 — Asset Pipeline

A v1.1.1 transforma os 22 PNGs originais em um catálogo reproduzível de variantes de runtime.

## Perfis

- Fundos desktop: 1280×853 em AVIF e WebP.
- Fundos mobile: 720×960 em AVIF e WebP, com recorte vertical controlado.
- Avatares: 320×320 para seleção e 640×640 para HUD/save.
- Cartões: 768×512.
- Folha de ícones: 960×409.

Os PNGs originais permanecem no pacote apenas como fontes de reconstrução. A aplicação carrega AVIF quando suportado e usa WebP como fallback.

## Regra anti-quebra

`python3 tools/build_assets.py` regenera o catálogo e os manifests. `python3 tests/run_asset_pipeline_audit.py` bloqueia a build por falta de arquivo, hash divergente, dimensão incorreta, formato inesperado ou budget excedido.

# Fase 3 — Build Truth

## Objetivo

Impedir que versão, data, hora, fase, status ou nome de pacote sejam mantidos manualmente em vários pontos do projeto.

## Fonte única

`build.config.json` é o único arquivo editável para identidade da build. `tools/generate_build.py` valida essa configuração e gera:

- `src/core/build.js`;
- `meta/build.json`;
- `meta/project_identity.json`;
- `meta/package.json`;
- `content/manifest.json`;
- `VERSAO.txt`, `BUILD_SUMMARY.txt`, `README.md`, `CHANGELOG.md` e rollback;
- expectativa automatizada dos testes.

## Proteções

- validação de SemVer, data, hora e timestamp;
- nome do ZIP derivado, não digitado;
- SHA-256 da configuração em todos os artefatos essenciais;
- HTML sem versão fixa;
- `python tools/generate_build.py --check` retorna erro quando há drift;
- auditoria Build Truth compara todos os outputs antes da compactação.

## Compatibilidade

Nenhuma regra de gameplay foi alterada. Save schema 1 e chave `diplocraft_save_v101` foram preservados.

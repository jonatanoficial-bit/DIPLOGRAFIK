# Relatório de Auditoria — DIPLOCRAFT v1.0.3

**Fase:** 3 — Build Truth  
**Build:** 12/06/2026 16:36 — America/Sao_Paulo  
**Base anterior:** v1.0.2 — Fase 2 Clean Base  
**Resultado:** APROVADA NO ESCOPO DA FASE 3

## Objetivo auditado

Eliminar fontes concorrentes de versão e impedir que interface, metadados, documentação ou pacote sejam publicados com identidades divergentes.

## Implementação

A única fonte editável da identidade da build é `build.config.json`. O gerador `tools/generate_build.py` valida e produz automaticamente:

- `src/core/build.js` usado pelo jogo;
- `meta/build.json`, `meta/project_identity.json` e `meta/package.json`;
- `content/manifest.json` e `meta/dependency_graph.json`;
- `VERSAO.txt`, `BUILD_SUMMARY.txt`, `README.md`, `CHANGELOG.md` e rollback;
- `tests/expected-build.json`.

O HTML não contém versão, fase, data ou hora fixas. Menu, ribbon, HUD, título da página e aba Release recebem os dados do módulo gerado.

## Identidade canônica

- Versão: `1.0.3`
- Fase: `3 — Build Truth`
- Status: `BUILD_TRUTH_TESTED`
- Timestamp: `20260612_1636`
- Artefato derivado: `DIPLOCRAFT_v1.0.3_FASE-3_BUILD-TRUTH_build_20260612_1636.zip`
- Fonte SHA-256: `e68135db8ba8e12c66b5c9113dfba21d1ac6172c2feaf55c246210ff5b434ff2`
- Save preservado: schema `1`, chave `diplocraft_save_v101`

## Resultado dos testes

### Build Truth

- 15 de 15 verificações aprovadas.
- SemVer, data, hora e timestamp coerentes.
- Nome do pacote derivado automaticamente.
- Hash da configuração idêntico nos outputs essenciais.
- Gerador reproduzível em modo `--check`.
- HTML sem identidade de build gravada manualmente.

### Teste de adulteração controlada

`VERSAO.txt` recebeu temporariamente uma alteração manual. O gerador recusou a build com a mensagem `BUILD DRIFT: VERSAO.txt`. O arquivo foi restaurado e a validação voltou a aprovar. Resultado: **PASS**.

### Auditoria estática

- 16 de 16 verificações aprovadas.
- 37 de 37 módulos carregados.
- 0 módulos órfãos.
- 0 imports ausentes.
- 0 erros de sintaxe JavaScript.
- 145 IDs HTML e 121 referências de DOM validados.
- 15 referências de assets de runtime, todas existentes.
- 0 caminhos bloqueados ausentes.

### Higiene da base

- 10 de 10 verificações aprovadas.
- 22 de 22 assets registrados e íntegros.
- Nenhuma contaminação ativa de outro projeto.
- Identidade, entrypoint e save compatíveis.

### Navegador e responsividade

Foram executadas 100 verificações funcionais, 25 em cada perfil:

- Mobile 360×640: PASS.
- Mobile 390×844: PASS.
- Tablet 768×1024: PASS.
- Desktop 1366×768: PASS.

Foram validados boot, menu, criação, rolagem, início de partida, tutorial, 13 abas, avanço de dia, save, quarentena de save corrompido, áudio, error boundary, drawer mobile, título gerado, identidade da aba Release, nome do artefato e hash da fonte.

## Alterações de gameplay

Nenhuma regra de gameplay foi alterada nesta fase. O foco foi engenharia de release, proveniência e bloqueio de divergências. A compatibilidade dos saves das fases 1 e 2 foi mantida.

## Limites conhecidos

Esta aprovação não representa produto comercial final. Profundidade sistêmica, balanceamento, internacionalização completa, PWA offline, acessibilidade e demais sistemas AAA continuam nas fases planejadas.

## Conclusão

**FASE 3 APROVADA.** A build possui uma única fonte verificável de identidade e está liberada para a Fase 4 — Anti-Break Core.

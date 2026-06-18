# Relatório de Auditoria — DIPLOCRAFT v1.0.2

**Fase:** 2 — Clean Base  
**Build:** 12/06/2026 16:26 — America/Sao_Paulo  
**Base anterior:** v1.0.1 — Fase 1 Recovery  
**Resultado:** APROVADA NO ESCOPO DA FASE 2

## Objetivo auditado

Eliminar resíduos de outro produto, fechar o grafo real do código, consolidar a identidade DIPLOCRAFT e preservar integralmente o funcionamento recuperado na Fase 1.

## Limpeza executada

- Removidos `src/app.js`, `src/assets.js` e `src/core-build.js`, que eram paralelos ou duplicados e não pertenciam ao runtime.
- Removidos dois pacotes DLC, três manifestos clínicos e a estrutura de conteúdo não relacionada.
- Removidos ou substituídos mais de 40 documentos antigos, conflitantes ou contaminados.
- O relatório da Fase 1 foi preservado apenas em `docs/history/` para rastreabilidade.
- Corrigidos `404.html`, `manifest.webmanifest`, favicon, README, changelog, versão e identidade do projeto.
- Recriados `content/manifest.json`, campanha-base e desbloqueios com domínio político/geopolítico.

## Código e grafo de dependências

- Arquivos JavaScript em `src`: **37**.
- Módulos alcançados por `src/game.js`: **37**.
- Módulos órfãos: **0**.
- Imports ausentes: **0**.
- Erros de sintaxe: **0**.
- IDs HTML: **145**.
- Referências de DOM auditadas: **121**.
- IDs ausentes ou duplicados: **0**.

## Higiene e identidade

A auditoria pesquisou código, conteúdo, HTML e metadados ativos por identificadores do projeto anterior. Resultado:

- resíduos ativos encontrados: **0**;
- arquivos legados proibidos presentes: **0**;
- JSONs inválidos: **0**;
- identidade divergente entre build, conteúdo e projeto: **0**.

## Assets

- Assets presentes e registrados: **22**.
- Assets ausentes no registro: **0**.
- Caminhos bloqueados ausentes: **0**.
- Divergências de SHA-256, tamanho ou dimensões: **0**.
- Referências de assets usadas pelo runtime: **15**, todas encontradas.

A Fase 2 não comprime ou reconverte imagens; essa otimização permanece reservada para a Fase 6 — Asset Pipeline.

## Regressão funcional

| Perfil | Resultado | Criação rolável | Todas as abas | Save | Anti-quebra |
|---|---|---|---|---|---|
| Mobile 360×640 | Aprovado | Sim | Sim | Sim | Sim |
| Mobile 390×844 | Aprovado | Sim | Sim | Sim | Sim |
| Tablet 768×1024 | Aprovado | Sim | Sim | Sim | Sim |
| Desktop 1366×768 | Aprovado | Sim | Sim | Sim | Sim |

Em cada perfil foram aprovados boot, menu, novo jogo, alcance do botão inicial, tutorial automático/manual, 13 abas, avanço de dia, criação de save, isolamento de save corrompido, aviso de storage, áudio, error boundary e recuperação ao menu. No mobile, abertura e fechamento do drawer também foram aprovados.

## Compatibilidade de save

O `saveSchema` permanece em **1** e a chave `diplocraft_save_v101` foi preservada deliberadamente. Isso evita perda de progresso ao atualizar da Fase 1 para a Fase 2.

## Limitações que continuam abertas

- Profundidade e balanceamento do gameplay ainda são de protótipo.
- Explorações de leis, tratados, orçamento, eleições e recompensas ainda serão tratadas no Core Loop 2.0.
- PWA/offline e ícones instaláveis ainda não estão concluídos.
- Internacionalização em português, inglês e espanhol ainda não foi implementada.
- Os PNGs continuam pesados para distribuição mobile.
- A build ainda não deve ser apresentada como produto comercial final ou Release Candidate.

## Arquivos de evidência

- `tests/static-audit-results.json`
- `tests/browser-results.json`
- `tests/clean-base-audit-results.json`
- `meta/dependency_graph.json`
- `meta/asset_manifest.json`
- `meta/integrity.json`

## Próxima fase

**Fase 3 — Build Truth:** automatizar a geração de versão, data, hora, rótulos da interface, metadados, changelog e nome do ZIP a partir de uma única configuração, bloqueando divergências antes da compactação.

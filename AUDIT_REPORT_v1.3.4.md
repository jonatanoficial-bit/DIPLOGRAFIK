# Auditoria — DIPLOCRAFT v1.3.4

**Fase:** 12 — Localization Complete  
**Build:** 17/06/2026 11:33 — America/Sao_Paulo  
**Status:** `LOCALIZATION_COMPLETE_VERIFIED`

## Escopo concluído

A Fase 12 substitui a tradução lexical temporária por localização editorial explícita em português do Brasil, inglês e espanhol. O runtime passou a trabalhar com frases canônicas, traduções exatas, padrões localizados para valores dinâmicos e registro bloqueante de conteúdo sem tradução.

## Entregas

- 964 chaves com paridade integral entre `pt-BR`, `en` e `es`;
- 414 literais de conteúdo jogável cobertos por tradução canônica;
- eventos, crises, países, economia, governo, imprensa, eleições, segurança, progressão, loja simulada, PWA e mensagens de sistema revisados;
- fallback genérico palavra por palavra removido;
- troca de idioma durante a partida sem alterar líder, data, indicadores ou save;
- datas, números, listas, percentuais e valores dinâmicos formatados por locale;
- feed e feedback armazenam mensagem canônica e traduzem apenas na apresentação;
- registro de traduções ausentes disponível para testes e diagnóstico;
- expansão de texto validada em celular de 320 px, landscape, tablet, notebook e ultrawide;
- correção de overflow na aba Release para hash e nome longo do pacote.

## Auditoria de localização

- Auditoria I18N Core: **74/74**;
- Auditoria Localization Complete: **56/56**;
- Chaves de catálogo: **964**;
- Traduções ausentes no runtime: **0**;
- Abas visitadas por idioma: **13/13** em inglês e espanhol;
- Literais jogáveis inspecionados: **414**;
- Proporção de entradas diferentes do português: inglês **95,23%**, espanhol **85,27%**;
- Maior expansão relativa observada: inglês **3,00×**, espanhol **3,77×**;
- Overflow horizontal nos testes de localização: **0**.

## Quality gate consolidado

- Suítes: **17/17**;
- Verificações: **919/919**;
- Módulos ativos: **49/49**;
- Módulos órfãos: **0**;
- Imports ausentes: **0**;
- Erros JavaScript: **0**;
- Assets registrados: **112/112**.

### Regressões preservadas

- navegador geral: **168/168**;
- mobile-first: **149/149**;
- desktop responsivo: **101/101**;
- scroll e touch: **217/217**;
- PWA: **23/23**;
- anti-quebra: **19/19**;
- asset pipeline: **18/18**;
- recuperação de assets web: **16/16**;
- testes Node: **18/18**;
- matriz determinística: **129.600 dias**, sem `NaN`, infinito, data inválida ou corrupção estrutural.

## Compatibilidade

- save schema mantido em **2**;
- chave de save preservada: `diplocraft_save_v101`;
- preferência de idioma armazenada separadamente em `diplocraft_locale_v1`;
- compatibilidade com saves da v1.3.3 e fases anteriores preservada;
- PWA, cache versionado, modo seguro, snapshots e fallback de assets web continuam ativos.

## Alertas não bloqueantes

- A revisão foi implementada tecnicamente e editorialmente no projeto, mas uma publicação comercial internacional ainda deve receber leitura final de falantes nativos e revisão jurídica dos termos políticos de cada mercado.
- Nomes digitados pelo jogador, siglas partidárias oficiais e determinados nomes próprios não são traduzidos por design.
- Partidas totalmente ociosas ainda podem convergir para colapso institucional, dívida e tensão global máximas. Esse problema pertence às futuras fases de reconstrução do core loop e balanceamento.

# Relatório de Auditoria — DIPLOCRAFT v1.3.1

## Identificação

- **Fase:** 10 — I18N Core
- **Build:** 13/06/2026 12:50 — America/Sao_Paulo
- **Status:** `I18N_CORE_VERIFIED`
- **Artefato:** `DIPLOCRAFT_v1.3.1_FASE-10_I18N-CORE_build_20260613_1250.zip`
- **Base:** DIPLOCRAFT v1.3.0 — Fase 9 Responsive Desktop
- **Save:** schema 2, chave `diplocraft_save_v101`, compatível com as builds anteriores

## Escopo executado

A Fase 10 implantou a arquitetura internacional do DIPLOCRAFT com português do Brasil, inglês e espanhol. O idioma pode ser alterado no menu ou durante uma partida sem recarregar a aplicação e sem modificar o save da carreira. Mobile-first, desktop responsivo, PWA, cache offline, assets otimizados, snapshots e Anti-Break Core foram preservados.

## Arquitetura I18N

- Fonte canônica: `tools/i18n_seed.json`
- Gerador determinístico: `tools/generate_i18n.py`
- Runtime: `src/core/i18n.js`
- Catálogos: `src/i18n/locales/pt-BR.js`, `en.js` e `es.js`
- Metadados: `meta/i18n.json`
- Auditoria bloqueante: `tests/run_i18n_audit.py`
- Chaves catalogadas: **321**
- Paridade entre idiomas: **100%**
- Idioma padrão: `pt-BR`
- Persistência independente: `diplocraft_locale_v1`

## Recursos validados

- Seletores sincronizados no menu e no centro de comando.
- Troca de idioma em tempo real durante uma partida ativa.
- Preservação de líder, data, save e estado ao alternar idioma.
- Atualização automática de `html lang`.
- Tradução de textos, placeholders, títulos, ARIA e conteúdo renderizado.
- Formatação regional de números, datas e listas com `Intl`.
- Tradução do onboarding, navegação, HUD, tutorial, mensagens centrais, PWA e tela anti-quebra.
- Restauração do texto canônico antes de cada nova tradução, evitando traduções acumuladas.
- Catálogos incluídos no precache offline da PWA.

## Auditoria I18N dedicada

- Contratos estáticos: **20/20**
- Português do Brasil: **17/17**
- Inglês: **17/17**
- Espanhol: **17/17**
- Verificações consolidadas adicionais: **3/3**
- Total dedicado: **74/74**

Foram testados menu, criação de líder, ARIA, placeholders, formatação numérica, HUD, navegação, cards dinâmicos, templates, tutorial e troca de idioma durante a partida, sem erros de console ou página.

## Auditoria consolidada

- **14/14 suítes aprovadas**
- **630/630 verificações aprovadas**
- **48/48 módulos ativos**
- **0 módulos órfãos**
- **182 IDs HTML verificados**
- **156 referências de DOM resolvidas**
- **112 assets registrados**
- **146 itens no precache PWA**

### Regressão geral

- Mobile 360×640: 42/42
- Mobile 390×844: 42/42
- Tablet 768×1024: 42/42
- Desktop 1366×768: 42/42
- Total: **168/168**

### Auditoria mobile dedicada

- Phone 320×568: 28/28
- Phone 360×640: 28/28
- Phone 390×844: 28/28
- Phone 844×390 landscape: 28/28
- Tablet 768×1024: 28/28
- Contratos estáticos: 9/9
- Total: **149/149**

### Auditoria desktop dedicada

- Tablet landscape 1024×768: 23/23
- Notebook 1366×768: 23/23
- Desktop Full HD 1920×1080: 23/23
- Desktop ultrawide 2560×1080: 23/23
- Contratos estáticos: 9/9
- Total: **101/101**

### PWA e anti-quebra

- PWA: **23/23** verificações aprovadas.
- Save transacional schema 2 preservado.
- Snapshots rotativos e snapshot de emergência preservados.
- Recuperação de save corrompido e gravação interrompida preservada.
- Watchdog, modo seguro e diagnóstico persistente preservados.

## Simulação de longo prazo

- 12 cenários determinísticos
- 30 anos por cenário
- 129.600 dias simulados
- Nenhum `NaN`, infinito, data inválida, corrupção estrutural ou quebra de save

Alertas não bloqueantes preservados:

1. Cenários sem intervenção convergem para colapso institucional.
2. Dívida e crise convergem aos limites máximos.
3. Tensão global converge ao limite máximo.

Esses alertas pertencem à futura reconstrução do Core Loop 2.0 e não representam regressão da Fase 10.

## Limite editorial desta fase

O núcleo, o shell e as mensagens críticas possuem traduções editoriais. Parte do conteúdo narrativo legado ainda utiliza fallback lexical controlado em inglês e espanhol. A Fase 11 — Localization Complete fará a revisão integral das frases, contexto, gênero, pluralização e terminologia, removendo essa dependência.

## Resultado

A build está **aprovada no escopo da Fase 10 — I18N Core**, mas ainda não é a versão comercial final. O próximo marco é a Fase 11 — Localization Complete.

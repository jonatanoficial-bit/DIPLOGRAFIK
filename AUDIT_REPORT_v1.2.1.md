# Relatório de Auditoria — DIPLOCRAFT v1.2.1

## Identificação

- **Fase:** 8 — Fullscreen/PWA
- **Build:** 13/06/2026 11:21 — America/Sao_Paulo
- **Status:** `FULLSCREEN_PWA_VERIFIED`
- **Artefato:** `DIPLOCRAFT_v1.2.1_FASE-8_FULLSCREEN-PWA_build_20260613_1121.zip`
- **Save:** schema 2, chave `diplocraft_save_v101`, compatível com as builds anteriores

## Escopo executado

A Fase 8 transformou a aplicação web em uma PWA instalável, preservando o gameplay, os saves, a navegação mobile, o Anti-Break Core e a pipeline de assets. Foram implementados manifesto completo, ícones, splash screens, service worker versionado, shell offline, detecção de rede, modo standalone/fullscreen e atualização controlada.

## PWA e instalação

- Manifesto com `display: fullscreen` e fallback para `standalone` e `minimal-ui`.
- Orientação livre para portrait, landscape, tablet e desktop.
- Ícones 192×192 e 512×512, além de ícone maskable 512×512.
- Apple Touch Icon 180×180.
- Cinco splash screens para celulares e tablets.
- Duas screenshots promocionais declaradas no manifesto.
- Botão de instalação exibido somente quando o navegador oferece `beforeinstallprompt`.
- Detecção de instalação/standalone e ajuste automático dos controles de tela cheia.
- Interface permanece funcional quando o navegador não oferece instalação programática.

## Cache offline

O service worker possui cache identificado como:

`diplocraft-shell-v1.2.1-20260613_1121`

Foram incluídos **141 arquivos** no precache, cobrindo:

- HTML e manifesto;
- CSS e 43 módulos JavaScript ativos;
- conteúdo JSON necessário ao jogo;
- 74 variantes otimizadas de gameplay;
- 16 assets de identidade PWA.

Os PNGs-fonte pesados de fundos, personagens e cartões não entram no precache.

### Estratégias

1. **Network-first para navegação:** tenta a rede e usa `index.html` em cache quando offline.
2. **Cache-first para shell:** módulos, CSS, manifesto e demais arquivos estáticos.
3. **Stale-while-revalidate para imagens:** entrega a versão em cache e atualiza quando houver rede.

## Atualização controlada

- Um novo service worker não chama `skipWaiting()` durante a instalação.
- A build nova permanece aguardando enquanto a sessão atual está em uso.
- O jogador recebe aviso visual e escolhe quando aplicar a atualização.
- Após confirmação, a mensagem `SKIP_WAITING` ativa a nova build e recarrega a aplicação.
- Caches antigos com prefixo DIPLOCRAFT são removidos durante `activate`.
- Saves permanecem no armazenamento local e não são apagados durante atualização.

## Auditoria consolidada

- **12/12 suítes aprovadas**
- **455/455 verificações aprovadas**
- **43/43 módulos ativos**
- **0 módulos órfãos**
- **169 IDs HTML verificados**
- **146 referências de DOM resolvidas**
- **112 assets registrados**
- **22 assets-fonte preservados**
- **74 variantes otimizadas de gameplay**
- **16 assets PWA**
- **141 arquivos no precache**
- **848.044 bytes de identidade PWA**

### Regressão geral

- Mobile 360×640: 42/42
- Mobile 390×844: 42/42
- Tablet 768×1024: 42/42
- Desktop 1366×768: 42/42
- Total: 168/168

### Auditoria mobile dedicada

- Phone 320×568: 28/28
- Phone 360×640: 28/28
- Phone 390×844: 28/28
- Phone 844×390 landscape: 28/28
- Tablet 768×1024: 28/28
- Contratos estáticos mobile: 9/9
- Total: 149/149

### Service worker

A simulação determinística validou:

- registro dos listeners `install`, `activate`, `fetch` e `message`;
- criação do cache atual;
- 141 itens instalados;
- remoção de cache antigo;
- `clients.claim()`;
- resposta `GET_VERSION`;
- atualização por `SKIP_WAITING` somente após mensagem;
- navegação offline;
- módulo JavaScript offline;
- ícone offline.

## Limitação do ambiente de auditoria

O Chromium disponível neste ambiente bloqueia, por política administrativa, navegação para qualquer servidor local, inclusive localhost, endereço IP, HTTPS e domínio mapeado. Por isso, o ciclo do service worker foi validado em uma VM determinística com as APIs de cache, eventos e respostas simuladas. A interface continua coberta pelo Playwright através do harness nas nove resoluções/perfis aprovados.

Antes de publicação pública, permanece obrigatório um smoke test em URL HTTPS real, preferencialmente GitHub Pages, Android Chrome e iPhone Safari.

## Simulação de longo prazo

- 12 cenários determinísticos
- 30 anos por cenário
- 129.600 dias simulados
- Nenhum `NaN`, infinito, data inválida, corrupção estrutural ou quebra de save

Alertas de balanceamento preservados:

1. Cenários sem intervenção convergem para colapso institucional.
2. Dívida e crise convergem aos limites máximos.
3. Tensão global converge ao limite máximo.

Esses alertas pertencem à reconstrução futura do core loop e não representam regressão técnica da Fase 8.

## Resultado

A build está **aprovada no escopo da Fase 8**, mas ainda não é uma versão comercial final. O próximo marco planejado é a Fase 9 — Responsive Desktop.

# Relatório de Auditoria — DIPLOCRAFT v1.2.0

## Identificação

- **Fase:** 7 — Mobile First
- **Build:** 13/06/2026 10:02 — America/Sao_Paulo
- **Status técnico:** `MOBILE_FIRST_VERIFIED`
- **Base:** DIPLOCRAFT v1.1.1 — Fase 6 Asset Pipeline
- **Artefato:** `DIPLOCRAFT_v1.2.0_FASE-7_MOBILE-FIRST_build_20260613_1002.zip`
- **Save:** schema 2, chave `diplocraft_save_v101`, preservados

## Objetivo da fase

Transformar a interface responsiva existente em uma experiência realmente mobile-first sem alterar o gameplay aprovado. A fase concentrou-se em rolagem, navegação por toque, safe areas, teclado virtual, portrait/landscape, celulares estreitos, tablets e acessibilidade de controles.

## Implementações auditadas

### Viewport e sistema operacional móvel

- `visualViewport` controla a altura útil do aplicativo e detecta teclado virtual.
- Variáveis `--app-height` e `--keyboard-height` evitam conteúdo encoberto.
- Safe areas são aplicadas nos quatro lados para aparelhos com notch e indicador de gesto.
- O usuário continua podendo ampliar a página; o viewport não bloqueia zoom de acessibilidade.
- Fullscreen alternável respeita a orientação atual e não força portrait.

### Navegação

- Barra inferior com seis ações e alvos de toque de no mínimo 48 px.
- Acesso rápido a Painel, Governo, Economia, Diplomacia e Eleições.
- Botão **Mais** abre um drawer completo com os treze sistemas.
- Drawer possui overlay, botão de fechamento, foco contido, `aria-hidden`, gesto de borda e devolução de foco.
- A seção atual aparece no cabeçalho mobile.
- A posição de rolagem é preservada individualmente por aba.

### Rolagem e telas pequenas

- Menu, criação de líder e gameplay usam áreas de rolagem independentes.
- A tela de criação mantém o botão principal alcançável mesmo com teclado virtual.
- Layout específico para 320×568 e dispositivos de pouca altura.
- Layout dedicado para landscape 844×390.
- Ajustes intermediários para tablets e larguras entre 881 e 1100 px.
- Nenhum perfil auditado apresentou overflow horizontal.

### Acessibilidade tátil e por teclado

- Cards de avatar e partido são botões reais, com estado `aria-pressed`.
- Inputs possuem fonte mínima de 16 px para evitar zoom involuntário no iOS.
- Alvos interativos principais possuem no mínimo 48 px.
- Drawer contém armadilha de foco e fechamento por Escape.
- Overlays fechados não interceptam toques.

## Quality gate

| Suíte | Resultado | Verificações |
|---|---:|---:|
| Gerador canônico | PASS | 1 |
| Auditoria estática | PASS | 16 |
| Clean Base | PASS | 10 |
| Build Truth | PASS | 15 |
| Drift Guard | PASS | 4 |
| Testes Node | PASS | 18 |
| Simulação de longo prazo | PASS | 12 |
| Regressão de navegador | PASS | 168 |
| Anti-Break Core | PASS | 19 |
| Asset Pipeline | PASS | 17 |
| Mobile First | PASS | 149 |
| **Total** | **PASS** | **429/429** |

## Matriz de dispositivos

### Regressão geral — 42/42 por perfil

- Mobile 360×640
- Mobile 390×844
- Tablet 768×1024
- Desktop 1366×768

### Auditoria mobile dedicada — 28/28 por perfil, além de 9 contratos estáticos

- Phone 320×568 portrait
- Phone 360×640 portrait
- Phone 390×844 portrait
- Phone 844×390 landscape
- Tablet 768×1024 portrait

Foram verificados orientação, altura útil, overflow, zoom, alvos de toque, rolagem da criação, teclado virtual, botão principal, navegação inferior, avanço rápido, drawer, gesto lateral, memória de rolagem, rótulo da seção e erros de runtime.

## Integridade estrutural

- 42 módulos JavaScript carregados a partir de `src/game.js`.
- 0 módulos órfãos.
- 160 IDs HTML sem duplicidade.
- 136 referências de DOM resolvidas.
- 96 referências de assets de runtime existentes.
- 0 imports ausentes.
- 0 erros de sintaxe JavaScript.
- 0 erros de console ou página nos perfis auditados.

## Assets

- 22 imagens-fonte preservadas.
- 74 variantes AVIF/WebP.
- 96 arquivos registrados no catálogo.
- 90,78% de redução considerando os dois formatos de runtime.
- Maior arquivo de runtime: 176.416 bytes.
- Nenhum asset acima do budget.

## Anti-quebra e compatibilidade

- Save schema 2 e chave histórica preservados.
- Escrita transacional, snapshots, quarentena e restauração continuam aprovados.
- Watchdog, modo seguro e exportação de diagnóstico continuam funcionais.
- Falhas simuladas foram recuperadas sem impedir retorno ao menu.

## Simulação de longo prazo

A matriz executou 12 cenários determinísticos de 30 anos, totalizando 129.600 dias. Não houve `NaN`, `Infinity`, data inválida, corrupção estrutural ou quebra do save.

### Alertas de balanceamento preservados

- Cenários ociosos convergem para colapso institucional.
- Dívida e crise atingem os limites máximos sem ação do jogador.
- Tensão global converge para o limite máximo.

Esses alertas não são regressões da Fase 7. Eles permanecem registrados para a futura reconstrução do core loop e do balanceamento.

## Conclusão

A Fase 7 está aprovada dentro de seu escopo. O DIPLOCRAFT agora possui uma camada mobile dedicada e auditada em portrait, landscape, telas de 320 px, celulares atuais, tablet e desktop. A aprovação não significa que o produto já atingiu padrão comercial final; a próxima etapa é a Fase 8 — Fullscreen/PWA.

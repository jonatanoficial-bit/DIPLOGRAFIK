# Fase 11 — Scroll & Touch Recovery

A v1.3.3 corrige a impossibilidade de percorrer a tela **Criar Líder** em computadores e endurece a experiência de toque em celulares e tablets.

## Arquitetura

- `#menu` e `#create` são viewports de rolagem independentes em todas as plataformas.
- O `body` continua travado como shell de aplicativo; a tela ativa é a única proprietária da rolagem.
- `src/core/scrollExperience.js` controla atalhos de página, foco de campos, indicador de progresso e troca de tela.
- No PC, a barra possui gutter estável e estilo visível.
- No mobile, `touch-action: pan-y pinch-zoom` e momentum do WebKit preservam o gesto vertical.

## Controles auditados

- roda do mouse e touchpad;
- PageUp, PageDown, Home, End e Espaço;
- gesto vertical real iniciado sobre o avatar;
- campos de nome, país, filtro de partido e botão Começar Jornada;
- portrait, landscape, tablet e desktop curto;
- ícones e alvos de toque da navegação mobile.

## Auditoria bloqueante

`tests/run_scroll_touch_audit.py` executa nove perfis isolados. O agregador `tests/aggregate_scroll_touch_audit.py` impede a release se qualquer viewport falhar.

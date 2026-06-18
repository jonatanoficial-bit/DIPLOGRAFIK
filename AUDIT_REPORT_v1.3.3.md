# Auditoria — DIPLOCRAFT v1.3.3

**Fase:** 11 — Scroll & Touch Recovery  
**Build:** 17/06/2026 10:52 — America/Sao_Paulo  
**Status:** `SCROLL_TOUCH_RECOVERY_VERIFIED`

## Defeito corrigido

No desktop, o `body` era bloqueado com `overflow: hidden`, mas a tela de criação não possuía viewport próprio fora do breakpoint mobile. O conteúdo abaixo dos avatares só podia ser alcançado por foco de teclado. A v1.3.3 torna menu e criação scroll containers independentes em todas as plataformas.

## Entregas

- barra de rolagem visível e estilizada no PC;
- roda do mouse e touchpad funcionais;
- gesto vertical com inércia no mobile e PWA;
- atalhos PageUp, PageDown, Home, End e Espaço;
- indicador de que ainda há conteúdo abaixo;
- campos e botão final alcançáveis sem usar Tab;
- alvos de toque e ícones revisados a partir de 320 px;
- compatibilidade preservada com saves, idiomas, assets, PWA e anti-quebra.

## Quality gate

- Suítes: **16/16**
- Verificações: **863/863**
- Auditoria específica de scroll: **217/217**
- Perfis de scroll: **9**
- Módulos ativos: **49/49**
- Módulos órfãos: **0**
- Erros de console/página nos perfis de scroll: **0**

## Perfis específicos de rolagem

- desktop_short_1024x600: **PASS** — 23/23
- desktop_1366x768: **PASS** — 23/23
- desktop_fullhd_1920x1080: **PASS** — 23/23
- tablet_mouse_1024x768: **PASS** — 23/23
- mobile_320x568: **PASS** — 23/23
- mobile_360x640: **PASS** — 23/23
- mobile_390x844: **PASS** — 23/23
- mobile_landscape_844x390: **PASS** — 23/23
- tablet_touch_768x1024: **PASS** — 23/23

## Regressões preservadas

- navegador geral: 168/168;
- mobile-first: 149/149;
- desktop responsivo: 101/101;
- I18N: 74/74;
- PWA: 23/23;
- anti-quebra: 19/19;
- asset pipeline: 18/18;
- recuperação de assets web: 16/16;
- testes Node: 18/18;
- matriz de 129.600 dias sem corrupção estrutural.

## Alertas não bloqueantes

- partidas sem intervenção ainda podem convergir para colapso institucional;
- a revisão editorial completa dos três idiomas foi deslocada para a Fase 12;
- o deploy deve substituir a pasta inteira e depois receber recarga forçada para remover cache antigo.

# Relatório de Auditoria — DIPLOCRAFT v1.5.1

## Identificação

- **Fase:** 15 — Criação de Governo
- **Build:** `20260617_1705`
- **Status:** `GOVERNMENT_CREATION_VERIFIED`
- **Base:** v1.5.0 — Core Loop 2.0
- **Save schema:** 3, compatível com as carreiras anteriores
- **Idiomas:** português do Brasil, inglês e espanhol

## Escopo entregue

A criação de carreira foi ampliada para nove etapas: avatar, nome, país, sistema político, ideologia, dificuldade, cenário inicial, objetivo estratégico e partido. As escolhas são gravadas em cada carreira e aplicam modificadores reais ao estado inicial, ao ritmo dos eventos, aos pontos de ação e às metas do mandato.

A escolha partidária passou a usar 12 cards visuais individuais e clicáveis. Os PNGs-fonte ficam em `assets/ui/parties/`; a pipeline gera AVIF e WebP em `assets/runtime/parties/`, mantendo fallback para publicação web.

## Conteúdo da criação de governo

- 1 país plenamente jogável: Brasil
- 3 sistemas políticos
- 5 ideologias de liderança
- 4 níveis de dificuldade
- 4 cenários iniciais
- 5 objetivos estratégicos
- 12 partidos com logos clicáveis
- 9 etapas de criação com resumo antes da posse

## Auditoria bloqueante

O quality gate final aprovou **20 de 20 suítes** e **1.253 de 1.253 verificações**.

| Suíte | Verificações | Resultado |
|---|---:|---|
| Build generator | 1 | Aprovada |
| Auditoria estática | 16 | Aprovada |
| Clean Base | 10 | Aprovada |
| Build Truth | 17 | Aprovada |
| Drift Guard | 4 | Aprovada |
| Testes Node | 31 | Aprovada |
| Simulação de longo prazo | 12 | Aprovada |
| Regressão de navegador | 168 | Aprovada |
| Anti-Break Core | 19 | Aprovada |
| Asset Pipeline | 18 | Aprovada |
| Mobile First | 149 | Aprovada |
| PWA | 23 | Aprovada |
| Responsive Desktop | 101 | Aprovada |
| I18N | 74 | Aprovada |
| Recuperação de assets web | 16 | Aprovada |
| Scroll & Touch | 217 | Aprovada |
| Localization Complete | 56 | Aprovada |
| Save Architecture | 168 | Aprovada |
| Core Loop 2.0 | 88 | Aprovada |
| Criação de Governo | 65 | Aprovada |

## Auditoria específica da Fase 15

A suíte dedicada aprovou **65 verificações** em:

- mobile 320×568;
- mobile 390×844;
- tablet 768×1024;
- desktop 1366×768.

Foram validados os nove painéis, 12 logos, caminhos otimizados e fallback, estados selecionados, atualização do resumo, aplicação dos modificadores, persistência no HUD, ausência de overflow horizontal e ausência de erros de página.

## Rolagem e toque

A auditoria Scroll & Touch aprovou **217 de 217 verificações** em nove perfis:

- desktop 1024×600;
- desktop 1366×768;
- desktop 1920×1080;
- tablet com mouse 1024×768;
- mobile 320×568;
- mobile 360×640;
- mobile 390×844;
- landscape 844×390;
- tablet touch 768×1024.

No mobile, as opções extensas da criação usam carrosséis horizontais com gesto nativo, mantendo a rolagem vertical da página e os alvos de toque mínimos.

## Assets

- 34 imagens-fonte
- 98 variantes de runtime
- 16 assets PWA
- 148 arquivos registrados
- redução total AVIF + WebP: **90,66%** em relação às fontes PNG
- maior asset de runtime: 176.416 bytes
- 12 cards partidários em AVIF e WebP
- zero arquivos acima do budget
- zero caminhos ausentes

## Simulação de longo prazo

Foram executados 12 cenários determinísticos, com 30 anos por cenário, totalizando **129.600 dias simulados**.

- invariantes estruturais: aprovadas;
- alertas de balanceamento: zero;
- `NaN` ou infinito: zero;
- data inválida: zero;
- corrupção de estado/save: zero.

## Compatibilidade preservada

Continuam ativos e aprovados:

- perfis, slots, backups, exportação e importação;
- save schema 3 e migração de versões anteriores;
- Core Loop 2.0;
- PWA e funcionamento offline;
- atualização controlada;
- português, inglês e espanhol;
- mobile, tablet, desktop e ultrawide;
- snapshots, watchdog, modo seguro e diagnóstico;
- fallback de imagens para publicação no Vercel/GitHub.

## Pendências conhecidas

- O Brasil é o único país plenamente jogável nesta fase.
- Semipresidencialismo e parlamentarismo usam modificadores próprios, mas ainda compartilham o Congresso e o calendário eleitoral brasileiro.
- Os logos foram recortados da folha fornecida pelo usuário; antes de distribuição comercial em lojas, recomenda-se validação jurídica e substituição por arquivos oficiais licenciados quando necessário.
- A homologação automatizada não substitui uma rodada final em aparelhos físicos reais e no domínio HTTPS definitivo.

## Veredito

A Fase 15 está aprovada dentro de seu escopo. Não foram encontrados bloqueios técnicos para continuar a evolução para a Fase 16 — País e População.

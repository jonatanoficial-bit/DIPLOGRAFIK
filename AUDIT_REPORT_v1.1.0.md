# Relatório de Auditoria — DIPLOCRAFT v1.1.0

## Identificação

- **Fase:** 5 — Test Foundation
- **Build:** 12/06/2026 17:14 — America/Sao_Paulo
- **Status técnico:** TEST_FOUNDATION_VERIFIED
- **Base:** v1.0.4 — Anti-Break Core
- **Save:** schema 2, chave `diplocraft_save_v101`, compatibilidade preservada

## Escopo entregue

A Fase 5 implantou uma fundação de testes reproduzível e bloqueante, sem dependências JavaScript externas. O estado inicial foi extraído para `src/core/stateFactory.js`, permitindo testar o núcleo sem carregar a interface. A build passou a conter testes unitários, contratos de dados, integração de armazenamento, simulação determinística, regressão de navegador, workflow de CI e agregador final.

## Correções verificadas pelos testes

1. Operações de inteligência cobram o custo uma única vez.
2. Uma lei aprovada não pode ser aprovada repetidamente para acumular efeitos.
3. O mesmo tratado com o mesmo país não pode ser assinado repetidamente.
4. O perfil Austeridade altera `publicSpending`, eliminando o campo fantasma `spending`.
5. O tratado de defesa altera `globalTension`, eliminando o campo fantasma `tension`.
6. Capital político, lealdade, campanha, rejeição, narrativa, tensão global e demais métricas percentuais permanecem entre 0 e 100.
7. Valores não finitos, moedas negativas, XP negativo, tesouro negativo e PIB inválido são normalizados.

## Resultado do quality gate

- **Suítes:** 9/9
- **Verificações discretas:** 247/247
- **Testes Node:** 18/18
- **Regressão de navegador:** 152/152 em 4 resoluções
- **Auditoria estática:** 16/16
- **Clean Base:** 10/10
- **Build Truth:** 15/15
- **Drift Guard:** 4/4
- **Anti-Break Core:** 19/19
- **Módulos ativos:** 39
- **Módulos órfãos:** 0
- **Assets registrados:** 22
- **Erros de página/console:** 0

## Simulação de longo prazo

Foram executados **12 cenários determinísticos de 30 anos**, com três perfis iniciais e doze sementes, totalizando **129.600 dias simulados**. Todas as invariantes estruturais passaram: datas válidas, números finitos, limites de métricas, filas e históricos limitados e relações internacionais válidas.

### Alerta de balanceamento

A simulação sem intervenção do jogador ainda converge para colapso institucional: aprovação, economia, estabilidade, capital político e lealdade chegam ao limite inferior, enquanto dívida, crise e tensão global chegam ao limite superior. Isso **não quebra o software**, mas confirma que o jogo ainda não está equilibrado nem pronto para lançamento comercial. O problema está documentado em `KNOWN_ISSUES_PHASE_5.md` e será enfrentado nas fases de reconstrução do core loop e economia.

## Resoluções aprovadas

- Mobile 360×640
- Mobile 390×844
- Tablet 768×1024
- Desktop 1366×768

## Critério de aprovação

A Fase 5 está aprovada porque a fundação de testes, as barreiras de regressão e as correções objetivas funcionam. A aprovação não declara o simulador equilibrado ou comercialmente final.

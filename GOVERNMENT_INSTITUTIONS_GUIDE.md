# Governo e Instituições — Fase 19

A Fase 19 adiciona um sistema institucional profundo ao DIPLOCRAFT, conectado ao orçamento, economia profunda, população, estabilidade e governabilidade.

## Sistemas principais

- Congresso, Judiciário, federação, órgãos de controle, Banco Central, burocracia, reguladoras e justiça eleitoral.
- Indicadores de freios e contrapesos, segurança jurídica, coordenação federativa, eficiência administrativa, independência institucional, risco de captura e confiança institucional.
- Reformas institucionais selecionáveis com efeitos sistêmicos.
- Ações estruturantes com custo político, custo fiscal, cooldown e efeitos diferidos.
- Protocolos de crise institucional: CPI, conflito judicial, impasse federativo e travamento burocrático.

## Integrações

O ciclo mensal processa instituições depois da população e registra o relatório em `state.governance.reports.monthly.institutions`. Os efeitos alteram estabilidade, aprovação, capacidade administrativa, risco fiscal, confiança empresarial, produtividade, justiça social, economia e dívida.

## Arquivos principais

- `src/data/governmentInstitutionData.js`
- `src/systems/governmentInstitutions.js`
- `src/ui/render.js`
- `src/systems/coreLoop.js`
- `src/core/stateFactory.js`
- `tests/run_government_institutions_audit.py`
- `tests/unit/government-institutions.test.js`

## Save

A Fase 19 preserva o schema 3 e a chave `diplocraft_save_v101`. Saves antigos recebem `state.institutions` automaticamente por normalização defensiva.

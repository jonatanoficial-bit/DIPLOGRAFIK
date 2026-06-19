# DIPLOCRAFT — Fase 23 v1.7.5 — Defesa, Inteligência e Segurança Internacional

## Objetivo da fase

A Fase 23 transforma as abas **Militar** e **Inteligência** em um sistema profundo de segurança nacional. A evolução preserva todas as fases anteriores e adiciona uma camada integrada de defesa, inteligência, fronteiras, cibersegurança, dissuasão e segurança internacional.

## Sistemas adicionados

- Saúde de defesa e risco estratégico.
- Prontidão, logística, modernização, moral, autonomia e pressão por força.
- Forças: Exército, Marinha, Aeronáutica/Espaço, Comando Cibernético, Guarda de Fronteiras e Defesa Civil.
- Mesas de inteligência: contraameaças internas, análise externa, ciberinteligência, inteligência financeira, monitor de crises e previsão estratégica.
- Doutrinas: dissuasão equilibrada, segurança integrada, soberania cibernética e projeção de paz.
- Ações com custo, PA, cooldown e consequência atrasada.
- Incidentes de defesa/inteligência com histórico e diagnóstico.
- Ciclo mensal integrado ao Core Loop 2.0.

## Integrações mantidas

A fase conversa com economia profunda, orçamento, governo/instituições, gabinete, mídia/opinião pública, diplomacia mundial, segurança legada, população e crise. O save permanece no schema 3 e na chave `diplocraft_save_v101`.

## Arquivos principais

- `src/data/defenseIntelligenceData.js`
- `src/systems/defenseIntelligence.js`
- `tests/run_defense_intelligence_audit.py`
- `tests/defense-intelligence-results.json`
- `tests/defense-intelligence-output.txt`

## Regras anti-quebra

- Nenhum módulo anterior foi removido.
- As ações militares e operações secretas legadas permanecem visíveis.
- A nova camada é aditiva e migra saves antigos com `ensureDefenseIntelligenceState()`.
- Os caminhos de assets não foram alterados.
- O arquivo `UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt` permanece na raiz do ZIP.

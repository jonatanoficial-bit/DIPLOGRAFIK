# Protocolo permanente de testes

Cada build deve validar sintaxe e imports; IDs de DOM; telas e abas; assets; JSON; versão; save; criação de partida; avanço de tempo; tutorial; áudio; error boundary; navegação mobile; resoluções-alvo; ausência de módulos órfãos; ausência de conteúdo externo; e integridade SHA-256.

A palavra **aprovada** só pode ser usada quando os testes obrigatórios da fase retornarem sucesso. Limitações conhecidas precisam aparecer no relatório e não podem ser ocultadas.


## Quality gate da Fase 5

A partir da v1.1.0, execute `python tests/run_quality_gate.py`. A build é bloqueada se qualquer teste unitário, contrato de dados, simulação, auditoria estrutural, auditoria anti-quebra ou regressão de navegador falhar. Os relatórios oficiais são `tests/test-results.json` e `tests/simulation-results.json`.

## Asset Pipeline

A build é bloqueada se variantes AVIF/WebP faltarem, excederem budgets, divergirem em hash/dimensões ou se o runtime voltar a referenciar PNGs-fonte diretamente.

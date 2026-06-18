# DIPLOCRAFT — Fase 18 v1.7.0 — Orçamento e Tributação

Esta fase aprofunda a gestão fiscal do jogo sem remover nenhum sistema anterior.

## Sistemas adicionados

- Bases tributárias ajustáveis: renda, empresas, consumo, folha, patrimônio e tributo verde.
- Indicadores fiscais: conformidade, sonegação, custo administrativo, eficiência do gasto, espaço fiscal e credibilidade orçamentária.
- Regras de execução: orçamento base, proteção social, investimento público e teto fiscal rígido.
- Ações estruturantes com PA, custo, cooldown e atraso.
- Histórico fiscal mensal limitado a 36 registros.

## Integração

O fechamento mensal agora considera orçamento e tributação antes de normalizar a economia. O sistema afeta Tesouro, dívida, mercado, aprovação, desigualdade, coesão social e credibilidade fiscal. Saves antigos schema 3 recebem `budgetTax` automaticamente por migração defensiva.

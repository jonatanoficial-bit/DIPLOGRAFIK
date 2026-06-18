# DIPLOCRAFT — Fase 17 v1.6.1 Economia Profunda

Esta build foi aplicada sobre a pasta oficial `DIPLOCRAFT-v1.6.0-FASE-16-PAIS-E-POPULACAO`, preservando todos os sistemas anteriores.

## Sistemas adicionados

- PIB real e nominal;
- crescimento anualizado e trimestral;
- produtividade, investimento privado e público;
- receita primária, despesa primária, resultado primário, serviço da dívida e saldo fiscal;
- regra fiscal selecionável;
- política monetária selecionável;
- exportações, importações, câmbio, reservas e conta corrente;
- salário real, custo de vida, endividamento familiar, pobreza econômica e segurança da classe média;
- histórico mensal de 48 registros e trimestral de 24 registros;
- programas produtivos com custo, cooldown, PA e consequências atrasadas.

## Anti-quebra

A migração é aditiva: saves schema 3 continuam válidos. Caso um save antigo não possua `deepEconomy`, o estado é criado automaticamente por `ensureDeepEconomyState()`.

## Assets

Nenhum caminho de asset foi alterado nesta fase. A pasta `assets/` foi preservada da Fase 16.

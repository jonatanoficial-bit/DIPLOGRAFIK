# Fase 5 — Test Foundation

A v1.1.0 transforma a auditoria manual acumulada em uma barreira de qualidade reproduzível e bloqueante.

## Camadas

1. Testes unitários nativos do Node para cálculos e sistemas puros.
2. Testes de integração para ciclo de jogo e armazenamento transacional.
3. Contratos automáticos de dados para IDs, custos, cooldowns e valores finitos.
4. Matriz determinística de 30 anos em 12 sementes e três perfis iniciais.
5. Regressão de navegador nas quatro resoluções oficiais.
6. Auditorias de estrutura, identidade, Build Truth e núcleo anti-quebra.
7. `tests/run_quality_gate.py` bloqueia a liberação no primeiro erro.

## Execução

```bash
npm test
npm run test:simulation
npm run test:gate
```

Nenhuma dependência JavaScript externa é necessária. As auditorias de navegador usam Python, BeautifulSoup, Pillow e Playwright.

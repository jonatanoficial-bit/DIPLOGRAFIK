# Arquitetura oficial do DIPLOCRAFT

## Entrada
`index.html` carrega somente `src/game.js` como módulo principal.

## Camadas
- `src/core`: DOM, roteamento, fullscreen, storage, error boundary e build.
- `src/data`: conteúdo estático dos sistemas.
- `src/systems`: regras de simulação e mutação de estado.
- `src/ui`: renderização, áudio, feedback e tutorial.
- `assets`: fundos, personagens, ícones e cartões disponíveis.
- `content`: metadados de campanhas e desbloqueios preparados para conexão futura.
- `meta`: identidade, build, assets, dependências e integridade.
- `tests`: auditorias estática e de navegador.

## Estado e saves
A build mantém `saveSchema: 1` e a chave `diplocraft_save_v101` para não perder o progresso da Fase 1. A migração para chave baseada em schema será tratada na fase de arquitetura de saves.

## Regra anti-órfão
Todo `.js` dentro de `src` deve ser alcançável a partir de `src/game.js`. O teste estático bloqueia módulos paralelos ou esquecidos.

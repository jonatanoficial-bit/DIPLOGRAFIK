# Fase 4 — Anti-Break Core

A Fase 4 transforma a recuperação inicial da v1.0.1 em uma camada persistente de resiliência.

## Componentes

- `src/core/storage.js`: save schema 2, envelope com checksum, escrita transacional, quarentena, snapshots rotativos e restauração.
- `src/core/resilience.js`: heartbeat, watchdog, autosave, boot guard, modo seguro, incidentes e diagnóstico.
- `src/core/errorBoundary.js`: interface de falha com ID de incidente, restauração, modo seguro e exportação.

## Política de recuperação

1. A gravação é escrita primeiro na chave temporária.
2. O payload é relido e validado antes de substituir o save principal.
3. O save anterior é preservado em até três snapshots rotativos.
4. Falhas fatais criam um snapshot de emergência.
5. Save inválido é isolado e o snapshot válido mais recente é restaurado automaticamente.
6. Três falhas fatais em cinco minutos ativam o modo seguro.

## Compatibilidade

A chave `diplocraft_save_v101` foi preservada. Saves diretos do schema 1 continuam legíveis e são convertidos para o envelope schema 2 na próxima gravação.

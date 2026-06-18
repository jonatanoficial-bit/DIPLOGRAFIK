# Questões conhecidas — DIPLOCRAFT v1.2.0

## Não bloqueantes desta fase

1. O navegador pode recusar fullscreen até que o usuário realize um gesto. Essa é uma restrição de plataforma, não uma falha do jogo.
2. O modo standalone/PWA completo ainda será implementado na Fase 8.
3. Em iOS, a barra do navegador pode reaparecer conforme o gesto do usuário; o layout usa `visualViewport` e safe areas para permanecer utilizável.
4. A simulação de longo prazo ainda converge para colapso quando não há intervenção do jogador. O balanceamento será tratado nas fases de reconstrução do core loop.
5. A interface permanece somente em PT-BR nesta versão. Inglês e espanhol serão implantados nas fases 10 e 11 do plano mestre.
6. Os PNGs originais continuam no pacote como fontes de reconstrução; o runtime usa AVIF/WebP otimizados.

## Critérios de não regressão para a próxima fase

- Manter suporte mínimo a 320×568.
- Não bloquear zoom de acessibilidade.
- Preservar portrait e landscape.
- Manter alvos de toque de 48 px.
- Preservar a chave de save e o schema 2.
- Manter 429/429 verificações desta fase ou justificar formalmente qualquer alteração de contrato.

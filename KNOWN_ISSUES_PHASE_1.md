# Pendências conhecidas — DIPLOCRAFT v1.0.1

Esta é uma build de recuperação, não uma versão comercial.

1. Ainda existem documentos históricos e arquivos legados do projeto Medical Simulator no pacote original. Eles não são carregados pelo jogo atual e serão removidos ou arquivados na Fase 2.
2. O service worker/PWA ainda não possui cache offline completo nem ícones finais.
3. A internacionalização PT-BR/EN/ES ainda não foi iniciada.
4. A profundidade da simulação, regras contra exploração e balanceamento serão tratados nas fases de reconstrução do núcleo.
5. Assets ainda não foram comprimidos para WebP/AVIF nem adaptados a todas as proporções.
6. O fullscreen depende de gesto do usuário e das permissões do navegador/sistema operacional.
7. A auditoria em navegador foi executada por harness isolado, pois o ambiente de testes bloqueia navegação para endereços locais. Os módulos reais foram incorporados sem alteração lógica ao harness.

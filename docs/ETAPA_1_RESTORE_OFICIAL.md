# Etapa 1 — Restore oficial

Esta build é a nova base confiável para continuar o desenvolvimento comercial do DIPLOCRAFT.

- Versão: v0.6.2
- Base: v0.5.0
- Data/hora visível: 14/05/2026 21:57
- Foco: recuperação, tela cheia mobile, organização e validação.

## Fullscreen mobile
O jogo agora usa:
- viewport-fit=cover;
- 100dvh/100svh;
- safe-area para celulares com notch;
- PWA manifest com display fullscreen;
- botão TELA CHEIA via Fullscreen API.

Observação: em alguns iPhones, tela cheia real depende de instalar pela opção “Adicionar à Tela de Início”.

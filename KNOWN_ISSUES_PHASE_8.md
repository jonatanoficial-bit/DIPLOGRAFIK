# Pontos conhecidos — Fase 8

1. A PWA exige HTTP seguro: HTTPS em produção ou localhost em desenvolvimento. Abrir por `file://` não registra o service worker.
2. A primeira visita precisa de rede para instalar o shell offline. Depois da ativação do service worker, o jogo pode reabrir sem conexão.
3. No iPhone/iPad, o Safari normalmente utiliza o fluxo Compartilhar → Adicionar à Tela de Início, sem o evento `beforeinstallprompt`.
4. O teste de ciclo real do service worker em Chromium local foi impedido por política administrativa do ambiente; foi substituído por simulação determinística completa. É obrigatório repetir o smoke test em hospedagem HTTPS real.
5. A build não é um APK, AAB, IPA ou aplicativo de loja. É uma PWA web instalável.
6. Os alertas de balanceamento de 30 anos continuam abertos para as fases de reconstrução do core loop.

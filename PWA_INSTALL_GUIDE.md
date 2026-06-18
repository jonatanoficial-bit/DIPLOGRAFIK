# Guia de instalação PWA — DIPLOCRAFT

## Publicação

Hospede a pasta completa sem alterar os caminhos relativos. GitHub Pages, servidor HTTPS ou hospedagem estática compatível são adequados. O arquivo inicial é `index.html`, o manifesto é `manifest.webmanifest` e o service worker é `sw.js`.

## Android e desktop Chromium

Abra o jogo pela URL HTTPS. Quando o navegador disponibilizar a instalação, o botão **INSTALAR APP** aparecerá no menu e na aba Release. Também é possível usar a opção de instalação no menu do navegador.

## iPhone e iPad

Abra no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**. O sistema utilizará o Apple Touch Icon e as splash screens incluídas na build.

## Uso offline

A primeira abertura deve ocorrer online para que os 141 arquivos do shell sejam armazenados. Após a ativação do service worker, o jogo pode ser reaberto offline. Saves, snapshots e diagnósticos continuam armazenados localmente no dispositivo.

## Atualizações

Quando uma build nova estiver disponível, a sessão atual não será substituída automaticamente. Um aviso aparecerá no jogo. Salve a partida e escolha **APLICAR ATUALIZAÇÃO** para ativar a nova versão.

## Diagnóstico

Na aba **Release**, consulte estado do service worker, controle offline, rede, instalação, atualização, cache, watchdog e snapshots. O botão de diagnóstico exporta os dados técnicos do Anti-Break Core.

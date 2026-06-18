# DIPLOCRAFT v0.6.4 — Code Structure

## Objetivo
Reorganizar o JavaScript em módulos sem alterar caminhos de assets.

## Importante
Esta build é **CODE ONLY**. Ela não contém `/assets`.

## Estrutura nova

```text
src/core/dom.js
src/core/storage.js
src/core/router.js
src/core/fullscreen.js
src/data/parties.js
src/data/avatars.js
src/data/content.js
src/systems/calculations.js
src/systems/economy.js
src/systems/events.js
src/systems/elections.js
src/ui/render.js
src/game.js
```

## Compatibilidade local
Usei scripts tradicionais, não ES Modules, para o jogo continuar abrindo direto pelo `index.html` em celular e PC, sem servidor local.

## Fullscreen mobile
Mantido com `viewport-fit=cover`, `100dvh/100svh`, safe-area e `manifest.webmanifest` em modo fullscreen.

## Build
Versão: v0.6.4  
Data/hora visível: 15/05/2026 15:18

# Publicação correta no Vercel — DIPLOCRAFT

## Estrutura obrigatória

O diretório selecionado como **Root Directory** no Vercel deve ser a pasta que contém diretamente:

- `index.html`
- `src/`
- `assets/`
- `content/`
- `manifest.webmanifest`
- `sw.js`
- `vercel.json`

Não selecione `src` como Root Directory e não publique apenas os arquivos de código.

## Configuração

- Framework Preset: **Other**
- Build Command: vazio
- Output Directory: vazio
- Install Command: vazio

## Teste após publicar

Abra estes caminhos no navegador. Todos devem exibir uma imagem, não uma página 404:

- `/assets/characters/char_leader_male_white_v1.png`
- `/assets/runtime/characters/char_leader_male_white_v1--thumb.webp`
- `/assets/backgrounds/bg_main_menu_presidential_office_v1.png`

A v1.3.3 preserva o fallback automático: se `assets/runtime` faltar, o jogo utiliza os PNGs originais. Mesmo assim, a pasta `assets` completa deve ser enviada.

## Atualização do cache

Depois do novo deploy, abra o site, use `Ctrl+Shift+R` e confirme a atualização quando o jogo oferecer uma nova build. Em teste, uma janela anônima também evita o cache antigo.

## Teste da rolagem após publicar

1. Abra **Novo Jogo**.
2. No PC, use a roda do mouse sobre os avatares e confirme que nome, país e partidos aparecem.
3. No celular, passe o dedo para cima sobre um avatar e confirme que a tela desce.
4. Verifique no rodapé a identificação `v1.3.3 • Fase 11 • Scroll & Touch Recovery`.

# DIPLOCRAFT v1.3.2 — Auditoria do Hotfix Assets Web

## Identificação

- Versão: v1.3.2
- Fase: 10 — Hotfix Assets Web
- Build: 15/06/2026 19:44 — America/Sao_Paulo
- Status: WEB_ASSET_RECOVERY_VERIFIED
- Base: v1.3.1 — Fase 10 I18N Core

## Defeito reproduzido

Na publicação web, a interface e os módulos JavaScript carregavam, porém os arquivos de `assets/runtime` não eram entregues pelo servidor. Como a v1.3.1 dependia exclusivamente das variantes AVIF/WebP, os fundos ficavam pretos e os avatares apareciam como ícones quebrados com texto alternativo.

## Correções

1. Fundos agora usam duas camadas: variante otimizada e PNG original.
2. Avatares removem as fontes AVIF/WebP com erro e carregam o PNG original.
3. O HUD possui fallback compatível com saves anteriores.
4. Caminhos são resolvidos a partir da raiz real do aplicativo.
5. O service worker não cancela a instalação quando um arquivo opcional está ausente.
6. `vercel.json` define publicação estática e políticas corretas de cache.
7. Foi incluído `DEPLOY_VERCEL.md` com a configuração exata de publicação.

## Teste destrutivo de publicação

A auditoria interceptou todas as requisições para `assets/runtime` e respondeu HTTP 404.

Resultado:

- 11 requisições otimizadas falharam propositalmente.
- 10 requisições aos PNGs originais foram atendidas.
- 5/5 avatares carregaram.
- Avatar do HUD carregou.
- Fundo original foi solicitado e permaneceu disponível.
- 0 erros de página.
- 0 erros JavaScript.

## Quality gate

- 15/15 suítes aprovadas.
- 646/646 verificações aprovadas.
- 168 verificações de regressão geral.
- 149 verificações mobile.
- 101 verificações desktop.
- 74 verificações I18N.
- 23 verificações PWA.
- 16 verificações exclusivas de recuperação web.
- 129.600 dias simulados sem corrupção estrutural.

## Compatibilidade

- Save schema 2 preservado.
- Chave `diplocraft_save_v101` preservada.
- Português, inglês e espanhol preservados.
- Mobile, tablet, desktop, PWA e modo seguro preservados.

## Alerta não relacionado ao hotfix

A simulação ociosa de longo prazo ainda converge para colapso econômico e institucional. Essa dívida de balanceamento permanece destinada à reconstrução futura do core loop e não interfere na recuperação dos assets.

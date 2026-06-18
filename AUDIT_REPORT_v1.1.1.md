# Auditoria — DIPLOCRAFT v1.1.1

**Fase:** 6 — Asset Pipeline  
**Build:** 13/06/2026 09:07 — America/Sao_Paulo  
**Status:** `ASSET_PIPELINE_VERIFIED`

## Escopo concluído

- Inventário canônico de 22 PNGs-fonte.
- Geração determinística de 74 variantes AVIF/WebP.
- Fundos desktop 1280×853 e mobile 720×960.
- Avatares 320×320 para seleção e 640×640 para HUD/save.
- Cartões 768×512 e folha de ícones 960×409.
- Catálogo de runtime gerado em `src/data/assetCatalog.js`.
- Seleção responsiva de fundos por viewport.
- AVIF prioritário, WebP como fallback.
- Lazy loading, decoding assíncrono e dimensões explícitas nos avatares.
- Preload apenas do fundo crítico da tela atual.
- Budgets de tamanho e auditoria bloqueante integrados ao quality gate.

## Métricas

| Métrica | Resultado |
|---|---:|
| Fontes | 22 |
| Variantes de runtime | 74 |
| Arquivos registrados | 96 |
| Peso das fontes | 44,63 MB |
| AVIF + WebP | 4,11 MB |
| Redução total | 90,78% |
| Redução WebP isolado | 94,15% |
| Redução AVIF isolado | 96,63% |
| Maior arquivo de runtime | 176.416 bytes |

O fundo inicial mobile caiu de aproximadamente 2,39 MB em PNG para 50,8 KB em AVIF ou 84,4 KB em WebP.

## Quality gate

- Build generator: 1/1
- Auditoria estática: 16/16
- Clean Base: 10/10
- Build Truth: 15/15
- Drift Guard: 4/4
- Testes Node: 18/18
- Matriz de simulação: 12/12
- Navegador: 168/168
- Anti-Break Core: 19/19
- Asset Pipeline: 17/17
- **Total: 280/280**

## Dispositivos

- 360×640: 42/42
- 390×844: 42/42
- 768×1024: 42/42
- 1366×768: 42/42

## Compatibilidade e preservação

Gameplay, save schema 2, chave `diplocraft_save_v101`, snapshots, modo seguro e conteúdo da v1.1.0 foram preservados.

## Pendências não bloqueantes

- As artes mobile são recortes controlados das imagens atuais, não novas composições nativas 9:16.
- Cartões e folha de ícones já estão otimizados, mas ainda não são usados em todas as telas.
- O balanceamento de longo prazo continua como dívida planejada do core loop.

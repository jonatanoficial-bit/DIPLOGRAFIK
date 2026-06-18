# Fase 12 — Localization Complete

A v1.3.4 conclui a primeira revisão editorial integral do DIPLOCRAFT em português do Brasil, inglês e espanhol.

## Arquitetura

- `tools/i18n_seed.json` é a fonte editorial oficial.
- `tools/generate_i18n.py` gera os três catálogos em `src/i18n/locales/`.
- `src/core/i18n.js` resolve frases exatas e padrões dinâmicos, sem substituição lexical palavra por palavra.
- Mensagens de feed permanecem canônicas no estado e são traduzidas somente na camada visual.
- `getMissingTranslations()` e `clearMissingTranslations()` permitem auditoria de cobertura durante o runtime.

## Cobertura

- 964 chaves por idioma;
- 414 literais de conteúdo jogável analisados;
- 13 sistemas percorridos em inglês e espanhol;
- zero chave vazia, ausente ou divergente;
- zero tradução ausente registrada durante a auditoria funcional.

## Proteção de layout

Textos longos, hashes e nomes de pacotes usam quebra segura. A expansão foi testada desde 320×568 até 2560×1080, mantendo rolagem vertical, touch e ausência de overflow horizontal.

## Gate bloqueante

`tests/run_localization_complete_audit.py` bloqueia a release quando encontra catálogo incompleto, fallback lexical, conteúdo jogável sem frase canônica, português residual proibido, tradução ausente no runtime, erro de console ou overflow horizontal.

# Fase 10 — I18N Core

A v1.3.1 implanta o núcleo internacional do DIPLOCRAFT sem alterar o save ou as regras de gameplay.

## Idiomas ativos

- Português do Brasil (`pt-BR`)
- Inglês (`en`)
- Espanhol (`es`)

## Arquitetura

- Fonte canônica: `tools/i18n_seed.json`
- Gerador: `tools/generate_i18n.py`
- Catálogos: `src/i18n/locales/`
- Runtime: `src/core/i18n.js`
- Metadados: `meta/i18n.json`
- Auditoria bloqueante: `tests/run_i18n_audit.py`

O idioma é salvo em `diplocraft_locale_v1`, separado do save da carreira. A troca ocorre em tempo real, atualiza `html lang`, atributos de acessibilidade, interface estática, conteúdo renderizado e formatação `Intl`.

## Limite desta fase

O shell, onboarding, navegação, HUD, tutorial, mensagens centrais, PWA e anti-quebra possuem traduções editoriais. Conteúdo legado não catalogado usa fallback lexical controlado. A Fase 12 fará a revisão editorial integral e removerá essa dependência.

# Guia de localização — DIPLOCRAFT v1.3.4

## Idiomas ativos

- Português do Brasil: `pt-BR`
- Inglês: `en`
- Espanhol: `es`

## Fonte oficial

Edite somente `tools/i18n_seed.json`. Os arquivos em `src/i18n/locales/` são gerados e não devem receber alterações manuais.

```bash
python3 tools/generate_i18n.py
python3 tools/generate_i18n.py --check
python3 tests/run_i18n_audit.py
python3 tests/run_localization_complete_audit.py
```

## Regras obrigatórias

1. Toda chave deve ter valor não vazio nos três idiomas.
2. Conteúdo jogável novo deve possuir frase canônica exata ou padrão dinâmico localizado.
3. Não reintroduzir tradução lexical palavra por palavra.
4. Variáveis dinâmicas devem usar os formatadores e padrões do runtime.
5. Números, datas, percentuais e listas devem usar `Intl` conforme o locale.
6. A preferência de idioma permanece fora do save da carreira.
7. Nomes próprios e siglas oficiais podem ser mantidos quando a tradução reduzir a precisão.
8. A build deve falhar diante de chave ausente, português residual proibido, overflow horizontal ou erro de runtime.

## Persistência

A preferência é armazenada em `diplocraft_locale_v1`. Trocar o idioma não altera líder, data, indicadores, feed ou progresso.

## Diagnóstico

O runtime expõe `window.DIPLOCRAFT_I18N.getMissingTranslations()` para listar frases canônicas que não receberam tradução e `clearMissingTranslations()` para reiniciar a coleta antes de uma auditoria.

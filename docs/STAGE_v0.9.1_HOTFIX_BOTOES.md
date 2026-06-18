# Etapa v0.9.1 — HOTFIX Botões e Inicialização

## Problema relatado
No deploy, o console exibiu:
`Uncaught SyntaxError: The requested module './calculations.js' does not provide an export named 'clamp'`

Esse erro impedia o carregamento do grafo de módulos JS e, por consequência,
os botões "Novo Jogo", "Continuar", "Áudio" e "Tutorial" não respondiam.

## Correção aplicada
- Export de `clamp` restaurado em `src/systems/calculations.js`.
- Atualização da identificação visual da build.

## Próximo passo
Após validar o hotfix, seguir para a próxima etapa funcional/comercial.

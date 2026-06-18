# Build Report v0.8.5 anti-quebra

Base: v0.8.4 mobile focus + visual.

Objetivo: avançar para uma etapa de estabilidade sem regredir visual, mobile ou gameplay.

## Recursos anti-quebra adicionados
- `safeLoad()` para evitar quebra quando o localStorage estiver corrompido.
- Backup automático do save corrompido antes de reiniciar estado.
- `normalizeState()` para completar campos ausentes em saves antigos.
- `save()` protegido por try/catch.
- `render()` protegido por try/catch.
- Captura global de erros e promises rejeitadas.
- Tela de recuperação com três ações: voltar ao lobby, exportar save, resetar.
- CSS de recuperação para evitar tela branca.

## O que NÃO foi alterado
- Gameplay clínico.
- Estrutura visual principal.
- Assets.
- Prontuário.
- Pontuação.
- Fundos por tela.

Conclusão estimada: 85%.

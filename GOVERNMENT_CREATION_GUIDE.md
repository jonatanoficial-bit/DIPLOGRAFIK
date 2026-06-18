# Fase 15 — Criação de Governo

A nova carreira é definida em nove etapas: avatar, nome, país, sistema político, ideologia, dificuldade, cenário, objetivo estratégico e partido.

## Partidos
Os 12 partidos são selecionados por cards visuais individuais em `assets/ui/parties/`. A pipeline gera AVIF e WebP, preservando PNG como fallback.

## Dificuldade
- Cidadão: recursos ampliados e pressão reduzida.
- Governante: equilíbrio padrão.
- Estrategista: menos recursos e maior pressão.
- Estadista: cenário realista e severo.

## Compatibilidade
Saves antigos continuam válidos. Ao carregar uma carreira anterior, o perfil padrão é Brasil, presidencialismo de coalizão, centro pragmático, dificuldade padrão e cenário equilibrado.

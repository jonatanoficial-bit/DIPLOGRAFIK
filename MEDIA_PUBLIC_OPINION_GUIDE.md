# DIPLOCRAFT — Fase 21 v1.7.3: Imprensa, Mídia e Opinião Pública

Esta fase expande a antiga aba de imprensa para um sistema estratégico de opinião pública. A implementação é aditiva e preserva a Fase 20.

## Sistemas adicionados

- `src/systems/media.js`: estado profundo de mídia, cálculo de humor público, hostilidade, credibilidade, risco de agenda, ciclo mensal, manchetes e efeitos de coletiva.
- `src/data/mediaData.js`: veículos, doutrinas, agendas públicas, coletivas, manchetes e ações estratégicas.
- `mediaPublic` no save: schema 1, histórico limitado a 36 meses e manchetes limitadas para evitar crescimento indefinido.
- Integração mensal no Core Loop 2.0: relatórios mensais agora registram `reports.monthly.media`.
- Interface na aba Imprensa com painéis de opinião pública, doutrina, agenda, veículos, manchetes, ações e histórico.

## Métricas principais

- Saúde da comunicação: média ponderada de humor, credibilidade, baixa hostilidade e baixo risco de agenda.
- Humor público: combina aprovação, economia, estabilidade, prestígio, confiança e clareza de políticas.
- Hostilidade da mídia: combina oposição, corrupção, crise, inflação, polarização, desinformação e pressão editorial.
- Credibilidade: combina confiança, liberdade de imprensa, clareza de política, confiança dos veículos e disciplina de mensagem.
- Risco de agenda: avalia se pautas negativas estão dominando o ciclo público.

## Doutrinas de comunicação

1. Prestação de Contas Transparente.
2. Explicação Técnica.
3. Escuta Regional.
4. Megafone Presidencial.

Cada doutrina altera atributos diferentes e não remove sistemas anteriores.

## Ações estratégicas

- Turnê de entrevistas.
- Campanha em rádios regionais.
- Gabinete de checagem.
- Campanha publicitária nacional.
- Portal de dados abertos.
- Treinamento de porta-vozes.
- Monitoramento social ético.
- Sala de imprensa independente.

Todas usam custo, pontos de ação, cooldown e efeitos profundos/legados.

## Compatibilidade

- Save schema preservado: 3.
- Chave preservada: `diplocraft_save_v101`.
- Assets preservados.
- PWA e service worker regenerados pela build truth.
- Documento de upload Git Bash preservado: `UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt`.

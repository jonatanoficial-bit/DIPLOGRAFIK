# Fase 13 — Save Architecture

A v1.4.0 substitui o save único por uma arquitetura local multiusuário e multicarreira.

## Entregas

- quatro perfis locais;
- três slots independentes por perfil;
- save schema 3 com chave histórica preservada;
- transação pendente e checksum por slot;
- snapshots, emergência e backups isolados;
- exportação/importação validada;
- histórico persistente;
- migração de saves anteriores;
- central responsiva para toque, mouse e teclado.

## Regras anti-quebra

Uma operação em um slot não pode alterar os dados de outro. O registro, os envelopes de save e os pacotes exportados possuem checksum. Saves inválidos são rejeitados ou colocados em quarentena conforme o fluxo de recuperação.

## Próximo marco

A Fase 14 reconstruirá o Core Loop 2.0, incluindo calendário político, compromissos, consequências atrasadas, recuperação de crises e estados reais de fim de mandato.

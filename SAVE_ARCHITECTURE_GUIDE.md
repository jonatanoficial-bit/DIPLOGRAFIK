# DIPLOCRAFT — Guia da Arquitetura de Saves v1.4.0

## Estrutura

A Fase 13 separa completamente as carreiras locais:

- até **4 perfis**;
- **3 slots de carreira** por perfil;
- até **12 carreiras locais**;
- 3 snapshots rotativos por slot;
- 1 snapshot de emergência por slot;
- até 5 backups manuais nomeados por slot;
- histórico limitado a 60 operações.

O slot ativo é o destino do autosave. Trocar o slot ativo não mistura dados entre carreiras.

## Central de Carreiras

Abra **CARREIRAS E SAVES** no menu principal ou na aba **Release**. A central permite:

1. criar, renomear e excluir perfis;
2. ativar, carregar, salvar, renomear ou limpar um slot;
3. criar, restaurar e excluir backups manuais;
4. exportar uma carreira em JSON;
5. importar uma carreira para o slot ativo;
6. consultar histórico e diagnóstico da arquitetura.

## Transferência para outro aparelho

Os saves permanecem no navegador ou PWA do aparelho. Para transferir:

1. abra a Central de Carreiras;
2. exporte o slot desejado;
3. copie o arquivo JSON para o outro aparelho;
4. abra o jogo no destino;
5. escolha o perfil e slot de destino;
6. use **IMPORTAR CARREIRA**.

O pacote contém checksum. Arquivos adulterados ou danificados são rejeitados.

## Migração das versões anteriores

Na primeira inicialização, a arquitetura procura saves antigos na chave histórica `diplocraft_save_v101`. Um save válido é migrado para **Perfil 1 / Carreira 1**. A build mantém uma cópia de rollback do envelope anterior.

## Recomendações

- Exporte uma carreira antes de limpar dados do navegador ou trocar de aparelho.
- Crie um backup manual antes de decisões importantes.
- Não edite o JSON exportado.
- Em navegação privada, o navegador pode apagar o armazenamento local ao encerrar a sessão.
- Sincronização em nuvem ainda não faz parte desta fase.

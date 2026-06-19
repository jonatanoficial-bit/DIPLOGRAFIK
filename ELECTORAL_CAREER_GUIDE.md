# DIPLOCRAFT — Fase 25 v1.7.7: Eleições, Carreira e Legado

Esta fase aprofunda o sistema eleitoral sem remover o sistema legado de campanhas. A nova camada `electoralCareer` acompanha a campanha como um processo de longo prazo, conectado ao mandato, às crises, à mídia, à economia e à governabilidade.

## Sistemas adicionados

- Estratégias eleitorais selecionáveis: frente ampla moderada, mobilização popular, campanha orientada por dados e legado institucional.
- Máquina de campanha: fundo eleitoral, voluntariado, estrutura territorial, mobilização digital, endossos de coalizão, unidade partidária, preparo para debates e eleitores indecisos.
- Segmentos do eleitorado: trabalhadores, classe média, empresariado, juventude, interior/agro e segurança pública.
- Projeção de primeiro turno, risco de segundo turno, caminho de vitória e risco de compliance.
- Linha do tempo de carreira e legado com marcos dos 100 dias, meio de mandato, janela eleitoral e eleição oficial.
- Ações estruturantes com custo, PA, cooldown e efeito atrasado.
- Registro de resultados eleitorais e histórico mensal limitado a 36 entradas para proteger saves.

## Compatibilidade

- Save schema preservado: 3.
- Chave preservada: `diplocraft_save_v101`.
- A migração é aditiva: saves antigos recebem `electoralCareer` sem perda de dados.
- O botão legado "simular eleição" permanece, mas agora considera a nova máquina eleitoral.

## Upload oficial

O arquivo `UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt` permanece na raiz do ZIP com o caminho correto para Git Bash.

export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Bem-vindo ao DIPLOCRAFT",
    text: "Você governa um país moderno. Cada decisão afeta aprovação, economia, estabilidade, mídia, Congresso, diplomacia e risco de crise.",
    tab: "dashboard",
    focus: ".hud"
  },
  {
    id: "dashboard",
    title: "Sala de Situação",
    text: "No painel inicial você acompanha os indicadores principais e toma decisões rápidas. Aprovação baixa aumenta risco político.",
    tab: "dashboard",
    focus: "#decisionDeck"
  },
  {
    id: "economy",
    title: "Economia Profunda",
    text: "A economia calcula PIB, inflação, desemprego, juros, dívida, setores produtivos e orçamento. Use medidas econômicas com cuidado.",
    tab: "economy",
    focus: "#econReport"
  },
  {
    id: "government",
    title: "Governo e Congresso",
    text: "Para aprovar leis você precisa de coalizão e capital político. Se a base racha, podem surgir CPI e impeachment.",
    tab: "government",
    focus: "#lawProjects"
  },
  {
    id: "press",
    title: "Imprensa e Opinião Pública",
    text: "Coletivas e manchetes moldam o humor público. Respostas agressivas podem mobilizar aliados, mas aumentam hostilidade.",
    tab: "press",
    focus: "#pressAnswers"
  },
  {
    id: "elections",
    title: "Eleições",
    text: "A eleição considera aprovação, economia, mídia, campanha, rejeição e regiões. Use ações de campanha antes da votação.",
    tab: "elections",
    focus: "#campaignActions"
  },
  {
    id: "crisis",
    title: "Crises Encadeadas",
    text: "Problemas ignorados escalam: inflação vira protesto, Congresso vira CPI, segurança vira ruptura. Responda antes do colapso.",
    tab: "crisis",
    focus: "#crisisActions"
  },
  {
    id: "scenario_tutorial",
    title: "Cenários guiados",
    text: "Na aba Progresso você encontra pacotes de cenário, trilhas de tutorial e missões de onboarding para aprender sistemas avançados sem quebrar a carreira.",
    tab: "progression",
    focus: "#scenarioTutorialOverview"
  },
  {
    id: "finish",
    title: "Primeiro mandato iniciado",
    text: "Agora avance dias, salve o jogo e tente sobreviver até a próxima eleição. O objetivo é manter poder, estabilidade e influência global.",
    tab: "dashboard",
    focus: "#advanceDay"
  }
];
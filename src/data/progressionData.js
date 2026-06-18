export const ACHIEVEMENTS = [
  { id:"first_week", title:"Primeira Semana", text:"Sobreviva aos primeiros 7 dias.", reward:{xp:20, prestige:1}, check:(s)=>s.day + (s.month-1)*30 + (s.year-2026)*360 >= 7 },
  { id:"stable_country", title:"País Estável", text:"Mantenha estabilidade acima de 70%.", reward:{xp:35, politicalCapital:5}, check:(s)=>s.stability >= 70 },
  { id:"popular_leader", title:"Líder Popular", text:"Alcance aprovação acima de 75%.", reward:{xp:40, prestige:3}, check:(s)=>s.approval >= 75 },
  { id:"economic_recovery", title:"Recuperação Econômica", text:"Alcance economia acima de 70%.", reward:{xp:45, treasury:80}, check:(s)=>s.economy >= 70 },
  { id:"law_maker", title:"Articulador Legislativo", text:"Aprove 3 leis.", reward:{xp:50, politicalCapital:8}, check:(s)=>(s.approvedLaws||[]).length >= 3 },
  { id:"treaty_master", title:"Diplomata Global", text:"Assine 3 tratados.", reward:{xp:50, prestige:4}, check:(s)=>(s.treaties||[]).length >= 3 },
  { id:"crisis_manager", title:"Gestor de Crise", text:"Controle uma crise encadeada.", reward:{xp:45, stability:3}, check:(s)=>(s.crisisHistory||[]).length >= 3 && (s.crisis||0) <= 2 },
  { id:"reelected", title:"Mandato Renovado", text:"Vença uma eleição.", reward:{xp:80, prestige:6, politicalCapital:12}, check:(s)=>s.lastElection && s.lastElection.incumbentVote >= 50 }
];

export const MANDATE_GOALS = [
  { id:"approval_goal", title:"Aprovação nacional", target:"approval", threshold:65, reward:{xp:25, prestige:2} },
  { id:"economy_goal", title:"Economia aquecida", target:"economy", threshold:65, reward:{xp:25, treasury:60} },
  { id:"stability_goal", title:"Estabilidade institucional", target:"stability", threshold:68, reward:{xp:25, politicalCapital:5} },
  { id:"influence_goal", title:"Influência global", target:"influence", threshold:60, reward:{xp:25, prestige:3} },
  { id:"low_crisis_goal", title:"Crises sob controle", target:"crisis", threshold:2, reverse:true, reward:{xp:30, stability:3} }
];

export const UNLOCKS = [
  { id:"advanced_economy", title:"Pacotes Econômicos Avançados", level:3 },
  { id:"special_diplomacy", title:"Cúpulas Estratégicas", level:4 },
  { id:"intelligence_plus", title:"Operações de Inteligência Avançadas", level:5 },
  { id:"crisis_elite", title:"Gabinete Premium de Crise", level:6 }
];

export const DAILY_REWARDS = [
  { day:1, title:"Briefing diário", reward:{xp:10, politicalCapital:2} },
  { day:2, title:"Apoio técnico", reward:{xp:10, treasury:25} },
  { day:3, title:"Reforço de comunicação", reward:{xp:12, media:2} },
  { day:4, title:"Agenda regional", reward:{xp:12, coalition:2} },
  { day:5, title:"Missão internacional", reward:{xp:14, prestige:2} },
  { day:6, title:"Força-tarefa", reward:{xp:14, stability:2} },
  { day:7, title:"Bônus semanal", reward:{xp:25, politicalCapital:5, treasury:50} }
];
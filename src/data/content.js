export const DECISIONS = [
  { id:"jobs", area:"economy", title:"Plano Nacional de Empregos", text:"Gera empregos e aquece a economia, mas aumenta gastos no curto prazo.", cost:90, cooldown:5, effects:{economy:5, approval:3, debt:2, unemployment:-1.2, treasury:-90} },
  { id:"tax", area:"economy", title:"Reforma de arrecadação", text:"Aumenta receita e melhora confiança fiscal, porém desgasta setores produtivos.", cost:0, cooldown:7, effects:{treasury:120, approval:-3, elite:-2, debt:-2, economy:1} },
  { id:"social", area:"government", title:"Pacote social emergencial", text:"Reduz tensão social e melhora aprovação. O custo fiscal é alto.", cost:110, cooldown:8, effects:{approval:6, stability:3, poverty:-4, treasury:-110, debt:2} },
  { id:"coalition", area:"government", title:"Negociar coalizão", text:"Entrega cargos e aumenta governabilidade. Pode elevar percepção de fisiologismo.", cost:30, cooldown:4, effects:{coalition:7, politicalCapital:-6, corruption:2, treasury:-30} },
  { id:"speech", area:"press", title:"Pronunciamento à nação", text:"Tenta controlar a narrativa e reposicionar o governo.", cost:10, cooldown:3, effects:{media:4, approval:2, politicalCapital:-2, treasury:-10} },
  { id:"summit", area:"diplomacy", title:"Cúpula diplomática regional", text:"Melhora influência internacional e abre comércio.", cost:55, cooldown:9, effects:{diplomacy:6, influence:4, economy:2, treasury:-55} },
  { id:"defense", area:"military", title:"Modernizar defesa nacional", text:"Aumenta defesa e dissuasão, mas pressiona orçamento.", cost:140, cooldown:12, effects:{military:7, influence:3, treasury:-140, debt:1} },
  { id:"intel", area:"intelligence", title:"Operação anticorrupção sigilosa", text:"Reduz corrupção e risco de escândalos, mas irrita aliados.", cost:60, cooldown:10, effects:{intelligence:6, corruption:-5, coalition:-2, treasury:-60} }
];

export const EVENT_POOL = [
  { id:"market_good", title:"Mercado reage positivamente", text:"Investidores valorizam a previsibilidade do governo.", type:"positive", effects:{economy:3, treasury:45, elite:3} },
  { id:"protest", title:"Protestos nas capitais", text:"Movimentos populares cobram resposta imediata.", type:"negative", effects:{approval:-4, stability:-4, crisis:1} },
  { id:"leak", title:"Vazamento na imprensa", text:"Documentos internos criam desgaste político.", type:"negative", effects:{media:-5, approval:-3, corruption:2, crisis:1} },
  { id:"diplomatic_win", title:"Vitória diplomática", text:"Acordo internacional melhora imagem do país.", type:"positive", effects:{influence:5, diplomacy:4, prestige:3} },
  { id:"inflation", title:"Inflação pressiona famílias", text:"Alta de preços reduz aprovação e aumenta risco social.", type:"negative", effects:{inflation:0.5, approval:-3, stability:-2} },
  { id:"congress", title:"Congresso cobra articulação", text:"A base exige participação em projetos estratégicos.", type:"warning", effects:{coalition:-3, politicalCapital:-3} }
];

export const PROJECTS = [
  { id:"rail", title:"Corredor Nacional de Infraestrutura", days:25, cost:220, effects:{economy:7, approval:3, prestige:2, industry:2} },
  { id:"health", title:"Mutirão Nacional de Saúde", days:18, cost:130, effects:{approval:6, stability:3} },
  { id:"tech", title:"Programa Brasil Tecnologia", days:28, cost:180, effects:{technology:8, economy:4, influence:2} },
  { id:"green", title:"Energia Limpa e Soberania", days:24, cost:160, effects:{environment:9, diplomacy:3, approval:2, energy:3} }
];

export const PRESS_QUESTIONS = [
  { q:"Presidente, a população cobra resultados rápidos. Qual sua resposta?", answers:[
    {label:"Assumir metas públicas e prazos claros", effects:{approval:3, media:3, politicalCapital:-2}},
    {label:"Culpar sabotagem da oposição", effects:{approval:-2, opposition:4, media:-2}},
    {label:"Anunciar pacote econômico emergencial", effects:{approval:2, economy:2, treasury:-40}}
  ]},
  { q:"A dívida pública preocupa o mercado. O governo fará cortes?", answers:[
    {label:"Equilibrar responsabilidade fiscal e proteção social", effects:{economy:2, approval:1, media:2}},
    {label:"Corte duro e imediato de gastos", effects:{economy:4, approval:-5, elite:5}},
    {label:"Negar risco fiscal", effects:{media:-4, stability:-2}}
  ]}
];
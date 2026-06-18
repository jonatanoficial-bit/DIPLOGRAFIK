export const MEDIA_OUTLETS = [
  { id:"tvnacional", name:"TV Nacional", type:"televisão", reach:88, stance:52, trust:64 },
  { id:"jornaldacapital", name:"Jornal da Capital", type:"jornal", reach:62, stance:48, trust:71 },
  { id:"redepopular", name:"Rede Popular", type:"social", reach:74, stance:56, trust:45 },
  { id:"mercadonews", name:"Mercado News", type:"economia", reach:54, stance:44, trust:68 },
  { id:"radiointerior", name:"Rádio Interior", type:"rádio", reach:49, stance:51, trust:59 },
  { id:"mundo24", name:"Mundo 24", type:"internacional", reach:58, stance:50, trust:66 }
];

export const PRESS_BRIEFINGS = [
  {
    id:"economy_pressure",
    topic:"Economia",
    question:"Presidente, a inflação ainda preocupa as famílias. O governo tem controle da situação?",
    answers:[
      { tone:"diplomático", label:"Reconhecer o problema e apresentar metas transparentes.", effects:{media:4, approval:2, marketConfidence:1, politicalCapital:-2} },
      { tone:"técnico", label:"Explicar medidas de juros, orçamento e investimento produtivo.", effects:{marketConfidence:4, media:2, approval:1} },
      { tone:"agressivo", label:"Acusar adversários de sabotarem a recuperação econômica.", effects:{approval:-2, opposition:4, media:-4, stability:-1} },
      { tone:"populista", label:"Prometer alívio imediato nos preços com subsídios.", effects:{approval:4, inflation:-0.2, treasury:-70, debt:2} }
    ]
  },
  {
    id:"corruption_pressure",
    topic:"Escândalos",
    question:"Há denúncias envolvendo aliados do governo. O senhor vai afastar os envolvidos?",
    answers:[
      { tone:"ético", label:"Afastar suspeitos e abrir investigação pública.", effects:{corruption:-5, media:4, coalition:-4, approval:3} },
      { tone:"cauteloso", label:"Aguardar investigação antes de qualquer punição.", effects:{media:-1, coalition:2, corruption:1} },
      { tone:"agressivo", label:"Dizer que é perseguição política da oposição.", effects:{opposition:5, media:-5, approval:-3} },
      { tone:"institucional", label:"Encaminhar o caso à Justiça e preservar governabilidade.", effects:{stability:2, media:2, coalition:-1, corruption:-1} }
    ]
  },
  {
    id:"security_pressure",
    topic:"Segurança",
    question:"A população cobra uma resposta contra a criminalidade. Qual será a prioridade?",
    answers:[
      { tone:"duro", label:"Anunciar operação nacional de segurança.", effects:{stability:4, military:2, approval:2, treasury:-40} },
      { tone:"social", label:"Unir segurança, educação e emprego.", effects:{approval:3, stability:2, treasury:-55, economy:1} },
      { tone:"federativo", label:"Convocar governadores para pacto nacional.", effects:{coalition:2, stability:3, politicalCapital:-3} },
      { tone:"evasivo", label:"Dizer que o tema é responsabilidade dos estados.", effects:{approval:-4, media:-3, stability:-2} }
    ]
  }
];

export const HEADLINE_TEMPLATES = [
  { type:"positive", text:"Governo ganha fôlego após decisão estratégica" },
  { type:"positive", text:"Mercado vê melhora no cenário político" },
  { type:"warning", text:"Congresso cobra articulação do Planalto" },
  { type:"warning", text:"Especialistas alertam para risco fiscal" },
  { type:"negative", text:"Crise desgasta imagem do presidente" },
  { type:"negative", text:"Oposição amplia pressão por investigação" }
];

export const MEDIA_ACTIONS = [
  { id:"media_tour", title:"Turnê de entrevistas", text:"Aumenta exposição positiva e aproxima o governo do público.", cooldown:6, cost:25, effects:{media:5, approval:2, treasury:-25} },
  { id:"regional_radio", title:"Campanha em rádios regionais", text:"Melhora presença fora das capitais e reduz ruído político.", cooldown:5, cost:18, effects:{approval:2, stability:1, treasury:-18} },
  { id:"fact_check", title:"Gabinete de checagem", text:"Combate fake news e protege imagem institucional.", cooldown:8, cost:35, effects:{media:4, stability:2, crisis:-1, treasury:-35} },
  { id:"ad_campaign", title:"Campanha publicitária nacional", text:"Gera ganho rápido de aprovação, mas pode ser criticada como propaganda.", cooldown:10, cost:85, effects:{approval:5, media:3, treasury:-85, corruption:1} }
];
export const AI_COUNTRIES = [
  {
    id:"usa", name:"Estados Unidos", bloc:"Ocidente", personality:"dominante", economy:88, military:92, tradeNeed:58, ideology:"liberal",
    interests:["segurança hemisférica","energia","tecnologia"], relation:54, tension:28
  },
  {
    id:"china", name:"China", bloc:"Ásia", personality:"estratégica", economy:94, military:78, tradeNeed:86, ideology:"pragmática",
    interests:["comércio","infraestrutura","tecnologia"], relation:48, tension:34
  },
  {
    id:"ue", name:"União Europeia", bloc:"Europa", personality:"regulatória", economy:82, military:55, tradeNeed:64, ideology:"institucional",
    interests:["clima","direitos","comércio"], relation:56, tension:22
  },
  {
    id:"arg", name:"Argentina", bloc:"Regional", personality:"instável", economy:45, military:38, tradeNeed:72, ideology:"regional",
    interests:["mercosul","energia","agro"], relation:62, tension:24
  },
  {
    id:"rus", name:"Rússia", bloc:"Eurásia", personality:"militarizada", economy:56, military:86, tradeNeed:44, ideology:"soberanista",
    interests:["defesa","energia","geopolítica"], relation:39, tension:52
  },
  {
    id:"ind", name:"Índia", bloc:"Ásia", personality:"emergente", economy:73, military:68, tradeNeed:70, ideology:"multialinhada",
    interests:["tecnologia","comércio","energia"], relation:51, tension:30
  }
];

export const TREATIES = [
  { id:"trade", title:"Acordo Comercial", text:"Aumenta comércio e PIB, mas pode gerar dependência externa.", cost:35, cooldown:8, effects:{tradeBalance:4, economy:2, influence:2} },
  { id:"defense", title:"Cooperação de Defesa", text:"Aumenta poder militar e influência, mas eleva tensão com rivais.", cost:50, cooldown:10, effects:{military:3, influence:3, globalTension:2} },
  { id:"climate", title:"Tratado Climático", text:"Melhora ambiente e imagem internacional.", cost:45, cooldown:9, effects:{environment:5, diplomacy:4, prestige:2} },
  { id:"tech", title:"Pacto Tecnológico", text:"Acelera tecnologia e produtividade.", cost:60, cooldown:12, effects:{technology:5, economy:2, influence:2} }
];

export const DIPLOMACY_ACTIONS = [
  { id:"summit", title:"Cúpula presidencial", text:"Melhora relações com vários países e reduz tensão geral.", cost:70, cooldown:10, effects:{diplomacy:5, influence:3, globalTension:-3, treasury:-70} },
  { id:"mercosul", title:"Reativar agenda regional", text:"Fortalece vizinhos e comércio regional.", cost:40, cooldown:8, effects:{tradeBalance:2, diplomacy:4, influence:2, treasury:-40} },
  { id:"neutrality", title:"Doutrina de neutralidade ativa", text:"Reduz tensão com blocos rivais, mas diminui ganhos militares.", cost:15, cooldown:12, effects:{globalTension:-5, diplomacy:3, military:-1, treasury:-15} },
  { id:"sanction_package", title:"Pacote de sanções seletivas", text:"Pressiona país hostil e agrada aliados, mas eleva tensão.", cost:10, cooldown:10, effects:{influence:2, globalTension:5, tradeBalance:-2, treasury:-10} }
];

export const INTERNATIONAL_EVENTS = [
  { id:"commodity_boom", title:"Alta global de commodities", text:"Exportadores ganham força e parceiros buscam acordos.", effects:{tradeBalance:4, agribusiness:3, economy:2}, type:"positive" },
  { id:"border_tension", title:"Tensão regional na fronteira", text:"Vizinhos cobram posição brasileira.", effects:{globalTension:4, stability:-1, diplomacy:-2}, type:"warning" },
  { id:"sanctions_wave", title:"Nova rodada de sanções globais", text:"Comércio internacional fica mais arriscado.", effects:{tradeBalance:-3, marketConfidence:-2, globalTension:4}, type:"negative" },
  { id:"climate_forum", title:"Fórum climático internacional", text:"Países avaliam compromissos ambientais.", effects:{environment:2, diplomacy:2, prestige:1}, type:"positive" }
];
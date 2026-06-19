export const nationalRegionId = id => id;

export const REGIONS = [
  { id:"norte", name:"Norte", voters:8, leaning:"regional", approvalBias:2, economyWeight:0.18 },
  { id:"nordeste", name:"Nordeste", voters:27, leaning:"social", approvalBias:5, economyWeight:0.16 },
  { id:"centro_oeste", name:"Centro-Oeste", voters:8, leaning:"agro", approvalBias:-1, economyWeight:0.22 },
  { id:"sudeste", name:"Sudeste", voters:43, leaning:"mercado", approvalBias:-2, economyWeight:0.24 },
  { id:"sul", name:"Sul", voters:14, leaning:"seguranca", approvalBias:-3, economyWeight:0.2 }
];

export const OPPONENTS = [
  { id:"liberal", name:"Helena Duarte", party:"Aliança Liberal", strength:56, profile:"mercado", rejection:32 },
  { id:"conservative", name:"Roberto Malta", party:"Frente Nacional", strength:52, profile:"segurança", rejection:38 },
  { id:"social", name:"Marina Torres", party:"Frente Popular", strength:49, profile:"social", rejection:29 }
];

export const CAMPAIGN_ACTIONS = [
  { id:"rally", title:"Comício nacional", text:"Aumenta campanha e mobilização popular.", cost:45, cooldown:5, effects:{campaign:6, approval:2, treasury:-45} },
  { id:"digital", title:"Campanha digital segmentada", text:"Melhora alcance e disputa narrativa nas redes.", cost:35, cooldown:4, effects:{campaign:4, media:3, govNarrative:4, treasury:-35} },
  { id:"debate", title:"Debate presidencial", text:"Alto risco: pode gerar grande ganho ou desgaste.", cost:10, cooldown:8, debate:true },
  { id:"alliances", title:"Costurar alianças eleitorais", text:"Amplia tempo de campanha e base regional.", cost:30, cooldown:7, effects:{campaign:5, coalition:3, politicalCapital:-5, treasury:-30} },
  { id:"regional_trip", title:"Caravana regional", text:"Ganha votos fora da capital e reduz rejeição.", cost:50, cooldown:6, effects:{campaign:4, approval:2, rejection:-3, treasury:-50} }
];
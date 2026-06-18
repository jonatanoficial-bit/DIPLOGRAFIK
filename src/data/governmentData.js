export const CONGRESS_PARTIES = [
  { id:"mdb", sigla:"MDB", seats:46, leaning:"centro", loyalty:55, demand:"Cargos regionais" },
  { id:"pt", sigla:"PT", seats:68, leaning:"social", loyalty:50, demand:"Agenda social" },
  { id:"pl", sigla:"PL", seats:92, leaning:"conservador", loyalty:35, demand:"Segurança e costumes" },
  { id:"psd", sigla:"PSD", seats:54, leaning:"centro", loyalty:52, demand:"Infraestrutura" },
  { id:"uniao", sigla:"UNIÃO", seats:59, leaning:"centro", loyalty:48, demand:"Mercado e cargos" },
  { id:"pp", sigla:"PP", seats:49, leaning:"centro", loyalty:47, demand:"Obras e orçamento" },
  { id:"psdb", sigla:"PSDB", seats:13, leaning:"centro", loyalty:42, demand:"Gestão e reformas" },
  { id:"psol", sigla:"PSOL", seats:14, leaning:"social", loyalty:30, demand:"Direitos sociais" }
];

export const LAW_PROJECTS = [
  { id:"fiscal", title:"Novo Arcabouço Fiscal", text:"Melhora confiança e reduz dívida, mas desgasta popularidade.", difficulty:58, costPolitical:10, effects:{marketConfidence:5, debt:-3, approval:-2, economy:2} },
  { id:"security", title:"Pacote Nacional de Segurança", text:"Aumenta estabilidade e apoio conservador, mas pode tensionar oposição.", difficulty:52, costPolitical:9, effects:{stability:4, military:2, approval:1, opposition:2} },
  { id:"education", title:"Plano Educação 2030", text:"Melhora aprovação e produtividade futura.", difficulty:48, costPolitical:8, effects:{approval:3, technology:2, services:2, treasury:-60} },
  { id:"tax_reform", title:"Reforma Tributária", text:"Aumenta eficiência econômica, mas exige ampla coalizão.", difficulty:70, costPolitical:16, effects:{economy:4, marketConfidence:3, politicalCapital:-2} },
  { id:"anti_corruption", title:"Lei Anticorrupção Ampliada", text:"Reduz corrupção e melhora mídia, mas irrita aliados fisiológicos.", difficulty:64, costPolitical:12, effects:{corruption:-6, media:3, coalition:-3, approval:2} }
];

export const MINISTERS = [
  { id:"civil", name:"Casa Civil", skill:"articulação", performance:56, risk:28 },
  { id:"economy", name:"Economia", skill:"mercado", performance:54, risk:32 },
  { id:"justice", name:"Justiça", skill:"crise", performance:50, risk:35 },
  { id:"defense", name:"Defesa", skill:"militar", performance:58, risk:22 },
  { id:"health", name:"Saúde", skill:"popularidade", performance:52, risk:30 },
  { id:"education", name:"Educação", skill:"futuro", performance:48, risk:34 }
];

export const GOVERNMENT_ACTIONS = [
  { id:"release_budget", title:"Liberar emendas parlamentares", text:"Aumenta coalizão rapidamente, mas custa caro e eleva crítica pública.", cooldown:6, cost:70, effects:{coalition:7, treasury:-70, corruption:2, approval:-1} },
  { id:"cabinet_meeting", title:"Reunião ministerial de emergência", text:"Melhora coordenação do governo e reduz risco institucional.", cooldown:5, cost:10, effects:{stability:3, politicalCapital:3, treasury:-10} },
  { id:"opposition_dialogue", title:"Abrir diálogo com oposição", text:"Reduz tensão e risco de CPI, mas desagrada parte da base.", cooldown:7, cost:0, effects:{opposition:-5, stability:3, coalition:-1} },
  { id:"public_ethics", title:"Pacto público de integridade", text:"Ataca corrupção e melhora imprensa, mas pode expor aliados.", cooldown:10, cost:20, effects:{corruption:-4, media:3, coalition:-2, treasury:-20} }
];
export const ECONOMIC_SECTORS = [
  { id:"industry", name:"Indústria", icon:"🏭", gdpWeight:0.24, jobsWeight:0.22, sensitivity:"interest" },
  { id:"agribusiness", name:"Agro", icon:"🌾", gdpWeight:0.19, jobsWeight:0.13, sensitivity:"trade" },
  { id:"services", name:"Serviços", icon:"🏙", gdpWeight:0.42, jobsWeight:0.48, sensitivity:"demand" },
  { id:"technology", name:"Tecnologia", icon:"💠", gdpWeight:0.08, jobsWeight:0.07, sensitivity:"investment" },
  { id:"energy", name:"Energia", icon:"⚡", gdpWeight:0.07, jobsWeight:0.04, sensitivity:"inflation" }
];

export const TAX_PROFILES = [
  { id:"balanced", name:"Equilibrado", effects:{ taxBurden:0, approval:0, economy:0, inequality:0 } },
  { id:"pro_market", name:"Pró-mercado", effects:{ taxBurden:-3, approval:-1, economy:3, inequality:2, elite:4 } },
  { id:"progressive", name:"Progressivo", effects:{ taxBurden:2, approval:3, economy:-1, inequality:-4, elite:-3 } },
  { id:"austerity", name:"Austeridade", effects:{ publicSpending:-5, debt:-4, approval:-5, economy:1, marketConfidence:5 } }
];

export const ECONOMIC_MEASURES = [
  { id:"cut_interest", title:"Pressionar corte de juros", text:"Estimula crédito e crescimento, mas pode pressionar inflação.", cooldown:8, cost:0, effects:{ interestRate:-0.6, economy:3, inflation:0.4, marketConfidence:-1 } },
  { id:"raise_interest", title:"Elevar juros para conter inflação", text:"Reduz inflação e acalma mercado, mas segura crescimento.", cooldown:8, cost:0, effects:{ interestRate:0.7, inflation:-0.5, economy:-2, marketConfidence:2 } },
  { id:"infra_bonds", title:"Emitir títulos para infraestrutura", text:"Financia obras grandes com dívida futura.", cooldown:12, cost:0, effects:{ treasury:180, debt:3, economy:4, marketConfidence:-2 } },
  { id:"export_plan", title:"Plano nacional de exportações", text:"Melhora balança comercial e agroindústria.", cooldown:10, cost:50, effects:{ tradeBalance:3, agribusiness:4, industry:2, treasury:-50 } },
  { id:"anti_inflation", title:"Pacote anti-inflação", text:"Reduz pressão de preços com custo fiscal.", cooldown:10, cost:95, effects:{ inflation:-0.8, approval:2, treasury:-95, debt:1 } },
  { id:"startup_credit", title:"Crédito para tecnologia", text:"Impulsiona tecnologia, produtividade e empregos qualificados.", cooldown:14, cost:85, effects:{ technology:5, economy:2, unemployment:-0.3, treasury:-85, productivity:1.1, privateInvestment:0.9 } },
  { id:"tax_compliance", title:"Mutirão de conformidade tributária", text:"Reduz informalidade e aumenta receita sem elevar a carga nominal.", cooldown:16, cost:35, effects:{ treasury:-35, informalEconomy:-2.2, primaryRevenue:28, marketConfidence:1.1, corruption:-0.4 } },
  { id:"cost_of_living_shield", title:"Escudo de custo de vida", text:"Protege renda básica e suaviza inflação percebida nas famílias.", cooldown:18, cost:75, effects:{ treasury:-75, costOfLiving:-2.4, approval:1.8, inequality:-0.7, debt:0.3 } }
];
export const CRISIS_CHAINS = [
  {
    id:"inflation_chain",
    title:"Crise Inflacionária",
    trigger:(s)=>s.inflation > 9,
    stages:[
      { level:1, title:"Preços sobem", text:"Famílias sentem alta no custo de vida.", effects:{approval:-2, stability:-1} },
      { level:2, title:"Protestos por alimentos", text:"Mobilizações exigem controle de preços.", effects:{approval:-4, stability:-3, crisis:1} },
      { level:3, title:"Greve nacional", text:"Sindicatos e oposição ampliam pressão.", effects:{economy:-4, stability:-5, coalition:-3, crisis:1} },
      { level:4, title:"Crise social", text:"Risco de colapso político e ruptura institucional.", effects:{approval:-6, stability:-7, politicalCapital:-8, crisis:2} }
    ],
    solutions:["anti_inflation","social","opposition_dialogue"]
  },
  {
    id:"congress_chain",
    title:"Crise Parlamentar",
    trigger:(s)=>s.coalition < 38 || (s.congressPressure || 0) > 70,
    stages:[
      { level:1, title:"Base insatisfeita", text:"Partidos cobram espaço no governo.", effects:{coalition:-2, politicalCapital:-2} },
      { level:2, title:"Pauta-bomba", text:"Congresso ameaça votar medidas contra o governo.", effects:{economy:-2, stability:-3, politicalCapital:-4} },
      { level:3, title:"CPI instalada", text:"Oposição inicia investigação de alto impacto.", effects:{media:-4, approval:-4, corruption:2, crisis:1} },
      { level:4, title:"Pedido de impeachment", text:"O governo entra em sobrevivência política.", effects:{stability:-8, approval:-6, politicalCapital:-10, crisis:2} }
    ],
    solutions:["release_budget","opposition_dialogue","cabinet_meeting"]
  },
  {
    id:"media_scandal_chain",
    title:"Escândalo Midiático",
    trigger:(s)=>s.corruption > 45 || (s.media < 35 && s.corruption > 30),
    stages:[
      { level:1, title:"Rumores na imprensa", text:"Jornalistas investigam aliados do Planalto.", effects:{media:-2, approval:-1} },
      { level:2, title:"Vazamento de documentos", text:"Denúncias ocupam manchetes nacionais.", effects:{media:-5, approval:-4, corruption:2} },
      { level:3, title:"Crise de confiança", text:"A população passa a duvidar da integridade do governo.", effects:{approval:-6, stability:-4, coalition:-3, crisis:1} },
      { level:4, title:"Colapso de narrativa", text:"O governo perde controle da agenda pública.", effects:{media:-8, approval:-7, politicalCapital:-6, crisis:2} }
    ],
    solutions:["fact_check","public_ethics","counter_corruption"]
  },
  {
    id:"security_chain",
    title:"Crise de Segurança",
    trigger:(s)=>s.security < 38 || (s.coupRisk || 0) > 55,
    stages:[
      { level:1, title:"Aumento de tensão interna", text:"Forças de segurança relatam desgaste operacional.", effects:{stability:-2, security:-2} },
      { level:2, title:"Operações descoordenadas", text:"Estados e governo federal entram em conflito operacional.", effects:{approval:-3, stability:-4, crisis:1} },
      { level:3, title:"Ruído nos quartéis", text:"Setores militares pressionam publicamente o governo.", effects:{loyalty:-6, stability:-5, media:-3} },
      { level:4, title:"Risco de ruptura", text:"Instituições entram em alerta máximo.", effects:{stability:-10, approval:-6, crisis:2, politicalCapital:-8} }
    ],
    solutions:["readiness_drill","border_operation","cabinet_meeting"]
  },
  {
    id:"international_chain",
    title:"Crise Internacional",
    trigger:(s)=>(s.globalTension || 0) > 65 || (s.tradeBalance || 50) < 30,
    stages:[
      { level:1, title:"Tensão diplomática", text:"Parceiros cobram posicionamento do Brasil.", effects:{diplomacy:-2, influence:-1} },
      { level:2, title:"Ameaça de sanções", text:"A relação comercial fica instável.", effects:{tradeBalance:-4, marketConfidence:-3, economy:-2} },
      { level:3, title:"Choque externo", text:"Exportações e investimentos sofrem queda.", effects:{economy:-5, treasury:-80, approval:-3, crisis:1} },
      { level:4, title:"Isolamento estratégico", text:"O país perde influência e enfrenta pressão econômica.", effects:{influence:-8, economy:-6, stability:-4, crisis:2} }
    ],
    solutions:["summit","neutrality","trade"]
  }
];

export const CRISIS_ACTIONS = [
  { id:"national_address", title:"Pronunciamento emergencial", text:"Tenta acalmar a população e reduzir pânico.", cost:10, cooldown:5, effects:{approval:2, media:2, crisis:-0.5, treasury:-10} },
  { id:"emergency_budget", title:"Orçamento emergencial", text:"Libera recursos para conter danos imediatos.", cost:120, cooldown:8, effects:{stability:4, approval:2, crisis:-1, treasury:-120, debt:2} },
  { id:"crisis_cabinet", title:"Gabinete nacional de crise", text:"Coordena ministérios e reduz chance de escalada.", cost:35, cooldown:7, effects:{stability:4, politicalCapital:2, crisis:-1, treasury:-35} },
  { id:"negotiate_pact", title:"Pacto institucional", text:"Negocia com Congresso, STF, governadores e setores sociais.", cost:40, cooldown:10, effects:{coalition:4, opposition:-3, stability:5, crisis:-1, treasury:-40} },
  { id:"technical_plan", title:"Plano técnico de estabilização", text:"Reduz causas estruturais, mas demora a gerar efeito popular.", cost:70, cooldown:12, effects:{economy:3, marketConfidence:3, inflation:-0.4, crisis:-0.5, treasury:-70} }
];
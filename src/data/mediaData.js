export const MEDIA_SCHEMA = 1;

export const MEDIA_OUTLET_PROFILES = [
  { id:"tvnacional", icon:"📺", nameKey:"media.outlet.tv.name", textKey:"media.outlet.tv.text", typeKey:"media.type.tv", reach:88, stance:52, trust:64, volatility:28 },
  { id:"jornaldacapital", icon:"📰", nameKey:"media.outlet.capital.name", textKey:"media.outlet.capital.text", typeKey:"media.type.newspaper", reach:62, stance:48, trust:71, volatility:22 },
  { id:"redepopular", icon:"📱", nameKey:"media.outlet.social.name", textKey:"media.outlet.social.text", typeKey:"media.type.social", reach:74, stance:56, trust:45, volatility:46 },
  { id:"mercadonews", icon:"💹", nameKey:"media.outlet.market.name", textKey:"media.outlet.market.text", typeKey:"media.type.economy", reach:54, stance:44, trust:68, volatility:31 },
  { id:"radiointerior", icon:"📻", nameKey:"media.outlet.radio.name", textKey:"media.outlet.radio.text", typeKey:"media.type.radio", reach:49, stance:51, trust:59, volatility:20 },
  { id:"mundo24", icon:"🌐", nameKey:"media.outlet.world.name", textKey:"media.outlet.world.text", typeKey:"media.type.international", reach:58, stance:50, trust:66, volatility:26 },
  { id:"agenciafatos", icon:"✓", nameKey:"media.outlet.facts.name", textKey:"media.outlet.facts.text", typeKey:"media.type.factcheck", reach:37, stance:50, trust:75, volatility:18 },
  { id:"influencers", icon:"⚡", nameKey:"media.outlet.influencers.name", textKey:"media.outlet.influencers.text", typeKey:"media.type.influencer", reach:69, stance:49, trust:39, volatility:54 }
];

export const MEDIA_DOCTRINES = [
  { id:"transparent_accountability", nameKey:"media.doctrine.transparent.name", textKey:"media.doctrine.transparent.text", effects:{ pressFreedom:4, transparency:4, narrativeControl:-2, trust:3, scandalAttention:1, media:2 } },
  { id:"technical_explanation", nameKey:"media.doctrine.technical.name", textKey:"media.doctrine.technical.text", effects:{ messageDiscipline:5, policyClarity:5, businessAudience:3, publicMood:-1, media:1 } },
  { id:"regional_listening", nameKey:"media.doctrine.regional.name", textKey:"media.doctrine.regional.text", effects:{ regionalReach:6, publicMood:2, polarization:-2, messageDiscipline:-1, approval:1 } },
  { id:"presidential_megaphone", nameKey:"media.doctrine.megaphone.name", textKey:"media.doctrine.megaphone.text", effects:{ narrativeControl:6, socialReach:5, polarization:5, pressFreedom:-2, media:-1, govNarrative:3 } }
];

export const MEDIA_AGENDAS = [
  { id:"economy", icon:"💰", nameKey:"media.agenda.economy.name", textKey:"media.agenda.economy.text", weightKey:"economy", pressureKey:"inflation" },
  { id:"integrity", icon:"⚖️", nameKey:"media.agenda.integrity.name", textKey:"media.agenda.integrity.text", weightKey:"corruption", pressureKey:"scandalAttention" },
  { id:"security", icon:"🛡️", nameKey:"media.agenda.security.name", textKey:"media.agenda.security.text", weightKey:"security", pressureKey:"crisis" },
  { id:"social", icon:"👥", nameKey:"media.agenda.social.name", textKey:"media.agenda.social.text", weightKey:"approval", pressureKey:"inequality" },
  { id:"institutions", icon:"🏛️", nameKey:"media.agenda.institutions.name", textKey:"media.agenda.institutions.text", weightKey:"stability", pressureKey:"institutionalRisk" },
  { id:"cabinet", icon:"🧭", nameKey:"media.agenda.cabinet.name", textKey:"media.agenda.cabinet.text", weightKey:"delivery", pressureKey:"cabinetRisk" }
];

export const PRESS_BRIEFINGS = [
  {
    id:"economy_pressure",
    topic:"Economia",
    topicKey:"media.briefing.economy.topic",
    question:"Presidente, a inflação ainda preocupa as famílias. O governo tem controle da situação?",
    questionKey:"media.briefing.economy.question",
    answers:[
      { tone:"diplomático", toneKey:"media.tone.diplomatic", label:"Reconhecer o problema e apresentar metas transparentes.", labelKey:"media.answer.economy.transparent", effects:{media:4, approval:2, marketConfidence:1, politicalCapital:-2, policyClarity:2, trust:2} },
      { tone:"técnico", toneKey:"media.tone.technical", label:"Explicar medidas de juros, orçamento e investimento produtivo.", labelKey:"media.answer.economy.technical", effects:{marketConfidence:4, media:2, approval:1, policyClarity:3, businessAudience:2} },
      { tone:"agressivo", toneKey:"media.tone.aggressive", label:"Acusar adversários de sabotarem a recuperação econômica.", labelKey:"media.answer.economy.aggressive", effects:{approval:-2, opposition:4, media:-4, stability:-1, polarization:4, disinformationRisk:1} },
      { tone:"populista", toneKey:"media.tone.populist", label:"Prometer alívio imediato nos preços com subsídios.", labelKey:"media.answer.economy.populist", effects:{approval:4, inflation:-0.2, treasury:-70, debt:2, publicMood:2, fiscalCredibility:-2} }
    ]
  },
  {
    id:"corruption_pressure",
    topic:"Escândalos",
    topicKey:"media.briefing.corruption.topic",
    question:"Há denúncias envolvendo aliados do governo. O senhor vai afastar os envolvidos?",
    questionKey:"media.briefing.corruption.question",
    answers:[
      { tone:"ético", toneKey:"media.tone.ethical", label:"Afastar suspeitos e abrir investigação pública.", labelKey:"media.answer.corruption.ethical", effects:{corruption:-5, media:4, coalition:-4, approval:3, transparency:3, scandalAttention:-2} },
      { tone:"cauteloso", toneKey:"media.tone.cautious", label:"Aguardar investigação antes de qualquer punição.", labelKey:"media.answer.corruption.cautious", effects:{media:-1, coalition:2, corruption:1, scandalAttention:2} },
      { tone:"agressivo", toneKey:"media.tone.aggressive", label:"Dizer que é perseguição política da oposição.", labelKey:"media.answer.corruption.aggressive", effects:{opposition:5, media:-5, approval:-3, polarization:4, pressFreedom:-1} },
      { tone:"institucional", toneKey:"media.tone.institutional", label:"Encaminhar o caso à Justiça e preservar governabilidade.", labelKey:"media.answer.corruption.institutional", effects:{stability:2, media:2, coalition:-1, corruption:-1, trust:2, policyClarity:1} }
    ]
  },
  {
    id:"security_pressure",
    topic:"Segurança",
    topicKey:"media.briefing.security.topic",
    question:"A população cobra uma resposta contra a criminalidade. Qual será a prioridade?",
    questionKey:"media.briefing.security.question",
    answers:[
      { tone:"duro", toneKey:"media.tone.firm", label:"Anunciar operação nacional de segurança.", labelKey:"media.answer.security.firm", effects:{stability:4, military:2, approval:2, treasury:-40, publicMood:1, polarization:1} },
      { tone:"social", toneKey:"media.tone.social", label:"Unir segurança, educação e emprego.", labelKey:"media.answer.security.social", effects:{approval:3, stability:2, treasury:-55, economy:1, policyClarity:2} },
      { tone:"federativo", toneKey:"media.tone.federative", label:"Convocar governadores para pacto nacional.", labelKey:"media.answer.security.federative", effects:{coalition:2, stability:3, politicalCapital:-3, regionalReach:2} },
      { tone:"evasivo", toneKey:"media.tone.evasive", label:"Dizer que o tema é responsabilidade dos estados.", labelKey:"media.answer.security.evasive", effects:{approval:-4, media:-3, stability:-2, trust:-2} }
    ]
  },
  {
    id:"institutional_pressure",
    topic:"Instituições",
    topicKey:"media.briefing.institutions.topic",
    question:"Analistas dizem que há tensão entre Poderes. O governo aceita diálogo institucional?",
    questionKey:"media.briefing.institutions.question",
    answers:[
      { tone:"institucional", toneKey:"media.tone.institutional", label:"Defender diálogo público com Congresso, Judiciário e governadores.", labelKey:"media.answer.institutions.dialogue", effects:{stability:3, media:3, institutionalResilience:2, politicalCapital:-2, trust:2} },
      { tone:"jurídico", toneKey:"media.tone.legal", label:"Apresentar agenda de segurança jurídica e cumprimento constitucional.", labelKey:"media.answer.institutions.legal", effects:{marketConfidence:2, media:2, policyClarity:2, pressFreedom:1} },
      { tone:"polarizador", toneKey:"media.tone.polarizing", label:"Dizer que instituições travam a vontade popular.", labelKey:"media.answer.institutions.polarizing", effects:{approval:1, stability:-4, media:-4, polarization:6, constitutionalTension:2} },
      { tone:"administrativo", toneKey:"media.tone.administrative", label:"Conectar reformas administrativas a entregas concretas.", labelKey:"media.answer.institutions.delivery", effects:{approval:2, media:1, deliveryCapacity:2, policyClarity:2} }
    ]
  }
];

export const HEADLINE_TEMPLATES = [
  { type:"positive", text:"Governo ganha fôlego após decisão estratégica", textKey:"media.headline.positive.strategy" },
  { type:"positive", text:"Mercado vê melhora no cenário político", textKey:"media.headline.positive.market" },
  { type:"positive", text:"Comunicação transparente reduz tensão pública", textKey:"media.headline.positive.transparent" },
  { type:"warning", text:"Congresso cobra articulação do Planalto", textKey:"media.headline.warning.congress" },
  { type:"warning", text:"Especialistas alertam para risco fiscal", textKey:"media.headline.warning.fiscal" },
  { type:"warning", text:"Redes sociais ampliam pressão sobre o governo", textKey:"media.headline.warning.social" },
  { type:"negative", text:"Crise desgasta imagem do presidente", textKey:"media.headline.negative.crisis" },
  { type:"negative", text:"Oposição amplia pressão por investigação", textKey:"media.headline.negative.opposition" },
  { type:"negative", text:"Ruído comunicacional derruba confiança no governo", textKey:"media.headline.negative.noise" }
];

export const MEDIA_ACTIONS = [
  { id:"media_tour", title:"Turnê de entrevistas", titleKey:"media.action.tour.title", text:"Aumenta exposição positiva e aproxima o governo do público.", textKey:"media.action.tour.text", cooldown:48, cost:25, actionPoints:1, lagDays:12, effects:{media:5, approval:2, treasury:-25, regionalReach:2, publicMood:1} },
  { id:"regional_radio", title:"Campanha em rádios regionais", titleKey:"media.action.radio.title", text:"Melhora presença fora das capitais e reduz ruído político.", textKey:"media.action.radio.text", cooldown:45, cost:18, actionPoints:1, lagDays:10, effects:{approval:2, stability:1, treasury:-18, regionalReach:5, polarization:-1} },
  { id:"fact_check", title:"Gabinete de checagem", titleKey:"media.action.factcheck.title", text:"Combate fake news e protege imagem institucional.", textKey:"media.action.factcheck.text", cooldown:60, cost:35, actionPoints:2, lagDays:20, effects:{media:4, stability:2, crisis:-1, treasury:-35, disinformationRisk:-5, trust:2} },
  { id:"ad_campaign", title:"Campanha publicitária nacional", titleKey:"media.action.ad.title", text:"Gera ganho rápido de aprovação, mas pode ser criticada como propaganda.", textKey:"media.action.ad.text", cooldown:75, cost:85, actionPoints:2, lagDays:15, effects:{approval:5, media:3, treasury:-85, corruption:1, narrativeControl:3, scandalAttention:1} },
  { id:"open_data_portal", title:"Portal de dados abertos", titleKey:"media.action.opendata.title", text:"Publica indicadores auditáveis e melhora credibilidade em pautas técnicas.", textKey:"media.action.opendata.text", cooldown:90, cost:42, actionPoints:2, lagDays:35, effects:{transparency:6, policyClarity:4, trust:3, corruption:-1, treasury:-42} },
  { id:"crisis_spokesperson", title:"Treinamento de porta-vozes", titleKey:"media.action.spokes.title", text:"Reduz mensagens contraditórias durante crises e coletivas difíceis.", textKey:"media.action.spokes.text", cooldown:70, cost:32, actionPoints:2, lagDays:25, effects:{messageDiscipline:6, crisis:-0.4, media:2, treasury:-32, scandalAttention:-1} },
  { id:"social_listening", title:"Monitoramento social ético", titleKey:"media.action.listening.title", text:"Mapeia dores reais da população sem manipulação de dados pessoais.", textKey:"media.action.listening.text", cooldown:65, cost:28, actionPoints:1, lagDays:18, effects:{publicMood:3, socialReach:3, approval:1, treasury:-28, polarization:-1} },
  { id:"independent_press_room", title:"Sala de imprensa independente", titleKey:"media.action.pressroom.title", text:"Cria rotina de perguntas abertas, briefings técnicos e correção pública de erros.", textKey:"media.action.pressroom.text", cooldown:85, cost:38, actionPoints:2, lagDays:30, effects:{pressFreedom:5, trust:4, media:3, narrativeControl:-1, treasury:-38} }
];

// Compatibility aliases used by the previous simple media renderer.
export const MEDIA_OUTLETS = MEDIA_OUTLET_PROFILES.map(item => ({
  id: item.id,
  name: item.nameKey,
  type: item.typeKey,
  reach: item.reach,
  stance: item.stance,
  trust: item.trust,
  icon: item.icon,
  nameKey: item.nameKey,
  typeKey: item.typeKey,
  textKey: item.textKey,
  volatility: item.volatility
}));

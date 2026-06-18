export const SECURITY_FORCES = [
  { id:"army", name:"Exército", readiness:55, loyalty:62, modernization:44, risk:24 },
  { id:"navy", name:"Marinha", readiness:48, loyalty:58, modernization:39, risk:22 },
  { id:"airforce", name:"Aeronáutica", readiness:52, loyalty:60, modernization:42, risk:23 },
  { id:"federal_police", name:"Polícia Federal", readiness:57, loyalty:54, modernization:48, risk:29 },
  { id:"civil_defense", name:"Defesa Civil", readiness:46, loyalty:64, modernization:37, risk:18 }
];

export const INTEL_OPERATIONS = [
  { id:"counter_corruption", title:"Operação Anticorrupção", text:"Investiga redes internas e reduz risco de escândalo.", cost:45, cooldown:8, risk:22, effects:{corruption:-5, intelligence:4, coalition:-2, treasury:-45} },
  { id:"counter_espionage", title:"Contraespionagem", text:"Reduz sabotagem estrangeira e melhora estabilidade.", cost:55, cooldown:9, risk:18, effects:{intelligence:5, stability:3, globalTension:-1, treasury:-55} },
  { id:"monitor_extremism", title:"Monitorar Extremismo", text:"Reduz risco de ruptura, mas pode gerar críticas civis.", cost:35, cooldown:7, risk:20, effects:{stability:4, security:4, media:-1, treasury:-35} },
  { id:"strategic_leaks", title:"Vazamento Estratégico", text:"Enfraquece oposição, mas aumenta risco de escândalo.", cost:20, cooldown:10, risk:45, effects:{opposition:-5, politicalCapital:5, corruption:3, treasury:-20} }
];

export const MILITARY_ACTIONS = [
  { id:"readiness_drill", title:"Exercício de Prontidão", text:"Aumenta preparo das forças e dissuasão.", cost:65, cooldown:8, effects:{military:5, security:2, treasury:-65} },
  { id:"border_operation", title:"Operação de Fronteira", text:"Melhora segurança interna e controle territorial.", cost:70, cooldown:9, effects:{security:5, stability:2, military:2, treasury:-70} },
  { id:"modernization_plan", title:"Plano de Modernização", text:"Aumenta capacidade militar futura com alto custo.", cost:150, cooldown:14, effects:{military:7, technology:2, treasury:-150, debt:1} },
  { id:"civil_defense_plan", title:"Plano Nacional de Defesa Civil", text:"Reduz impacto de crises e desastres.", cost:80, cooldown:10, effects:{stability:3, crisis:-1, security:3, treasury:-80} }
];

export const SECURITY_EVENTS = [
  { id:"cyber_attack", title:"Ataque cibernético", text:"Sistemas públicos sofrem instabilidade.", type:"negative", effects:{stability:-3, intelligence:-2, crisis:1} },
  { id:"border_incident", title:"Incidente de fronteira", text:"Tensão regional exige resposta militar cautelosa.", type:"warning", effects:{globalTension:2, military:1, diplomacy:-1} },
  { id:"police_success", title:"Operação federal bem-sucedida", text:"A segurança melhora e a aprovação sobe.", type:"positive", effects:{security:3, approval:2, stability:2} },
  { id:"barracks_noise", title:"Ruído nos quartéis", text:"Setores militares criticam condução do governo.", type:"warning", effects:{loyalty:-4, stability:-2, crisis:1} }
];
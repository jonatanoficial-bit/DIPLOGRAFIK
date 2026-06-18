import { BUILD } from "../core/build.js";

export const RELEASE_CHECKLIST = [
  { id:"deep-economy", title:"Economia Profunda", status:"ok", detail:"PIB real/nominal, regra fiscal, política monetária, setor externo, renda e histórico econômico integrados sem remover a Fase 16." },
  { id:"regions", title:"Regiões nacionais", status:"ok", detail:"Cinco regiões possuem população, renda, emprego, serviços públicos, moradia, segurança e necessidades próprias." },
  { id:"groups", title:"Grupos sociais", status:"ok", detail:"Seis segmentos acompanham satisfação, confiança, segurança de renda, influência e prioridades." },
  { id:"demographics", title:"Demografia dinâmica", status:"ok", detail:"População, crescimento, expectativa de vida, alfabetização, pobreza, fome, saneamento e moradia evoluem mensalmente." },
  { id:"policies", title:"Programas públicos", status:"ok", detail:"Seis políticas usam tesouro e pontos de ação, selecionam regiões vulneráveis e produzem resultados atrasados." },
  { id:"integration", title:"Integração governamental", status:"ok", detail:"Orçamento, desemprego, economia e crise influenciam a população; satisfação e desigualdade retornam ao governo." },
  { id:"mobile", title:"Mobile e acessibilidade", status:"ok", detail:"A aba População possui rolagem por toque, cards responsivos, alvos de toque e leitura em telas de 320 px." },
  { id:"saves", title:"Compatibilidade de carreiras", status:"ok", detail:"Saves schema 3 recebem o estado populacional por migração aditiva sem perder perfis, slots ou backups." },
  { id:"integrity", title:"Build Truth e integridade", status:"ok", detail:`Versão, cache, módulos, testes e pacote derivam da fonte canônica da build ${BUILD.version}.` }
];

export const TEST_CHECKLIST = [
  { id:"deep-economy-audit", title:"Auditoria Economia Profunda", status:"ok", detail:"Motor econômico simulado por 360 meses com limites, histórico e migração aditiva validados." },
  "Criar e migrar carreiras confirmando cinco regiões e seis grupos sociais.",
  "Executar ciclos semanais e mensais sem duplicação de efeitos.",
  "Iniciar programas, consumir recursos e maturar resultados após a duração prevista.",
  "Priorizar automaticamente as regiões com os indicadores mais frágeis.",
  "Manter todos os indicadores dentro de limites válidos por 30 anos.",
  "Confirmar efeitos de orçamento, desemprego, economia e crise sobre a população.",
  "Confirmar retorno de satisfação, qualidade de vida e desigualdade ao governo.",
  "Alternar português, inglês e espanhol sem traduções ausentes.",
  "Validar rolagem, toque e ausência de overflow em celular, tablet e desktop.",
  "Reexecutar criação de governo, saves, PWA, assets, Core Loop 2.0 e Anti-Break Core."
];

export const NEXT_RELEASE_STEPS = [
  "Fase 17: aprofundar PIB real e nominal, produtividade, setores, emprego, moeda, juros, dívida e comércio.",
  "Conectar renda e emprego regionais aos setores produtivos e ao orçamento nacional.",
  "Criar choques econômicos com efeitos diferentes por região e grupo social.",
  "Expandir relatórios comparativos para decisões econômicas de longo prazo."
];

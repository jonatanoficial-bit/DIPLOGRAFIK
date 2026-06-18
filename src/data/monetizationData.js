export const STORE_ITEMS = [
  {
    id:"theme_gold",
    type:"cosmetic",
    title:"Tema Ouro Imperial",
    text:"Aplica um acabamento dourado premium na interface.",
    priceSoft:120,
    pricePremium:0,
    effects:{ cosmeticTheme:"gold" }
  },
  {
    id:"theme_blue",
    type:"cosmetic",
    title:"Tema Azul Diplomático",
    text:"Aplica uma variação azul institucional.",
    priceSoft:120,
    pricePremium:0,
    effects:{ cosmeticTheme:"blue" }
  },
  {
    id:"briefing_pack",
    type:"booster",
    title:"Pacote de Briefing Estratégico",
    text:"Gera capital político e XP sem quebrar o balanceamento.",
    priceSoft:180,
    pricePremium:1,
    effects:{ politicalCapital:8, xp:35 }
  },
  {
    id:"stability_pack",
    type:"booster",
    title:"Pacote de Estabilidade",
    text:"Pequeno reforço emergencial para estabilidade nacional.",
    priceSoft:220,
    pricePremium:1,
    effects:{ stability:5, crisis:-0.5 }
  },
  {
    id:"diplomacy_pack",
    type:"booster",
    title:"Pacote Diplomático",
    text:"Aumenta prestígio e influência global de forma moderada.",
    priceSoft:220,
    pricePremium:1,
    effects:{ prestige:4, influence:5 }
  },
  {
    id:"founder_badge",
    type:"cosmetic",
    title:"Selo Fundador",
    text:"Selo cosmético de apoiador inicial.",
    priceSoft:0,
    pricePremium:3,
    effects:{ founderBadge:true }
  }
];

export const REWARDED_ADS = [
  {
    id:"daily_briefing_ad",
    title:"Assistir briefing patrocinado",
    text:"Simula um anúncio recompensado e entrega moedas diplomáticas.",
    reward:{ softCurrency:45, xp:10 },
    cooldown:1
  },
  {
    id:"crisis_support_ad",
    title:"Apoio emergencial patrocinado",
    text:"Simula um anúncio recompensado para reduzir uma crise leve.",
    reward:{ softCurrency:25, crisis:-0.25 },
    cooldown:2
  },
  {
    id:"campaign_ad",
    title:"Impulso de campanha patrocinado",
    text:"Simula anúncio recompensado para reforçar campanha eleitoral.",
    reward:{ softCurrency:30, campaign:2 },
    cooldown:2
  }
];

export const PREMIUM_PACKS = [
  { id:"starter", title:"Pacote Inicial", premium:5, soft:250, label:"Simulado" },
  { id:"president", title:"Pacote Presidente", premium:15, soft:900, label:"Simulado" },
  { id:"global", title:"Pacote Potência Global", premium:40, soft:2600, label:"Simulado" }
];

export const MONETIZATION_RULES = [
  "Nenhuma compra real está ativa nesta build.",
  "Loja e anúncios são simulações locais para preparar a arquitetura comercial.",
  "Itens cosméticos não alteram gameplay.",
  "Boosters são pequenos para evitar pay-to-win.",
  "Integração real futura poderá usar AdMob, Google Play Billing, App Store ou web payments."
];
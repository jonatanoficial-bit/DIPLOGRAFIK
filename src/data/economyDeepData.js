export const ECONOMY_DEEP_KPIS = [
  { id:"realGdp", labelKey:"economyDeep.realGdp", suffix:"bi", polarity:"positive" },
  { id:"nominalGdp", labelKey:"economyDeep.nominalGdp", suffix:"bi", polarity:"positive" },
  { id:"primaryResult", labelKey:"economyDeep.primaryResult", suffix:"bi", polarity:"positive" },
  { id:"debtService", labelKey:"economyDeep.debtService", suffix:"bi", polarity:"negative" },
  { id:"exchangeRate", labelKey:"economyDeep.exchangeRate", suffix:"", polarity:"negative" },
  { id:"reserves", labelKey:"economyDeep.reserves", suffix:"bi", polarity:"positive" },
  { id:"productivity", labelKey:"economyDeep.productivity", suffix:"", polarity:"positive" },
  { id:"costOfLiving", labelKey:"economyDeep.costOfLiving", suffix:"", polarity:"negative" }
];

export const FISCAL_RULES = [
  {
    id:"balanced_rule", nameKey:"economyDeep.fiscal.balanced.name", textKey:"economyDeep.fiscal.balanced.text",
    effects:{ marketConfidence:1.4, approval:-0.4, debt:-0.18, publicSpending:-0.35 },
    stance:{ primaryTarget:0.25, spendingDiscipline:0.58, investmentBias:0.48 }
  },
  {
    id:"social_expansion", nameKey:"economyDeep.fiscal.social.name", textKey:"economyDeep.fiscal.social.text",
    effects:{ approval:1.5, inequality:-0.45, marketConfidence:-0.7, debt:0.16, publicSpending:0.55 },
    stance:{ primaryTarget:-0.45, spendingDiscipline:0.28, investmentBias:0.42 }
  },
  {
    id:"productive_investment", nameKey:"economyDeep.fiscal.invest.name", textKey:"economyDeep.fiscal.invest.text",
    effects:{ economy:1.3, industry:1.2, infrastructure:0.9, marketConfidence:0.35, debt:0.09 },
    stance:{ primaryTarget:-0.15, spendingDiscipline:0.43, investmentBias:0.76 }
  },
  {
    id:"hard_austerity", nameKey:"economyDeep.fiscal.austerity.name", textKey:"economyDeep.fiscal.austerity.text",
    effects:{ debt:-0.55, marketConfidence:2.2, approval:-2.4, stability:-0.7, publicSpending:-1.15 },
    stance:{ primaryTarget:0.9, spendingDiscipline:0.86, investmentBias:0.25 }
  }
];

export const MONETARY_POLICIES = [
  {
    id:"inflation_target", nameKey:"economyDeep.monetary.target.name", textKey:"economyDeep.monetary.target.text",
    effects:{ inflation:-0.22, interestRate:0.12, marketConfidence:0.9, economy:-0.25 },
    stance:{ inflationTarget:4.5, creditImpulse:0.42, currencyDefense:0.55 }
  },
  {
    id:"growth_credit", nameKey:"economyDeep.monetary.credit.name", textKey:"economyDeep.monetary.credit.text",
    effects:{ economy:1.1, unemployment:-0.12, inflation:0.18, marketConfidence:-0.35, interestRate:-0.18 },
    stance:{ inflationTarget:6.2, creditImpulse:0.76, currencyDefense:0.35 }
  },
  {
    id:"currency_anchor", nameKey:"economyDeep.monetary.anchor.name", textKey:"economyDeep.monetary.anchor.text",
    effects:{ inflation:-0.35, exchangeRate:-0.12, marketConfidence:1.2, economy:-0.55, reserves:-5 },
    stance:{ inflationTarget:4.0, creditImpulse:0.32, currencyDefense:0.82 }
  }
];

export const TRADE_STRATEGIES = [
  {
    id:"export_complex", nameKey:"economyDeep.trade.export.name", textKey:"economyDeep.trade.export.text", cost:65, actionPoints:2, cooldown:50,
    effects:{ tradeBalance:2.4, agribusiness:1.2, industry:0.9, reserves:8, marketConfidence:0.5 }, lagDays:60
  },
  {
    id:"import_substitution", nameKey:"economyDeep.trade.import.name", textKey:"economyDeep.trade.import.text", cost:80, actionPoints:2, cooldown:60,
    effects:{ industry:1.8, technology:0.9, tradeBalance:-0.9, inflation:0.12, unemployment:-0.16 }, lagDays:75
  },
  {
    id:"energy_security", nameKey:"economyDeep.trade.energy.name", textKey:"economyDeep.trade.energy.text", cost:95, actionPoints:2, cooldown:75,
    effects:{ energy:2.8, inflation:-0.22, tradeBalance:0.8, debt:0.18, marketConfidence:0.6 }, lagDays:90
  }
];

export const PRODUCTIVE_PROGRAMS = [
  {
    id:"national_productivity", titleKey:"economyDeep.program.productivity.title", textKey:"economyDeep.program.productivity.text", cost:100, actionPoints:2, cooldown:75,
    effects:{ productivity:2.4, technology:1.4, services:0.7, marketConfidence:0.7, unemployment:-0.12 }, lagDays:90
  },
  {
    id:"wage_pact", titleKey:"economyDeep.program.wage.title", textKey:"economyDeep.program.wage.text", cost:55, actionPoints:1, cooldown:45,
    effects:{ realWage:1.6, approval:1.2, costOfLiving:-0.5, inflation:0.08, marketConfidence:-0.2 }, lagDays:45
  },
  {
    id:"private_investment_round", titleKey:"economyDeep.program.private.title", textKey:"economyDeep.program.private.text", cost:40, actionPoints:1, cooldown:50,
    effects:{ privateInvestment:2.5, businessConfidence:2.0, economy:0.8, industry:0.8, elite:0.7 }, lagDays:60
  }
];

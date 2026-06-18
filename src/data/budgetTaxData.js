export const TAX_INSTRUMENTS = [
  {
    id:"income_progressive", nameKey:"budgetTax.tax.income.name", textKey:"budgetTax.tax.income.text", rateKey:"incomeTax", min:8, max:42,
    defaultValue:23, effects:{ inequality:-0.35, approval:0.45, elite:-0.55, taxCompliance:-0.12 }, revenueWeight:1.35, progressivity:1.8
  },
  {
    id:"corporate_competitiveness", nameKey:"budgetTax.tax.corporate.name", textKey:"budgetTax.tax.corporate.text", rateKey:"corporateTax", min:10, max:38,
    defaultValue:27, effects:{ marketConfidence:-0.22, privateInvestment:-0.18, businessConfidence:-0.16 }, revenueWeight:1.18, progressivity:0.8
  },
  {
    id:"consumption_vat", nameKey:"budgetTax.tax.consumption.name", textKey:"budgetTax.tax.consumption.text", rateKey:"consumptionTax", min:6, max:35,
    defaultValue:20, effects:{ approval:-0.38, costOfLiving:0.28, inflation:0.015 }, revenueWeight:1.55, progressivity:-1.05
  },
  {
    id:"payroll_jobs", nameKey:"budgetTax.tax.payroll.name", textKey:"budgetTax.tax.payroll.text", rateKey:"payrollTax", min:4, max:28,
    defaultValue:17, effects:{ unemployment:0.035, informalEconomy:0.22, realWage:-0.12 }, revenueWeight:0.82, progressivity:-0.15
  },
  {
    id:"wealth_property", nameKey:"budgetTax.tax.wealth.name", textKey:"budgetTax.tax.wealth.text", rateKey:"wealthTax", min:0, max:12,
    defaultValue:4, effects:{ inequality:-0.52, elite:-0.7, marketConfidence:-0.18 }, revenueWeight:0.46, progressivity:2.25
  },
  {
    id:"green_externality", nameKey:"budgetTax.tax.green.name", textKey:"budgetTax.tax.green.text", rateKey:"greenTax", min:0, max:14,
    defaultValue:3, effects:{ environment:0.55, inflation:0.012, energy:-0.04 }, revenueWeight:0.28, progressivity:-0.25
  }
];

export const SPENDING_RULES = [
  { id:"baseline_budget", nameKey:"budgetTax.rule.baseline.name", textKey:"budgetTax.rule.baseline.text", effects:{ fiscalCredibility:0.15, socialCohesion:0.1 }, stance:{ ceiling:0.52, investmentFloor:0.42, socialShield:0.52, emergencyReserve:0.45 } },
  { id:"social_protection_budget", nameKey:"budgetTax.rule.social.name", textKey:"budgetTax.rule.social.text", effects:{ approval:0.9, inequality:-0.42, fiscalCredibility:-0.25, publicSpending:0.28 }, stance:{ ceiling:0.38, investmentFloor:0.36, socialShield:0.76, emergencyReserve:0.35 } },
  { id:"investment_budget", nameKey:"budgetTax.rule.investment.name", textKey:"budgetTax.rule.investment.text", effects:{ economy:0.72, industry:0.45, technology:0.45, fiscalCredibility:-0.1 }, stance:{ ceiling:0.44, investmentFloor:0.72, socialShield:0.42, emergencyReserve:0.4 } },
  { id:"hard_ceiling_budget", nameKey:"budgetTax.rule.ceiling.name", textKey:"budgetTax.rule.ceiling.text", effects:{ debt:-0.25, fiscalCredibility:0.65, approval:-1.1, stability:-0.25 }, stance:{ ceiling:0.82, investmentFloor:0.25, socialShield:0.32, emergencyReserve:0.62 } }
];

export const BUDGET_TAX_ACTIONS = [
  {
    id:"digital_tax_authority", titleKey:"budgetTax.action.digital.title", textKey:"budgetTax.action.digital.text", cost:55, actionPoints:2, cooldown:70, lagDays:60,
    effects:{ taxCompliance:4.2, evasionRate:-3.1, administrativeCost:-1.8, corruption:-0.8, primaryRevenue:18, fiscalCredibility:0.6 }
  },
  {
    id:"tax_simplification", titleKey:"budgetTax.action.simplify.title", textKey:"budgetTax.action.simplify.text", cost:70, actionPoints:2, cooldown:90, lagDays:75,
    effects:{ administrativeCost:-4.6, businessConfidence:2.2, privateInvestment:1.3, informalEconomy:-1.8, marketConfidence:1.0 }
  },
  {
    id:"targeted_food_relief", titleKey:"budgetTax.action.food.title", textKey:"budgetTax.action.food.text", cost:85, actionPoints:1, cooldown:50, lagDays:30,
    effects:{ costOfLiving:-2.8, povertyEconomic:-1.6, approval:1.6, inflation:-0.08, debt:0.22 }
  },
  {
    id:"contingency_review", titleKey:"budgetTax.action.review.title", textKey:"budgetTax.action.review.text", cost:25, actionPoints:1, cooldown:45, lagDays:45,
    effects:{ wasteIndex:-3.2, spendingEfficiency:3.1, fiscalCredibility:1.1, publicSpending:-0.25, approval:-0.25 }
  },
  {
    id:"municipal_transfers_pact", titleKey:"budgetTax.action.transfers.title", textKey:"budgetTax.action.transfers.text", cost:90, actionPoints:2, cooldown:80, lagDays:75,
    effects:{ regionalBalance:3.8, socialCohesion:1.2, stability:0.8, inequality:-0.65, treasury:-20 }
  },
  {
    id:"investment_pipeline_audit", titleKey:"budgetTax.action.pipeline.title", textKey:"budgetTax.action.pipeline.text", cost:45, actionPoints:1, cooldown:60, lagDays:60,
    effects:{ capitalExecution:4.3, publicInvestment:2.1, infrastructure:0.8, technology:0.35, corruption:-0.5 }
  }
];

export const BUDGET_TAX_KPIS = [
  { id:"grossRevenue", labelKey:"budgetTax.grossRevenue", suffix:"bi", polarity:"positive" },
  { id:"mandatorySpending", labelKey:"budgetTax.mandatorySpending", suffix:"bi", polarity:"negative" },
  { id:"discretionarySpace", labelKey:"budgetTax.discretionarySpace", suffix:"bi", polarity:"positive" },
  { id:"taxCompliance", labelKey:"budgetTax.taxCompliance", suffix:"%", polarity:"positive" },
  { id:"evasionRate", labelKey:"budgetTax.evasionRate", suffix:"%", polarity:"negative" },
  { id:"spendingEfficiency", labelKey:"budgetTax.spendingEfficiency", suffix:"%", polarity:"positive" }
];

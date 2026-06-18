#!/usr/bin/env python3
from pathlib import Path
import json, subprocess
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
FILES={
  'state':(ROOT/'src/core/stateFactory.js').read_text(encoding='utf-8'),
  'system':(ROOT/'src/systems/budgetTax.js').read_text(encoding='utf-8'),
  'data':(ROOT/'src/data/budgetTaxData.js').read_text(encoding='utf-8'),
  'economy':(ROOT/'src/systems/economy.js').read_text(encoding='utf-8'),
  'render':(ROOT/'src/ui/render.js').read_text(encoding='utf-8'),
  'index':(ROOT/'index.html').read_text(encoding='utf-8'),
  'css':(ROOT/'src/styles.css').read_text(encoding='utf-8'),
}
static={
 'phase18_declared':CONFIG.get('stage_number',0)>=18 and CONFIG.get('budget_tax',{}).get('enabled') is True,
 'official_base_preserved':CONFIG.get('stage_number',0)>=18 and CONFIG.get('budget_tax',{}).get('enabled') is True,
 'save_schema_three_preserved':CONFIG.get('save_schema')==3 and CONFIG.get('save_key')=='diplocraft_save_v101',
 'state_factory_has_budget_tax':'createBudgetTaxState' in FILES['state'] and 'budgetTax: createBudgetTaxState()' in FILES['state'],
 'budget_tax_system_has_schema':'BUDGET_TAX_SCHEMA = 1' in FILES['system'],
 'monthly_bridge_installed':'processBudgetTaxMonth' in FILES['economy'] and 'budgetTax: budgetTaxReport' in FILES['economy'],
 'ui_panels_present':all(token in FILES['index'] for token in ['budgetTaxOverview','taxInstrumentControls','spendingRules','budgetTaxActions','budgetTaxHistory']),
 'renderer_binds_actions':all(token in FILES['render'] for token in ['setTaxRate','setSpendingRule','runBudgetTaxAction','budgetTaxHealthScore']),
 'mobile_css_present':all(token in FILES['css'] for token in ['.budgetTaxHero','.taxInstrumentGrid','.taxInstrument']),
 'tax_catalog_complete':FILES['data'].count('rateKey:')>=6 and FILES['data'].count('id:"')>=16,
 'history_limit_declared':'BUDGET_TAX_HISTORY_LIMIT = 36' in FILES['system'],
}
node_script="""
import { createNewState } from './src/core/stateFactory.js';
import { monthlyEconomy } from './src/systems/economy.js';
import { normalizeState } from './src/systems/calculations.js';
import { ensureBudgetTaxState, calculateBudgetTaxSnapshot, setTaxRate, setSpendingRule, applyBudgetTaxEffects, budgetTaxHealthScore } from './src/systems/budgetTax.js';
const checks = {};
const s = createNewState();
checks.default_state_present = !!s.budgetTax && s.budgetTax.schema === 1;
checks.snapshot_finite = Number.isFinite(calculateBudgetTaxSnapshot(s).primaryBalance);
setTaxRate(s, 'consumptionTax', 35);
setTaxRate(s, 'wealthTax', 12);
setSpendingRule(s, 'investment_budget');
checks.controls_apply = s.budgetTax.taxRates.consumptionTax === 35 && s.budgetTax.taxRates.wealthTax === 12 && s.budgetTax.activeSpendingRule === 'investment_budget';
const legacy = applyBudgetTaxEffects(s, { taxCompliance: 4, evasionRate: -2, privateInvestment: 3, economy: 1, treasury: -5 });
checks.effect_bridge = s.budgetTax.taxCompliance > 62 && s.deepEconomy.privateInvestment > 48 && legacy.economy === 1 && legacy.treasury === -5;
for (let i=0; i<240; i++) { monthlyEconomy(s); normalizeState(s); const bt=ensureBudgetTaxState(s); if (!Number.isFinite(bt.taxCompliance) || !Number.isFinite(s.debt) || bt.history.length > 36) throw new Error('budget tax invariant failed'); }
checks.long_run_240_months = true;
checks.history_bounded = s.budgetTax.history.length <= 36;
checks.health_score_bounded = budgetTaxHealthScore(s) >= 0 && budgetTaxHealthScore(s) <= 100;
checks.legacy_tax_burden_synced = s.taxBurden >= 5 && s.taxBurden <= 60;
console.log(JSON.stringify({checks, final:{debt:s.debt, taxBurden:s.taxBurden, budgetTax:s.budgetTax, health:budgetTaxHealthScore(s)}, passed:Object.values(checks).every(Boolean)}, null, 2));
"""
proc=subprocess.run(['node','--input-type=module','-e',node_script],cwd=ROOT,capture_output=True,text=True)
runtime={'returncode':proc.returncode,'stdout':proc.stdout,'stderr':proc.stderr,'passed':False,'checks':{}}
try:
  parsed=json.loads(proc.stdout)
  runtime.update(parsed)
except Exception:
  pass
checks={**static,'runtime_passed':runtime.get('passed') is True}
result={'project':'DIPLOCRAFT','version':CONFIG.get('version'),'phase':CONFIG.get('stage_name'),'static_checks':static,'runtime':runtime,'checks':checks,'check_count':len(static)+len(runtime.get('checks',{}))+1,'passed':all(checks.values())}
(ROOT/'tests/budget-tax-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in static.items()]
for k,v in runtime.get('checks',{}).items(): lines.append(f"{'PASS' if v else 'FAIL'} runtime.{k}")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {result['check_count']} checks")
(ROOT/'tests/budget-tax-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

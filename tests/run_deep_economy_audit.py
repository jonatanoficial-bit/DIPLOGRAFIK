#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, textwrap
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
FILES={
  'state':(ROOT/'src/core/stateFactory.js').read_text(encoding='utf-8'),
  'system':(ROOT/'src/systems/economyDeep.js').read_text(encoding='utf-8'),
  'data':(ROOT/'src/data/economyDeepData.js').read_text(encoding='utf-8'),
  'economy':(ROOT/'src/systems/economy.js').read_text(encoding='utf-8'),
  'render':(ROOT/'src/ui/render.js').read_text(encoding='utf-8'),
  'index':(ROOT/'index.html').read_text(encoding='utf-8'),
  'css':(ROOT/'src/styles.css').read_text(encoding='utf-8'),
}
static={
 'deep_economy_phase_preserved':CONFIG.get('stage_number',0)>=17 and CONFIG.get('deep_economy',{}).get('enabled') is True,
 'phase17_or_later_base_preserved':CONFIG.get('stage_number',0)>=17 and CONFIG.get('deep_economy',{}).get('enabled') is True,
 'save_schema_three_preserved':CONFIG.get('save_schema')==3 and CONFIG.get('save_key')=='diplocraft_save_v101',
 'state_factory_has_deep_economy':'createDeepEconomyState' in FILES['state'] and 'deepEconomy: createDeepEconomyState()' in FILES['state'],
 'deep_system_has_schema':'ECONOMY_DEEP_SCHEMA = 1' in FILES['system'],
 'monthly_bridge_installed':'processDeepEconomyMonth' in FILES['economy'] and 'deep: deepReport' in FILES['economy'],
 'ui_panels_present':all(token in FILES['index'] for token in ['deepEconomyPanel','fiscalRules','monetaryPolicies','productivePrograms','deepEconomyHistory']),
 'renderer_binds_actions':all(token in FILES['render'] for token in ['setFiscalRule','setMonetaryPolicy','runDeepEconomyAction','economicHealthScore']),
 'mobile_css_present':all(token in FILES['css'] for token in ['.deepEconomyHero','.policyGrid','.deepEconomyMatrix','.historyRow']),
 'policy_catalog_complete':FILES['data'].count('id:"')>=13,
 'history_limits_declared':'MONTHLY_HISTORY_LIMIT = 48' in FILES['system'] and 'QUARTER_HISTORY_LIMIT = 24' in FILES['system'],
}
node_script="""
import { createNewState } from './src/core/stateFactory.js';
import { monthlyEconomy } from './src/systems/economy.js';
import { ensureDeepEconomyState, calculateDeepEconomySnapshot, setFiscalRule, setMonetaryPolicy, applyDeepEconomyActionEffects, economicHealthScore } from './src/systems/economyDeep.js';
import { normalizeState } from './src/systems/calculations.js';
const checks = {};
const s = createNewState();
checks.default_state_present = !!s.deepEconomy && s.deepEconomy.schema === 1;
checks.snapshot_finite = Number.isFinite(calculateDeepEconomySnapshot(s).annualizedGrowth);
setFiscalRule(s, 'productive_investment');
setMonetaryPolicy(s, 'growth_credit');
checks.policy_selection = s.deepEconomy.fiscalRule === 'productive_investment' && s.deepEconomy.monetaryPolicy === 'growth_credit';
const legacy = applyDeepEconomyActionEffects(s, { productivity: 3, privateInvestment: 2, economy: 1, treasury: -10 });
checks.deep_effects_separated = s.deepEconomy.productivity > 49.5 && legacy.economy === 1 && legacy.treasury === -10;
for (let i=0; i<360; i++) { monthlyEconomy(s); normalizeState(s); const e=ensureDeepEconomyState(s); if (!Number.isFinite(e.realGdp) || !Number.isFinite(s.debt) || e.monthlyHistory.length > 48 || e.quarterHistory.length > 24) throw new Error('deep economy invariant failed'); }
checks.long_run_360_months = true;
checks.history_bounded = s.deepEconomy.monthlyHistory.length <= 48 && s.deepEconomy.quarterHistory.length <= 24;
checks.legacy_bridge = Number.isInteger(s.gdp) && Math.abs(s.gdp - s.deepEconomy.realGdp) <= 1;
checks.health_score_bounded = economicHealthScore(s) >= 0 && economicHealthScore(s) <= 100;
console.log(JSON.stringify({checks, final:{gdp:s.gdp, debt:s.debt, inflation:s.inflation, unemployment:s.unemployment, deep:s.deepEconomy, health:economicHealthScore(s)}, passed:Object.values(checks).every(Boolean)}, null, 2));
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
(ROOT/'tests/deep-economy-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in static.items()]
for k,v in runtime.get('checks',{}).items(): lines.append(f"{'PASS' if v else 'FAIL'} runtime.{k}")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {result['check_count']} checks")
(ROOT/'tests/deep-economy-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

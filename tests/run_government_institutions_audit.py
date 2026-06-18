#!/usr/bin/env python3
from pathlib import Path
import json, subprocess
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
FILES={
  'state':(ROOT/'src/core/stateFactory.js').read_text(encoding='utf-8'),
  'system':(ROOT/'src/systems/governmentInstitutions.js').read_text(encoding='utf-8'),
  'data':(ROOT/'src/data/governmentInstitutionData.js').read_text(encoding='utf-8'),
  'coreLoop':(ROOT/'src/systems/coreLoop.js').read_text(encoding='utf-8'),
  'render':(ROOT/'src/ui/render.js').read_text(encoding='utf-8'),
  'game':(ROOT/'src/game.js').read_text(encoding='utf-8'),
  'index':(ROOT/'index.html').read_text(encoding='utf-8'),
  'css':(ROOT/'src/styles.css').read_text(encoding='utf-8'),
}
static={
 'phase19_declared':CONFIG.get('stage_number',0)>=19 and CONFIG.get('government_institutions',{}).get('enabled') is True,
 'official_base_preserved':CONFIG.get('stage_number',0)>=19 and CONFIG.get('government_institutions',{}).get('enabled') is True and (CONFIG.get('base_version') in {'1.7.0','1.7.1','1.7.2'} or any(label in CONFIG.get('base_stage','') for label in ['Fase 18','Fase 19','Fase 20'])),
 'save_schema_three_preserved':CONFIG.get('save_schema')==3 and CONFIG.get('save_key')=='diplocraft_save_v101',
 'state_factory_has_institutions':'createInstitutionalState' in FILES['state'] and 'institutions: createInstitutionalState()' in FILES['state'],
 'institution_system_has_schema':'GOVERNMENT_INSTITUTIONS_SCHEMA = 1' in FILES['system'] and 'INSTITUTION_HISTORY_LIMIT = 36' in FILES['system'],
 'monthly_bridge_installed':'processInstitutionalMonth' in FILES['coreLoop'] and 'reports.monthly.institutions' in FILES['coreLoop'],
 'ui_panels_present':all(token in FILES['index'] for token in ['institutionalOverview','institutionalMetrics','institutionProfiles','institutionalReforms','institutionalActions','institutionalHistory']),
 'renderer_binds_actions':all(token in FILES['render'] for token in ['setInstitutionalReform','runInstitutionalAction','institutionalHealthScore','calculateInstitutionalSnapshot']),
 'game_actions_present':all(token in FILES['game'] for token in ['setInstitutionalReform(id)','runInstitutionalAction(id)','applyInstitutionalEffects']),
 'mobile_css_present':all(token in FILES['css'] for token in ['.institutionHero','.institutionGrid','.institutionCard']),
 'catalog_complete':FILES['data'].count('id:"')>=22 and FILES['data'].count('INSTITUTIONAL_REFORMS')>=1 and FILES['data'].count('INSTITUTIONAL_ACTIONS')>=1,
}
node_script="""
import { createNewState } from './src/core/stateFactory.js';
import { advanceDay, ensureCoreLoopState } from './src/systems/coreLoop.js';
import { normalizeState } from './src/systems/calculations.js';
import { ensureInstitutionalState, calculateInstitutionalSnapshot, setInstitutionalReform, applyInstitutionalEffects, processInstitutionalMonth, institutionalHealthScore } from './src/systems/governmentInstitutions.js';
const checks = {};
const s = createNewState();
checks.default_state_present = !!s.institutions && s.institutions.schema === 1 && s.institutions.institutions.length >= 8;
checks.snapshot_finite = Number.isFinite(calculateInstitutionalSnapshot(s).institutionalScore);
setInstitutionalReform(s, 'anti_capture_reform');
checks.reform_applies = s.institutions.activeReform === 'anti_capture_reform';
const legacy = applyInstitutionalEffects(s, { transparency: 4, constitutionalTension: -2, marketConfidence: 1, regionalBalance: 2, businessConfidence: 2, politicalCapital: 1 });
checks.effect_bridge = s.institutions.transparency > 46 && s.budgetTax.regionalBalance > 44 && s.deepEconomy.businessConfidence > 50 && legacy.marketConfidence === 1 && legacy.politicalCapital === 1;
for (let i=0; i<240; i++) { processInstitutionalMonth(s, {}); normalizeState(s); const inst=ensureInstitutionalState(s); if (!Number.isFinite(inst.institutionalScore) || inst.history.length > 36) throw new Error('institution invariant failed'); }
checks.history_bounded = s.institutions.history.length <= 36;
checks.health_score_bounded = institutionalHealthScore(s) >= 0 && institutionalHealthScore(s) <= 100;
const s2 = createNewState();
advanceDay(s2, () => {}, 420, { ignoreOutcomes:true });
ensureCoreLoopState(s2);
checks.core_loop_integration = !!s2.governance.reports.monthly.institutions && s2.institutions.history.length > 0;
checks.long_run_420_days = Number.isFinite(s2.institutions.institutionalScore) && Number.isFinite(s2.stability);
console.log(JSON.stringify({checks, final:{score:s.institutions.institutionalScore, health:institutionalHealthScore(s), history:s.institutions.history.length, monthly:s2.governance.reports.monthly.institutions}, passed:Object.values(checks).every(Boolean)}, null, 2));
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
(ROOT/'tests/government-institutions-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in static.items()]
for k,v in runtime.get('checks',{}).items(): lines.append(f"{'PASS' if v else 'FAIL'} runtime.{k}")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {result['check_count']} checks")
(ROOT/'tests/government-institutions-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

#!/usr/bin/env python3
from pathlib import Path
import json, subprocess
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
FILES={
  'state':(ROOT/'src/core/stateFactory.js').read_text(encoding='utf-8'),
  'system':(ROOT/'src/systems/cabinetAdministration.js').read_text(encoding='utf-8'),
  'data':(ROOT/'src/data/cabinetAdministrationData.js').read_text(encoding='utf-8'),
  'coreLoop':(ROOT/'src/systems/coreLoop.js').read_text(encoding='utf-8'),
  'render':(ROOT/'src/ui/render.js').read_text(encoding='utf-8'),
  'game':(ROOT/'src/game.js').read_text(encoding='utf-8'),
  'index':(ROOT/'index.html').read_text(encoding='utf-8'),
  'css':(ROOT/'src/styles.css').read_text(encoding='utf-8'),
  'upload':(ROOT/'UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt').read_text(encoding='utf-8'),
}
static={
 'phase20_declared':CONFIG.get('stage_number',0)>=20 and CONFIG.get('cabinet_administration',{}).get('enabled') is True,
 'official_base_preserved':CONFIG.get('stage_number',0)>=20 and CONFIG.get('cabinet_administration',{}).get('enabled') is True and (CONFIG.get('base_version') in {'1.7.1','1.7.2'} or any(label in CONFIG.get('base_stage','') for label in ['Fase 19','Fase 20'])),
 'save_schema_three_preserved':CONFIG.get('save_schema')==3 and CONFIG.get('save_key')=='diplocraft_save_v101',
 'state_factory_has_cabinet':'createCabinetState' in FILES['state'] and 'cabinetAdministration: createCabinetState()' in FILES['state'],
 'cabinet_system_has_schema':'CABINET_ADMIN_SCHEMA = 1' in FILES['system'] and 'CABINET_HISTORY_LIMIT = 36' in FILES['system'],
 'monthly_bridge_installed':'processCabinetMonth' in FILES['coreLoop'] and 'reports.monthly.cabinet' in FILES['coreLoop'],
 'ui_panels_present':all(token in FILES['index'] for token in ['cabinetOverview','cabinetMetrics','cabinetPortfolios','cabinetStyles','cabinetActions','cabinetHistory']),
 'renderer_binds_actions':all(token in FILES['render'] for token in ['setCabinetStyle','runCabinetAction','cabinetHealthScore','calculateCabinetSnapshot']),
 'game_actions_present':all(token in FILES['game'] for token in ['setCabinetStyle(id)','runCabinetAction(id)','applyCabinetEffects']),
 'mobile_css_present':all(token in FILES['css'] for token in ['.cabinetHero','.cabinetPortfolioGrid','.cabinetCard']),
 'catalog_complete':FILES['data'].count('id:"')>=18 and 'CABINET_STYLES' in FILES['data'] and 'CABINET_ACTIONS' in FILES['data'],
 'upload_prompt_included':all(token in FILES['upload'] for token in ['C:\\Users\\jonat\\Desktop\\GAME\\¨2026\\DIPLOCRAFT','/c/Users/jonat/Desktop/GAME/¨2026/DIPLOCRAFT','DIPLOGRAFIK.git','Nunca iniciar Git em /c/Users/jonat'])
}
node_script="""
import { createNewState } from './src/core/stateFactory.js';
import { advanceDay, ensureCoreLoopState } from './src/systems/coreLoop.js';
import { normalizeState } from './src/systems/calculations.js';
import { ensureCabinetState, calculateCabinetSnapshot, setCabinetStyle, applyCabinetEffects, processCabinetMonth, cabinetHealthScore } from './src/systems/cabinetAdministration.js';
const checks = {};
const s = createNewState();
checks.default_state_present = !!s.cabinetAdministration && s.cabinetAdministration.schema === 1 && s.cabinetAdministration.portfolios.length >= 8;
checks.snapshot_finite = Number.isFinite(calculateCabinetSnapshot(s).administrationScore);
setCabinetStyle(s, 'technical_cabinet');
checks.style_applies = s.cabinetAdministration.activeStyle === 'technical_cabinet';
const legacy = applyCabinetEffects(s, { cabinetCompetence: 4, policyCoordination: 2, regionalBalance: 3, marketConfidence: 1, politicalCapital: 1 });
checks.effect_bridge = s.cabinetAdministration.cabinetCompetence > 55 && s.budgetTax.regionalBalance > 45 && legacy.marketConfidence === 1 && legacy.politicalCapital === 1;
for (let i=0; i<240; i++) { processCabinetMonth(s, {}); normalizeState(s); const cab=ensureCabinetState(s); if (!Number.isFinite(cab.cabinetCompetence) || cab.history.length > 36) throw new Error('cabinet invariant failed'); }
checks.history_bounded = s.cabinetAdministration.history.length <= 36;
checks.health_score_bounded = cabinetHealthScore(s) >= 0 && cabinetHealthScore(s) <= 100;
const s2 = createNewState();
advanceDay(s2, () => {}, 420, { ignoreOutcomes:true });
ensureCoreLoopState(s2);
checks.core_loop_integration = !!s2.governance.reports.monthly.cabinet && s2.cabinetAdministration.history.length > 0;
checks.long_run_420_days = Number.isFinite(s2.cabinetAdministration.cabinetCompetence) && Number.isFinite(s2.stability);
console.log(JSON.stringify({checks, final:{health:cabinetHealthScore(s), history:s.cabinetAdministration.history.length, monthly:s2.governance.reports.monthly.cabinet}, passed:Object.values(checks).every(Boolean)}, null, 2));
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
(ROOT/'tests/cabinet-administration-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in static.items()]
for k,v in runtime.get('checks',{}).items(): lines.append(f"{'PASS' if v else 'FAIL'} runtime.{k}")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {result['check_count']} checks")
(ROOT/'tests/cabinet-administration-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

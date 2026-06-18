#!/usr/bin/env python3
from pathlib import Path
import json, subprocess
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
FILES={
  'state':(ROOT/'src/core/stateFactory.js').read_text(encoding='utf-8'),
  'system':(ROOT/'src/systems/media.js').read_text(encoding='utf-8'),
  'data':(ROOT/'src/data/mediaData.js').read_text(encoding='utf-8'),
  'coreLoop':(ROOT/'src/systems/coreLoop.js').read_text(encoding='utf-8'),
  'render':(ROOT/'src/ui/render.js').read_text(encoding='utf-8'),
  'game':(ROOT/'src/game.js').read_text(encoding='utf-8'),
  'index':(ROOT/'index.html').read_text(encoding='utf-8'),
  'css':(ROOT/'src/styles.css').read_text(encoding='utf-8'),
  'upload':(ROOT/'UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt').read_text(encoding='utf-8'),
  'guide':(ROOT/'MEDIA_PUBLIC_OPINION_GUIDE.md').read_text(encoding='utf-8'),
}
static={
 'phase21_declared':CONFIG.get('version')=='1.7.3' and CONFIG.get('stage_number')==21 and CONFIG.get('media_public_opinion',{}).get('enabled') is True,
 'official_base_preserved':CONFIG.get('base_version')=='1.7.2' and 'Fase 20' in CONFIG.get('base_stage',''),
 'save_schema_three_preserved':CONFIG.get('save_schema')==3 and CONFIG.get('save_key')=='diplocraft_save_v101',
 'state_factory_has_media_public':'createMediaPublicState' in FILES['state'] and 'mediaPublic: createMediaPublicState()' in FILES['state'],
 'media_system_has_schema':'MEDIA_PUBLIC_SCHEMA = 1' in FILES['system'] and 'MEDIA_HISTORY_LIMIT = 36' in FILES['system'],
 'monthly_bridge_installed':'processMediaPublicMonth' in FILES['coreLoop'] and 'reports.monthly.media' in FILES['coreLoop'],
 'ui_panels_present':all(token in FILES['index'] for token in ['mediaNarrativeOverview','mediaDoctrinePanel','mediaAgendaPanel','mediaOutlets','headlines','mediaActions','mediaHistory']),
 'renderer_binds_actions':all(token in FILES['render'] for token in ['setMediaDoctrine','runMediaAction','mediaHealthScore','calculateMediaSnapshot']),
 'game_actions_present':all(token in FILES['game'] for token in ['setMediaDoctrine(id)','runMediaAction(id)','applyMediaPublicEffects']),
 'mobile_css_present':all(token in FILES['css'] for token in ['.mediaHero','.mediaAgendaGrid','.mediaOutletGrid','.mediaMetricGrid']),
 'catalog_complete':all(token in FILES['data'] for token in ['MEDIA_DOCTRINES','MEDIA_AGENDAS','MEDIA_ACTIONS','MEDIA_OUTLET_PROFILES']) and FILES['data'].count('id:"')>=30,
 'upload_prompt_included':all(token in FILES['upload'] for token in ['C:\\Users\\jonat\\Desktop\\GAME\\¨2026\\DIPLOCRAFT','/c/Users/jonat/Desktop/GAME/¨2026/DIPLOCRAFT','DIPLOGRAFIK.git','Nunca iniciar Git em /c/Users/jonat']),
 'guide_included':'Fase 21 v1.7.3' in FILES['guide'] and 'UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt' in FILES['guide'],
}
node_script="""
import { createNewState } from './src/core/stateFactory.js';
import { advanceDay, ensureCoreLoopState } from './src/systems/coreLoop.js';
import { normalizeState } from './src/systems/calculations.js';
import { MEDIA_DOCTRINES, MEDIA_ACTIONS, MEDIA_AGENDAS } from './src/data/mediaData.js';
import { ensureMediaPublicState, calculateMediaSnapshot, setMediaDoctrine, applyMediaPublicEffects, processMediaPublicMonth, mediaHealthScore, generateHeadline, answerPressQuestion } from './src/systems/media.js';
const checks = {};
const s = createNewState();
checks.default_state_present = !!s.mediaPublic && s.mediaPublic.schema === 1 && s.mediaPublic.outlets.length >= 8 && s.mediaPublic.agendas.length >= 6;
checks.catalog_counts = MEDIA_DOCTRINES.length >= 4 && MEDIA_ACTIONS.length >= 8 && MEDIA_AGENDAS.length >= 6;
checks.snapshot_finite = Number.isFinite(calculateMediaSnapshot(s).credibility) && Number.isFinite(calculateMediaSnapshot(s).agendaRisk);
const selected = setMediaDoctrine(s, 'regional_listening');
checks.doctrine_applies = s.mediaPublic.activeDoctrine === 'regional_listening' && selected.legacyEffects.approval === 1;
const legacy = applyMediaPublicEffects(s, { publicMood: 4, disinformationRisk: -2, approval: 1, transparency: 3, deliveryCapacity: 2 });
checks.effect_bridge = s.mediaPublic.publicMood > 50 && legacy.approval === 1 && s.institutions.transparency > 48 && s.cabinetAdministration.deliveryCapacity > 50;
const h = generateHeadline(s);
checks.headline_enriched = ['positive','warning','negative'].includes(h.type) && Number.isFinite(h.mood) && Number.isFinite(h.credibility);
answerPressQuestion(s, { tone:'teste', effects:{ policyClarity:2, media:1 } }, () => {});
checks.press_answer_integrated = s.headlines.length > 0 && s.mediaPublic.policyClarity > 50;
for (let i=0; i<240; i++) { processMediaPublicMonth(s, {}); normalizeState(s); const m=ensureMediaPublicState(s); if (!Number.isFinite(m.publicMood) || !Number.isFinite(m.hostility) || m.history.length > 36 || s.headlines.length > 14) throw new Error('media invariant failed'); }
checks.history_bounded = s.mediaPublic.history.length <= 36;
checks.health_score_bounded = mediaHealthScore(s) >= 0 && mediaHealthScore(s) <= 100;
const s2 = createNewState();
advanceDay(s2, () => {}, 420, { ignoreOutcomes:true });
ensureCoreLoopState(s2);
checks.core_loop_integration = !!s2.governance.reports.monthly.media && s2.mediaPublic.history.length > 0;
checks.long_run_420_days = Number.isFinite(s2.mediaPublic.publicMood) && Number.isFinite(s2.mediaPublic.hostility) && s2.mediaPublic.history.length <= 36;
console.log(JSON.stringify({checks, final:{health:mediaHealthScore(s), history:s.mediaPublic.history.length, monthly:s2.governance.reports.monthly.media}, passed:Object.values(checks).every(Boolean)}, null, 2));
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
(ROOT/'tests/media-public-opinion-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in static.items()]
for k,v in runtime.get('checks',{}).items(): lines.append(f"{'PASS' if v else 'FAIL'} runtime.{k}")
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} — {result['check_count']} checks")
(ROOT/'tests/media-public-opinion-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

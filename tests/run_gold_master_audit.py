#!/usr/bin/env python3
from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[1]
def exists(p): return (ROOT/p).exists()
def text(p):
    path=ROOT/p
    return path.read_text(encoding='utf-8') if path.exists() else ''
def contains(p, value): return value in text(p)
checks={}
checks['data_file_exists']=exists('src/data/goldMasterData.js')
checks['system_file_exists']=exists('src/systems/goldMaster.js')
checks['state_factory_includes_gold_master']=contains('src/core/stateFactory.js','goldMaster: createGoldMasterState()')
checks['core_loop_processes_monthly']=contains('src/systems/coreLoop.js','processGoldMasterMonth') and contains('src/systems/coreLoop.js','monthly.goldMaster')
checks['game_actions_include_track']=contains('src/game.js','setGoldReleaseTrack')
checks['game_actions_include_action_runner']=contains('src/game.js','runGoldMasterAction')
checks['render_imports_snapshot']=contains('src/ui/render.js','calculateGoldMasterSnapshot')
checks['render_has_overview_panel']=contains('src/ui/render.js','goldMasterOverview')
checks['render_has_actions_panel']=contains('src/ui/render.js','goldMasterActions')
checks['index_has_release_panels']=contains('index.html','goldMasterOverview') and contains('index.html','goldMasterGates') and contains('index.html','goldMasterActions')
checks['i18n_seed_has_phase_keys']=contains('tools/i18n_seed.json','gold.phaseName') and contains('tools/i18n_seed.json','gold.action.cut.title')
checks['build_config_phase28']=contains('build.config.json','"stage_number": 28') and contains('build.config.json','GOLD_MASTER_VERIFIED')
checks['package_script_registered']=contains('package.json','test:gold-master')
checks['guide_exists']=exists('GOLD_MASTER_COMMERCIAL_GUIDE.md')
checks['known_issues_exists']=exists('KNOWN_ISSUES_PHASE_28.md')
checks['upload_prompt_preserved']=exists('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt') and contains('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt','DIPLOGRAFIK.git')
checks['track_count_4']=len(re.findall(r'nameKey:"gold\.track\.', text('src/data/goldMasterData.js'))) == 4
checks['gate_count_8']=len(re.findall(r'nameKey:"gold\.gate\.', text('src/data/goldMasterData.js'))) == 8
checks['action_count_8']=len(re.findall(r'titleKey:"gold\.action\.', text('src/data/goldMasterData.js'))) == 8
checks['node_test_exists']=exists('tests/unit/gold-master.test.js')
checks['save_schema_preserved']=contains('build.config.json','"save_schema": 3') and contains('build.config.json','diplocraft_save_v101')
checks['no_standalone_marker']=not contains('build.config.json','Standalone') and not contains('README.md','Standalone')
passed=all(checks.values())
result={'passed':passed,'check_count':len(checks),'checks':checks}
(ROOT/'tests/gold-master-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in checks.items()]
lines.append(f"OVERALL {'PASS' if passed else 'FAIL'} {sum(checks.values())}/{len(checks)} checks")
(ROOT/'tests/gold-master-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if passed else 1)

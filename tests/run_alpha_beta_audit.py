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
checks['data_file_exists']=exists('src/data/alphaBetaData.js')
checks['system_file_exists']=exists('src/systems/alphaBeta.js')
checks['state_factory_includes_alpha_beta']=contains('src/core/stateFactory.js','alphaBeta: createAlphaBetaState()')
checks['core_loop_processes_monthly']=contains('src/systems/coreLoop.js','processAlphaBetaMonth') and contains('src/systems/coreLoop.js','monthly.alphaBeta')
checks['game_actions_include_channel']=contains('src/game.js','setBetaChannel')
checks['game_actions_include_action_runner']=contains('src/game.js','runAlphaBetaAction')
checks['render_imports_snapshot']=contains('src/ui/render.js','calculateAlphaBetaSnapshot')
checks['render_has_overview_panel']=contains('src/ui/render.js','alphaBetaOverview')
checks['render_has_actions_panel']=contains('src/ui/render.js','alphaBetaActions')
checks['index_has_release_panels']=contains('index.html','alphaBetaOverview') and contains('index.html','alphaBetaMilestones') and contains('index.html','alphaBetaActions')
checks['i18n_seed_has_phase_keys']=contains('tools/i18n_seed.json','alphaBeta.phaseName') and contains('tools/i18n_seed.json','alphaBeta.action.board.title')
checks['build_config_phase27']=contains('build.config.json','"stage_number": 27') and contains('build.config.json','ALPHA_BETA_VERIFIED')
checks['package_script_registered']=contains('package.json','test:alpha-beta')
checks['guide_exists']=exists('ALPHA_BETA_COMMERCIAL_GUIDE.md')
checks['known_issues_exists']=exists('KNOWN_ISSUES_PHASE_27.md')
checks['upload_prompt_preserved']=exists('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt') and contains('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt','DIPLOGRAFIK.git')
checks['channel_count_4']=len(re.findall(r'nameKey:"alphaBeta\.channel\.', text('src/data/alphaBetaData.js'))) == 4
checks['milestone_count_8']=len(re.findall(r'nameKey:"alphaBeta\.milestone\.', text('src/data/alphaBetaData.js'))) == 8
checks['action_count_8']=len(re.findall(r'titleKey:"alphaBeta\.action\.', text('src/data/alphaBetaData.js'))) == 8
checks['node_test_exists']=exists('tests/unit/alpha-beta.test.js')
checks['save_schema_preserved']=contains('build.config.json','"save_schema": 3') and contains('build.config.json','diplocraft_save_v101')
checks['no_standalone_marker']=not contains('build.config.json','Standalone') and not contains('README.md','Standalone')
passed=all(checks.values())
result={'passed':passed,'check_count':len(checks),'checks':checks}
(ROOT/'tests/alpha-beta-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in checks.items()]
lines.append(f"OVERALL {'PASS' if passed else 'FAIL'} {sum(checks.values())}/{len(checks)} checks")
(ROOT/'tests/alpha-beta-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if passed else 1)

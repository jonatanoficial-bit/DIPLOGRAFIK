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
checks['data_file_exists']=exists('src/data/scenarioTutorialData.js')
checks['system_file_exists']=exists('src/systems/scenarioTutorial.js')
checks['state_factory_includes_scenario_tutorial']=contains('src/core/stateFactory.js','scenarioTutorial: createScenarioTutorialState()')
checks['core_loop_processes_monthly']=contains('src/systems/coreLoop.js','processScenarioTutorialMonth')
checks['game_actions_include_pack']=contains('src/game.js','setScenarioPack')
checks['game_actions_include_track']=contains('src/game.js','setTutorialTrack')
checks['game_actions_include_action_runner']=contains('src/game.js','runScenarioTutorialAction')
checks['render_imports_snapshot']=contains('src/ui/render.js','calculateScenarioTutorialSnapshot')
checks['render_has_overview_panel']=contains('src/ui/render.js','scenarioTutorialOverview')
checks['render_has_mission_panel']=contains('src/ui/render.js','onboardingMissionPanel')
checks['index_has_scenario_panels']=contains('index.html','scenarioPackPanel') and contains('index.html','tutorialTrackPanel')
checks['tutorial_steps_updated']=contains('src/data/tutorialData.js','scenario_tutorial') and contains('src/ui/tutorial.js','diplocraft_tutorial_done_v178')
checks['i18n_seed_has_phase_keys']=contains('tools/i18n_seed.json','scenario.phaseName') and contains('tools/i18n_seed.json','scenario.action.archive.title')
checks['build_config_phase26']=contains('build.config.json','"stage_number": 26') and contains('build.config.json','SCENARIO_TUTORIAL_VERIFIED')
checks['package_script_registered']=contains('package.json','test:scenario-tutorial')
checks['guide_exists']=exists('SCENARIO_TUTORIAL_GUIDE.md')
checks['known_issues_exists']=exists('KNOWN_ISSUES_PHASE_26.md')
checks['upload_prompt_preserved']=exists('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt') and contains('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt','DIPLOGRAFIK.git')
checks['scenario_pack_count_4']=len(re.findall(r'nameKey:"scenario\.pack\.', text('src/data/scenarioTutorialData.js'))) == 4
checks['track_count_4']=len(re.findall(r'nameKey:"scenario\.track\.', text('src/data/scenarioTutorialData.js'))) == 4
checks['mission_count_8']=len(re.findall(r'nameKey:"scenario\.mission\.', text('src/data/scenarioTutorialData.js'))) == 8
checks['action_count_8']=len(re.findall(r'titleKey:"scenario\.action\.', text('src/data/scenarioTutorialData.js'))) == 8
checks['save_schema_preserved']=contains('build.config.json','"save_schema": 3') and contains('build.config.json','diplocraft_save_v101')
checks['no_standalone_marker']=not contains('build.config.json','Standalone') and not contains('README.md','Standalone')
passed=all(checks.values())
result={'passed':passed,'check_count':len(checks),'checks':checks}
(ROOT/'tests/scenario-tutorial-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in checks.items()]
lines.append(f"OVERALL {'PASS' if passed else 'FAIL'} {sum(checks.values())}/{len(checks)} checks")
(ROOT/'tests/scenario-tutorial-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if passed else 1)

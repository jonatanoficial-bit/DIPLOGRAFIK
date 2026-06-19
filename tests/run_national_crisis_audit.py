#!/usr/bin/env python3
from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[1]
checks={}
def exists(p): return (ROOT/p).exists()
def contains(p, text):
    path=ROOT/p
    return path.exists() and text in path.read_text(encoding='utf-8')
checks['data_file_exists']=exists('src/data/nationalCrisisData.js')
checks['system_file_exists']=exists('src/systems/nationalCrisis.js')
checks['state_factory_includes_national_crisis']=contains('src/core/stateFactory.js','nationalCrisis: createNationalCrisisState()')
checks['core_loop_processes_monthly']=contains('src/systems/coreLoop.js','processNationalCrisisMonth')
checks['game_actions_include_protocol']=contains('src/game.js','setNationalCrisisProtocol')
checks['game_actions_include_action_runner']=contains('src/game.js','runNationalCrisisAction')
checks['render_imports_system']=contains('src/ui/render.js','calculateNationalCrisisSnapshot')
checks['render_has_protocol_panel']=contains('src/ui/render.js','nationalCrisisProtocolPanel')
checks['render_has_domain_panel']=contains('src/ui/render.js','nationalCrisisDomainPanel')
checks['render_has_scenario_panel']=contains('src/ui/render.js','nationalCrisisScenarioPanel')
checks['index_has_upload_prompt']=exists('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt')
checks['index_has_crisis_panels']=contains('index.html','nationalCrisisActions') and contains('index.html','nationalCrisisHistory')
checks['i18n_seed_has_phase_keys']=contains('tools/i18n_seed.json','nationalCrisis.phaseName') and contains('tools/i18n_seed.json','nationalCrisis.action.compact.title')
checks['build_config_phase24']=contains('build.config.json','"stage_number": 24') and contains('build.config.json','NATIONAL_CRISIS_VERIFIED')
checks['package_script_registered']=contains('package.json','test:national-crisis')
checks['guide_exists']=exists('NATIONAL_CRISIS_GUIDE.md')
checks['known_issues_exists']=exists('KNOWN_ISSUES_PHASE_24.md')
checks['protocol_count_4']=contains('src/data/nationalCrisisData.js','CRISIS_PROTOCOLS') and len(re.findall(r'id:"[^"]+"', (ROOT/'src/data/nationalCrisisData.js').read_text(encoding='utf-8'))) >= 22
checks['action_count_8']=len(re.findall(r'titleKey:"nationalCrisis\.action\.', (ROOT/'src/data/nationalCrisisData.js').read_text(encoding='utf-8'))) == 8
checks['scenario_count_4']=len(re.findall(r'nameKey:"nationalCrisis\.scenario\.', (ROOT/'src/data/nationalCrisisData.js').read_text(encoding='utf-8'))) == 4
checks['save_schema_preserved']=contains('build.config.json','"save_schema": 3') and contains('build.config.json','diplocraft_save_v101')
checks['no_standalone_marker']=not contains('build.config.json','Standalone') and not contains('README.md','Standalone')
passed=all(checks.values())
result={'passed':passed,'check_count':len(checks),'checks':checks}
(ROOT/'tests/national-crisis-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in checks.items()]
lines.append(f"OVERALL {'PASS' if passed else 'FAIL'} {sum(checks.values())}/{len(checks)} checks")
(ROOT/'tests/national-crisis-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if passed else 1)

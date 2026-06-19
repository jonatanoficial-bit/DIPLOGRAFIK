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
checks['data_file_exists']=exists('src/data/internationalLaunchData.js')
checks['system_file_exists']=exists('src/systems/internationalLaunch.js')
checks['state_factory_includes_international_launch']=contains('src/core/stateFactory.js','internationalLaunch: createInternationalLaunchState()')
checks['core_loop_processes_monthly']=contains('src/systems/coreLoop.js','processInternationalLaunchMonth') and contains('src/systems/coreLoop.js','monthly.internationalLaunch')
checks['game_actions_include_market']=contains('src/game.js','setInternationalMarket')
checks['game_actions_include_action_runner']=contains('src/game.js','runInternationalLaunchAction')
checks['render_imports_snapshot']=contains('src/ui/render.js','calculateInternationalLaunchSnapshot')
checks['render_has_overview_panel']=contains('src/ui/render.js','internationalLaunchOverview')
checks['render_has_actions_panel']=contains('src/ui/render.js','internationalLaunchActions')
checks['index_has_release_panels']=contains('index.html','internationalLaunchOverview') and contains('index.html','internationalLaunchGates') and contains('index.html','internationalLaunchActions')
checks['i18n_seed_has_phase_keys']=contains('tools/i18n_seed.json','intl.phaseName') and contains('tools/i18n_seed.json','intl.action.ops.title')
checks['build_config_phase29']=contains('build.config.json','"stage_number": 29') and contains('build.config.json','GOLD_V2_INTERNATIONAL_VERIFIED')
checks['package_script_registered']=contains('package.json','test:international-launch')
checks['guide_exists']=exists('GOLD_V2_INTERNATIONAL_GUIDE.md')
checks['known_issues_exists']=exists('KNOWN_ISSUES_PHASE_29.md')
checks['upload_prompt_preserved']=exists('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt') and contains('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt','DIPLOGRAFIK.git')
checks['market_count_4']=len(re.findall(r'nameKey:"intl\.market\.', text('src/data/internationalLaunchData.js'))) == 4
checks['gate_count_8']=len(re.findall(r'nameKey:"intl\.gate\.', text('src/data/internationalLaunchData.js'))) == 8
checks['action_count_8']=len(re.findall(r'titleKey:"intl\.action\.', text('src/data/internationalLaunchData.js'))) == 8
checks['node_test_exists']=exists('tests/unit/international-launch.test.js')
checks['save_schema_preserved']=contains('build.config.json','"save_schema": 3') and contains('build.config.json','diplocraft_save_v101')
checks['no_standalone_marker']=not contains('build.config.json','Standalone') and not contains('README.md','Standalone')
passed=all(checks.values())
result={'passed':passed,'check_count':len(checks),'checks':checks}
(ROOT/'tests/international-launch-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in checks.items()]
lines.append(f"OVERALL {'PASS' if passed else 'FAIL'} {sum(checks.values())}/{len(checks)} checks")
(ROOT/'tests/international-launch-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if passed else 1)

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
checks['data_file_exists']=exists('src/data/electoralCareerData.js')
checks['system_file_exists']=exists('src/systems/electoralCareer.js')
checks['state_factory_includes_electoral_career']=contains('src/core/stateFactory.js','electoralCareer: createElectoralCareerState()')
checks['core_loop_processes_monthly']=contains('src/systems/coreLoop.js','processElectoralCareerMonth')
checks['core_loop_registers_election_result']=contains('src/systems/coreLoop.js','registerElectionResult')
checks['game_actions_include_strategy']=contains('src/game.js','setElectoralStrategy')
checks['game_actions_include_action_runner']=contains('src/game.js','runElectoralCareerAction')
checks['render_imports_snapshot']=contains('src/ui/render.js','calculateElectoralSnapshot')
checks['render_has_strategy_panel']=contains('src/ui/render.js','electoralStrategyPanel')
checks['render_has_segments_panel']=contains('src/ui/render.js','electoralSegmentsPanel')
checks['render_has_history_panel']=contains('src/ui/render.js','electoralHistory')
checks['index_has_electoral_panels']=contains('index.html','electoralActions') and contains('index.html','careerTimelinePanel')
checks['i18n_seed_has_phase_keys']=contains('tools/i18n_seed.json','electoral.phaseName') and contains('tools/i18n_seed.json','electoral.action.legacy.title')
checks['build_config_phase25']=contains('build.config.json','"stage_number": 25') and contains('build.config.json','ELECTORAL_CAREER_VERIFIED')
checks['package_script_registered']=contains('package.json','test:electoral-career')
checks['guide_exists']=exists('ELECTORAL_CAREER_GUIDE.md')
checks['known_issues_exists']=exists('KNOWN_ISSUES_PHASE_25.md')
checks['upload_prompt_preserved']=exists('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt') and contains('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt','DIPLOGRAFIK.git')
checks['strategy_count_4']=len(re.findall(r'id:\"[^\"]+\"', text('src/data/electoralCareerData.js').split('ELECTORAL_SEGMENTS')[0])) >= 4
checks['action_count_8']=len(re.findall(r'titleKey:\"electoral\.action\.', text('src/data/electoralCareerData.js'))) == 8
checks['segment_count_6']=len(re.findall(r'nameKey:\"electoral\.segment\.', text('src/data/electoralCareerData.js'))) == 6
checks['save_schema_preserved']=contains('build.config.json','"save_schema": 3') and contains('build.config.json','diplocraft_save_v101')
checks['no_standalone_marker']=not contains('build.config.json','Standalone') and not contains('README.md','Standalone')
passed=all(checks.values())
result={'passed':passed,'check_count':len(checks),'checks':checks}
(ROOT/'tests/electoral-career-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in checks.items()]
lines.append(f"OVERALL {'PASS' if passed else 'FAIL'} {sum(checks.values())}/{len(checks)} checks")
(ROOT/'tests/electoral-career-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if passed else 1)

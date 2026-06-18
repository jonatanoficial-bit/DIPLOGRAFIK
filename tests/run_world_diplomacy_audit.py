#!/usr/bin/env python3
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]

def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')

config = json.loads(read('build.config.json'))
seed = json.loads(read('tools/i18n_seed.json'))
checks = {}
checks['version_is_phase_22'] = config.get('version') == '1.7.4' and config.get('stage_number') == 22
checks['status_verified'] = config.get('status') == 'WORLD_DIPLOMACY_VERIFIED'
checks['base_is_phase_21'] = config.get('base_version') == '1.7.3' and 'Imprensa' in config.get('base_stage','')
checks['save_schema_preserved'] = config.get('save_schema') == 3 and config.get('save_key') == 'diplocraft_save_v101'
checks['upload_prompt_present'] = (ROOT/'UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt').exists() and '/c/Users/jonat/Desktop/GAME/¨2026/DIPLOCRAFT' in read('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt')
checks['data_module_exists'] = (ROOT/'src/data/worldDiplomacyData.js').exists()
checks['system_module_exists'] = (ROOT/'src/systems/worldDiplomacy.js').exists()
checks['state_factory_integrates_world_diplomacy'] = 'createWorldDiplomacyState' in read('src/core/stateFactory.js') and 'worldDiplomacy:' in read('src/core/stateFactory.js')
checks['core_loop_monthly_cycle_integrates_world_diplomacy'] = 'processWorldDiplomacyMonth' in read('src/systems/coreLoop.js') and 'reports.monthly.worldDiplomacy' in read('src/systems/coreLoop.js')
checks['game_actions_bound'] = 'setWorldDiplomacyDoctrine' in read('src/game.js') and 'runWorldDiplomacyAction' in read('src/game.js')
checks['render_has_world_diplomacy_panels'] = all(token in read('src/ui/render.js') for token in ['worldDiplomacyDoctrinePanel','globalBlocsPanel','worldAgendaPanel','data-world-diplomacy-action'])
checks['index_has_world_diplomacy_sections'] = all(token in read('index.html') for token in ['worldDiplomacy.overviewTitle','worldDiplomacyDoctrinePanel','globalBlocsPanel','worldAgendaPanel'])
checks['four_doctrines_defined'] = read('src/data/worldDiplomacyData.js').count('nameKey:"worldDiplomacy.doctrine.') >= 4
checks['six_blocs_defined'] = read('src/data/worldDiplomacyData.js').count('nameKey:"worldDiplomacy.bloc.') >= 6
checks['six_agendas_defined'] = read('src/data/worldDiplomacyData.js').count('nameKey:"worldDiplomacy.agenda.') >= 6
checks['eight_actions_defined'] = read('src/data/worldDiplomacyData.js').count('titleKey:"worldDiplomacy.action.') >= 8
checks['world_diplomacy_i18n_pt_en_es'] = all(key in seed.get('entries',{}) and all(seed['entries'][key].get(loc) for loc in ['pt-BR','en','es']) for key in ['worldDiplomacy.overviewTitle','worldDiplomacy.action.export.title','worldDiplomacy.diagnosis.risk'])
checks['package_script_added'] = 'test:world-diplomacy' in json.loads(read('package.json')).get('scripts',{})
checks['quality_gate_mentions_phase_22'] = 'world-diplomacy-audit' in read('tests/run_quality_gate.py')
checks['all_previous_phase_guides_preserved'] = all((ROOT/name).exists() for name in ['MEDIA_PUBLIC_OPINION_GUIDE.md','CABINET_ADMINISTRATION_GUIDE.md','GOVERNMENT_INSTITUTIONS_GUIDE.md','BUDGET_TAX_GUIDE.md','DEEP_ECONOMY_GUIDE.md','COUNTRY_POPULATION_GUIDE.md'])
checks['phase_22_guides_added'] = (ROOT/'WORLD_DIPLOMACY_GUIDE.md').exists() and (ROOT/'KNOWN_ISSUES_PHASE_22.md').exists()
checks['no_asset_paths_changed'] = config.get('asset_paths_changed', False) is False and (ROOT/'CAMINHOS_ASSETS_JOGO.txt').exists()
result = {'project':'DIPLOCRAFT','version':config.get('version'),'phase':config.get('stage_name'),'check_count':len(checks),'checks':checks,'passed':all(checks.values())}
(ROOT/'tests/world-diplomacy-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in checks.items()]
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} {sum(checks.values())}/{len(checks)} checks")
(ROOT/'tests/world-diplomacy-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

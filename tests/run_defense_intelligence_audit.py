#!/usr/bin/env python3
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]

def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')

config = json.loads(read('build.config.json'))
seed = json.loads(read('tools/i18n_seed.json'))
entries = seed.get('entries', {})
checks = {}
checks['version_is_phase_23'] = config.get('version') == '1.7.5' and config.get('stage_number') == 23
checks['status_verified'] = config.get('status') == 'DEFENSE_INTELLIGENCE_VERIFIED'
checks['base_is_phase_22'] = config.get('base_version') == '1.7.4' and 'Diplomacia' in config.get('base_stage','')
checks['save_schema_preserved'] = config.get('save_schema') == 3 and config.get('save_key') == 'diplocraft_save_v101'
checks['upload_prompt_present'] = (ROOT/'UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt').exists() and '/c/Users/jonat/Desktop/GAME/¨2026/DIPLOCRAFT' in read('UPLOAD_GIT_BASH_PROMPT_DIPLOCRAFT.txt')
checks['data_module_exists'] = (ROOT/'src/data/defenseIntelligenceData.js').exists()
checks['system_module_exists'] = (ROOT/'src/systems/defenseIntelligence.js').exists()
checks['state_factory_integrates_defense'] = 'createDefenseIntelligenceState' in read('src/core/stateFactory.js') and 'defenseIntelligence:' in read('src/core/stateFactory.js')
checks['core_loop_monthly_cycle_integrates_defense'] = 'processDefenseIntelligenceMonth' in read('src/systems/coreLoop.js') and 'reports.monthly.defenseIntelligence' in read('src/systems/coreLoop.js')
checks['game_actions_bound'] = 'setDefenseDoctrine' in read('src/game.js') and 'runDefenseIntelligenceAction' in read('src/game.js')
checks['render_has_defense_panels'] = all(token in read('src/ui/render.js') for token in ['defenseDoctrinePanel','defenseBranches','defenseIntelActions','intelligenceDesks','defenseIntelHistory'])
checks['index_has_defense_sections'] = all(token in read('index.html') for token in ['defense.commandTitle','defenseDoctrinePanel','defenseBranches','defenseIntelActions','intelligenceDesks'])
checks['four_doctrines_defined'] = read('src/data/defenseIntelligenceData.js').count('nameKey:"defense.doctrine.') >= 4
checks['six_branches_defined'] = read('src/data/defenseIntelligenceData.js').count('nameKey:"defense.branch.') >= 6
checks['six_intelligence_desks_defined'] = read('src/data/defenseIntelligenceData.js').count('nameKey:"defense.desk.') >= 6
checks['eight_actions_defined'] = read('src/data/defenseIntelligenceData.js').count('titleKey:"defense.action.') >= 8
checks['incidents_defined'] = read('src/data/defenseIntelligenceData.js').count('titleKey:"defense.incident.') >= 5
keys = ['defense.commandTitle','defense.action.cyber.title','defense.diagnosis.risk','defense.branch.cyber.name','defense.desk.strategic.name']
checks['defense_i18n_pt_en_es'] = all(key in entries and all(entries[key].get(loc) for loc in ['pt-BR','en','es']) for key in keys)
checks['package_script_added'] = 'test:defense-intelligence' in json.loads(read('package.json')).get('scripts',{})
checks['quality_gate_mentions_phase_23'] = 'defense-intelligence-audit' in read('tests/run_quality_gate.py')
checks['previous_phase_guides_preserved'] = all((ROOT/name).exists() for name in ['WORLD_DIPLOMACY_GUIDE.md','MEDIA_PUBLIC_OPINION_GUIDE.md','CABINET_ADMINISTRATION_GUIDE.md','GOVERNMENT_INSTITUTIONS_GUIDE.md','BUDGET_TAX_GUIDE.md','DEEP_ECONOMY_GUIDE.md'])
checks['phase_23_guides_added'] = (ROOT/'DEFENSE_INTELLIGENCE_GUIDE.md').exists() and (ROOT/'KNOWN_ISSUES_PHASE_23.md').exists()
checks['no_asset_paths_changed'] = config.get('asset_paths_changed', False) is False and (ROOT/'CAMINHOS_ASSETS_JOGO.txt').exists()
checks['config_declares_defense_intelligence'] = config.get('defense_intelligence',{}).get('enabled') is True and config.get('defense_intelligence',{}).get('branches') == 6
result = {'project':'DIPLOCRAFT','version':config.get('version'),'phase':config.get('stage_name'),'check_count':len(checks),'checks':checks,'passed':all(checks.values())}
(ROOT/'tests/defense-intelligence-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[f"{'PASS' if v else 'FAIL'} {k}" for k,v in checks.items()]
lines.append(f"OVERALL {'PASS' if result['passed'] else 'FAIL'} {sum(checks.values())}/{len(checks)} checks")
(ROOT/'tests/defense-intelligence-output.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(0 if result['passed'] else 1)

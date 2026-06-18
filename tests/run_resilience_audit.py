from pathlib import Path
import json, re

ROOT = Path('.').resolve()
config = json.loads((ROOT/'build.config.json').read_text(encoding='utf-8'))
browser = json.loads((ROOT/'tests/browser-results.json').read_text(encoding='utf-8'))
storage = (ROOT/'src/core/storage.js').read_text(encoding='utf-8')
resilience = (ROOT/'src/core/resilience.js').read_text(encoding='utf-8')
boundary = (ROOT/'src/core/errorBoundary.js').read_text(encoding='utf-8')
html = (ROOT/'index.html').read_text(encoding='utf-8')
css = (ROOT/'src/styles.css').read_text(encoding='utf-8')

required_dynamic = {
  'save_envelope_schema3', 'snapshot_rotation_active', 'watchdog_installed',
  'pending_transaction_recovered', 'transaction_recovery_keeps_game_playable',
  'corrupt_save_quarantined', 'snapshot_auto_restored', 'game_continues_after_recovery',
  'incident_id_visible', 'emergency_snapshot_created', 'manual_snapshot_restore_recorded',
  'safe_mode_after_repeated_failures', 'diagnostics_api_available', 'health_panel_rendered'
}

def every_case(check):
    return len(browser) == 4 and all(case.get('checks', {}).get(check) is True for case in browser)

checks = {
  'schema3_declared': config.get('save_schema') == 3,
  'save_key_preserved': config.get('save_key') == 'diplocraft_save_v101',
  'transactional_write_present': all(token in storage for token in ['pending', 'localStorage.setItem(keys.pending', 'recoverPendingTransaction']),
  'checksum_validation_present': all(token in storage for token in ['checksum:', 'checksum(JSON.stringify(core))', 'checksum divergente']),
  'snapshot_rotation_bounded': 'MAX_SNAPSHOTS = 3' in storage and 'rotateSnapshotRaw' in storage,
  'emergency_snapshot_present': 'saveEmergencySnapshot' in storage and 'keys.emergency' in storage,
  'legacy_schema_readable': 'legacy-direct' in storage and 'migrateLegacyStorage' in storage,
  'watchdog_present': 'setInterval' in resilience and 'eventLoopLagMs' in resilience and 'lastHeartbeatAgeMs' in resilience,
  'boot_guard_present': all(token in resilience for token in ['BOOT_GUARD_KEY', 'detectBootLoop', 'markBootStable']),
  'autosave_multi_trigger': all(token in resilience for token in ['AUTOSAVE_INTERVAL', 'visibilitychange', 'pagehide', 'scheduleAutosave']),
  'safe_mode_present': all(token in resilience for token in ['SAFE_MODE_KEY', 'setSafeMode', 'recentFatalCount']),
  'incident_log_bounded': 'MAX_INCIDENTS = 12' in resilience and 'INCIDENT_KEY' in resilience,
  'diagnostic_export_present': 'exportDiagnostics' in resilience and 'DIPLOCRAFT_diagnostico' in resilience,
  'recovery_ui_complete': all(f'id="{id_}"' in html for id_ in ['restoreSnapshot','safeModeRestart','exportDiagnostics','errorIncident','errorRecoveryInfo','restoreLatestSave','safeModeToggle','diagnosticDownload']),
  'safe_mode_css_present': '.safe-mode' in css and '.safeModeBanner' in css,
  'boundary_records_incident': 'recordIncident' in boundary and 'Incidente ${incident.id}' in boundary,
  'four_target_viewports_pass': len(browser) == 4 and all(case.get('passed') for case in browser),
  'dynamic_resilience_checks_pass': all(every_case(name) for name in required_dynamic),
  'no_runtime_errors_in_audit': all(not case.get('page_errors') and not case.get('console_errors') for case in browser),
}

result = {
  'project': config['project'],
  'version': config['version'],
  'phase': config['stage_name'],
  'viewports': [case['name'] for case in browser],
  'required_dynamic_checks': sorted(required_dynamic),
  'checks': checks,
  'passed_count': sum(bool(v) for v in checks.values()),
  'total_checks': len(checks),
  'passed': all(checks.values()),
}
Path('tests/resilience-audit-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(0 if result['passed'] else 1)

#!/usr/bin/env bash
set -euo pipefail
python3 tools/build_pwa_assets.py
python3 tools/generate_i18n.py
python3 tools/generate_i18n.py --check
python3 tools/build_assets.py
python3 tools/generate_build.py
python3 tools/generate_build.py --check
python3 tests/run_asset_pipeline_audit.py
python3 tests/build_harness.py
for CASE in mobile_360x640 mobile_390x844 tablet_768x1024 desktop_1366x768; do
  DIPLOCRAFT_BROWSER_CASE="$CASE" python3 tests/run_browser_audit.py > "tests/browser-audit-output-$CASE.txt"
done
python3 tests/aggregate_browser_audit.py
for CASE in phone_320x568 phone_360x640 phone_390x844 phone_landscape_844x390 tablet_768x1024; do
  DIPLOCRAFT_MOBILE_CASE="$CASE" python3 tests/run_mobile_first_audit.py > "tests/mobile-first-output-$CASE.txt"
done
python3 tests/aggregate_mobile_audit.py
for CASE in tablet_landscape_1024x768 laptop_1366x768 desktop_fullhd_1920x1080 desktop_ultrawide_2560x1080; do
  DIPLOCRAFT_DESKTOP_CASE="$CASE" python3 tests/run_responsive_desktop_audit.py > "tests/responsive-desktop-output-$CASE.txt"
done
python3 tests/aggregate_responsive_desktop_audit.py
python3 tests/run_static_audit.py
python3 tests/run_clean_base_audit.py
python3 tests/run_build_truth_audit.py
python3 tests/run_drift_guard_test.py
python3 tests/run_node_tests.py
node tests/run_simulation_matrix.mjs
python3 tests/run_resilience_audit.py
python3 tests/run_pwa_audit.py
python3 tests/run_i18n_audit.py
python3 tests/run_localization_complete_audit.py
python3 tests/run_web_asset_audit.py
for CASE in desktop_short_1024x600 desktop_1366x768 desktop_fullhd_1920x1080 tablet_mouse_1024x768 mobile_320x568 mobile_360x640 mobile_390x844 mobile_landscape_844x390 tablet_touch_768x1024; do
  DIPLOCRAFT_SCROLL_CASE="$CASE" python3 tests/run_scroll_touch_audit.py > "tests/scroll-touch-output-$CASE.txt"
done
python3 tests/aggregate_scroll_touch_audit.py
python3 tests/run_save_architecture_audit.py
python3 tests/run_core_loop_2_audit.py
python3 tests/run_government_creation_audit.py
python3 tests/run_population_audit.py
python3 tests/run_deep_economy_audit.py
python3 tests/run_budget_tax_audit.py
python3 tests/run_government_institutions_audit.py
python3 tests/run_cabinet_administration_audit.py
python3 tests/run_media_public_opinion_audit.py
python3 tests/run_world_diplomacy_audit.py
python3 tests/run_defense_intelligence_audit.py
python3 tests/run_national_crisis_audit.py
python3 tests/run_electoral_career_audit.py
python3 tests/run_scenario_tutorial_audit.py
python3 tests/run_alpha_beta_audit.py
python3 tests/run_gold_master_audit.py
python3 tests/run_international_launch_audit.py
python3 tests/run_quality_gate.py
